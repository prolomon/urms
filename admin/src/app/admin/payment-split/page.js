"use client";

import React, { useState, useEffect } from "react";
import { Save, Info, PieChart as PieChartIcon } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { useAuth } from "@/context/AuthContext";
import { getPayments } from "@/lib/services/payments";
import { getMembers } from "@/lib/services/member";

export default function PaymentSplit() {
  const { user, update, uid } = useAuth();
 
  const defaultSplits = [
    { key: "main", name: "Main Account", value: 70, color: "#10b981" },
    { key: "agent", name: "Agent Commission", value: 15, color: "#3b82f6" },
    { key: "technology", name: "Technology Fund", value: 10, color: "#8b5cf6" },
  ];

  const [splits, setSplits] = useState(defaultSplits);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [paymentChecks, setPaymentChecks] = useState([]);
  const [grossRevenue, setGrossRevenue] = useState(0);
  const [totalDebt, setTotalDebt] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [splitAmounts, setSplitAmounts] = useState({});

  // Currency formatter
  const currencyFormatter = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const colorPalette = [
    "#10b981",
    "#3b82f6",
    "#8b5cf6",
    "#f59e0b",
    "#ef4444",
    "#14b8a6",
    "#6366f1",
    "#22c55e",
  ];

  const keyToDisplay = {
    main: "Main Account",
    agent: "Agent Commission",
    technology: "Technology Fund",
  };

  const displayToKey = {
    "Main Account": "main",
    "Agent Commission": "agent",
    "Technology Fund": "technology",
  };

  const normalizeSplits = (config) => {
    // Only allow these three split keys (in this order)
    const allowedKeys = ["main", "agent", "technology"];
    const synonyms = { admin: "main" };

    const toKey = (k) => {
      if (!k) return undefined;
      const low = String(k).toLowerCase();
      if (allowedKeys.includes(low)) return low;
      if (synonyms[low]) return synonyms[low];
      return undefined;
    };

    if (!config) return defaultSplits;

    const itemsMap = new Map();

    if (Array.isArray(config)) {
      config.forEach((item, idx) => {
        const rawKey = item?.key || item?.name || item?.label;
        const key = toKey(rawKey);
        const value = typeof item?.value === "number" ? item.value : typeof item?.percentage === "number" ? item.percentage : 0;
        const name = item?.name || keyToDisplay[key] || item?.label || `Split ${idx + 1}`;
        const color = item?.color || colorPalette[idx % colorPalette.length];
        if (key) itemsMap.set(key, { key, name, value, color });
      });
    } else if (typeof config === "object" && config !== null) {
      Object.entries(config).forEach(([k, v], idx) => {
        const key = toKey(k);
        if (!key) return;
        const value = Number(v) || 0;
        const name = keyToDisplay[key] || k;
        const color = colorPalette[idx % colorPalette.length];
        itemsMap.set(key, { key, name, value, color });
      });
    }

    // Ensure we always return the three allowed splits in the canonical order
    return allowedKeys.map((k, idx) => {
      if (itemsMap.has(k)) return itemsMap.get(k);
      // fallback to default if not provided
      const def = defaultSplits.find((d) => d.key === k) || {};
      return { key: k, name: keyToDisplay[k] || def.name || k, value: def.value || 0, color: def.color || colorPalette[idx % colorPalette.length] };
    });
  };

  const extractNetPaymentTotal = (paymentList = []) =>
    paymentList.reduce((sum, payment) => {
      const amount = Number(payment?.amount || 0);
      const debt = Number(payment?.debt || 0);
      const isSuccessful =
        !payment?.status || String(payment.status).toUpperCase() === "SUCCESS";
      if (!isSuccessful) return sum;
      return sum + Math.max(amount - debt, 0);
    }, 0);

  const paymentMatchesDebtRules = (payment = {}) => {
    const amount = Number(payment?.amount || 0);
    const debt = Number(payment?.debt || 0);
    const status = String(payment?.status || "").toUpperCase();

    if (status !== "SUCCESS") {
      return false;
    }

    if (debt === 0) {
      return true;
    }

    return debt !== 0 && debt - amount !== amount;
  };

  const resolvePaymentName = (payment, memberLookup) => {
    const userId = payment?.userId || payment?.uid || payment?.memberId || payment?.customerId;
    const member = memberLookup.get(String(userId || ""));

    return (
      member?.fullname ||
      member?.businessName ||
      payment?.name ||
      payment?.fullName ||
      payment?.customerName ||
      payment?.paymentName ||
      payment?.reference ||
      "Unknown user"
    );
  };

  const calculateSplitAmounts = (baseAmount, currentSplits) => {
    setTotalRevenue(baseAmount);

    const amounts = {};
    currentSplits.forEach((split) => {
      const splitKey = split.key || split.name;
      amounts[splitKey] = {
        name: split.name,
        amount: (baseAmount * Number(split.value || 0)) / 100,
        percentage: split.value,
        color: split.color,
      };
    });
    setSplitAmounts(amounts);
  };

  const loadConfig = async () => {
    setLoading(true);
    try {
      const config = user?.paymentConfig;

      const normalized = normalizeSplits(config);
      setSplits(normalized);

      const ownerId = uid ?? user?.uid ?? "";
      if (!ownerId) {
        setPaymentChecks([]);
        setGrossRevenue(0);
        setTotalDebt(0);
        calculateSplitAmounts(0, normalized);
        setStatus(null);
        return;
      }

      const memberResponse = await getMembers(1, 1000, ownerId);
      const members = Array.isArray(memberResponse?.data) ? memberResponse.data : [];

      const memberLookup = new Map(
        members
          .filter((member) => member?.uid || member?.id)
          .map((member) => [String(member?.uid || member?.id), member]),
      );

      const paymentResponse = await getPayments();
      const allPayments = Array.isArray(paymentResponse?.data)
        ? paymentResponse.data
        : [];
      
        console.log(allPayments, memberLookup, paymentResponse);

      const filteredPayments = allPayments
        .filter((payment) => {
          const userId = payment?.userId || payment?.uid || payment?.memberId || payment?.customerId;
          return memberLookup.has(String(userId || ""));
        })
        .filter(paymentMatchesDebtRules)
        .map((payment) => {
          const amount = Number(payment?.amount || 0);
          const debt = Number(payment?.debt || 0);
          const net = Math.max(amount - debt, 0);
          return {
            id: payment?.reference || `${payment?.userId || "payment"}-${payment?.date || "row"}`,
            userId: payment?.userId || payment?.uid || payment?.memberId || "",
            name: resolvePaymentName(payment, memberLookup),
            reference: payment?.reference || "",
            status: payment?.status || "",
            amount,
            debt,
            net,
            date: payment?.date || payment?.createdAt || null,
          };
        });

      const grossTotal = filteredPayments.reduce((sum, item) => sum + item.amount, 0);
      const debtTotal = filteredPayments.reduce((sum, item) => sum + item.debt, 0);
      const netTotal = filteredPayments.reduce((sum, item) => sum + item.net, 0);

      setPaymentChecks(filteredPayments);
      setGrossRevenue(grossTotal);
      setTotalDebt(debtTotal);

      calculateSplitAmounts(netTotal, normalized);

      setStatus(null);
    } catch (e) {
      console.log("Error loading config:", e);
      setStatus({ type: "error", msg: e.message || "Failed to load config" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSplitChange = (index, newValue) => {
    const val = parseInt(newValue, 10) || 0;
    const newSplits = splits.map((split, idx) =>
      idx === index ? { ...split, value: val } : split,
    );
    setSplits(newSplits);

    // Recalculate split amounts from the net distributable base.
    calculateSplitAmounts(totalRevenue, newSplits);
  };

  const totalAllocation = splits.reduce((acc, curr) => acc + curr.value, 0);

  // const handleSave = async () => {
  //   if (totalAllocation !== 100) {
  //     setStatus({ type: "error", msg: "Total allocation must be 100%" });
  //     return;
  //   }
  //   setSaving(true);
  //   setStatus(null);
  //   try {
  //     const payloadConfig = (splits || []).reduce((acc, curr) => {
  //       const key = curr.key || displayToKey[curr.name] || curr.name;
  //       acc[key] = curr.value;
  //       return acc;
  //     }, {});
  //     console.log("Saving config:", payloadConfig);
  //     await update({ paymentConfig: payloadConfig }, uid ?? user?.uid ?? "");
  //     setStatus({ type: "success", msg: "Payment configuration saved" });
  //   } catch (e) {
  //     setStatus({ type: "error", msg: e.message || "Failed to save config" });
  //   } finally {
  //     setSaving(false);
  //   }
  // };

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header Card */}
      <div className="rounded-2xl bg-linear-to-r from-emerald-50 via-white to-cyan-50 p-5 md:p-6 ring-1 ring-emerald-100">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Info className="text-emerald-600" size={28} />
              Payment Split Configuration
            </h1>
            <p className="mt-1 text-sm text-slate-600 md:text-base">
              Define how collected revenue is automatically distributed across
              departments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                totalAllocation === 100
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              Total: {totalAllocation}%
            </span>
            <button
              onClick={loadConfig}
              disabled={loading}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                loading
                  ? "cursor-not-allowed bg-slate-200 text-slate-500"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Reload
            </button>
            {/* <button
              onClick={handleSave}
              disabled={saving || totalAllocation !== 100}
              className={`inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-colors ${
                saving
                  ? "bg-emerald-500 text-white"
                  : totalAllocation !== 100
                    ? "cursor-not-allowed bg-slate-300 text-slate-500"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              <Save size={17} />
              {saving ? "Saving..." : "Save Changes"}
            </button> */}
          </div>
        </div>
      </div>

      {/* Status Message */}
      {status && (
        <div
          className={`rounded-2xl border p-4 ${
            status.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          <p className="text-sm font-semibold">{status.msg}</p>
        </div>
      )}

      {/* Total Revenue Summary */}
      <div className="rounded-2xl bg-white p-5 md:p-6 ring-1 ring-slate-100 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Total Revenue
        </p>
        <h2 className="mt-2 text-3xl font-bold text-emerald-700">
          {currencyFormatter.format(totalRevenue)}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Net distributable revenue after debt deduction
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Gross payments
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-800">
              {currencyFormatter.format(grossRevenue)}
            </p>
          </div>
          <div className="rounded-xl bg-rose-50 p-3">
            <p className="text-xs uppercase tracking-wide text-rose-600">
              Total debt
            </p>
            <p className="mt-1 text-lg font-semibold text-rose-700">
              {currencyFormatter.format(totalDebt)}
            </p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-3">
            <p className="text-xs uppercase tracking-wide text-emerald-500">
              Wallet share
            </p>
            <p className="mt-1 text-lg font-semibold text-emerald-700">
              {currencyFormatter.format(splitAmounts.main?.amount || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Allocation Editor + Chart */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left: Split Configuration */}
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl bg-white p-5 md:p-6 ring-1 ring-slate-100 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <PieChartIcon className="text-emerald-600" size={20} />
                Revenue Allocation
              </h3>
            </div>

            <div className="space-y-3">
              {(loading ? defaultSplits : splits).map((split, idx) => (
                <div
                  key={split.key || split.name}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all hover:border-emerald-200 hover:bg-emerald-50/30"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="h-4 w-4 shrink-0 rounded-full"
                      style={{ backgroundColor: split.color }}
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-slate-800">
                        {split.name}
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full transition-all"
                          style={{
                            width: `${split.value}%`,
                            backgroundColor: split.color,
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2">
                      <input
                        type="number"
                        min={split.key === "technology" ? 10 : 0}
                        max={100}
                        value={split.value}
                        onChange={(e) => handleSplitChange(idx, e.target.value)}
                        className="w-16 text-right text-sm font-bold text-slate-800 outline-none bg-transparent"
                        readOnly
                      />
                      <span className="text-sm font-medium text-slate-500">
                        %
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div
              className={`mt-4 rounded-xl border p-4 transition-all ${
                totalAllocation === 100
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-rose-200 bg-rose-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">
                  Total Allocation
                </span>
                <span
                  className={`text-xl font-extrabold ${
                    totalAllocation === 100
                      ? "text-emerald-700"
                      : "text-rose-700"
                  }`}
                >
                  {totalAllocation}%
                </span>
              </div>
            </div>

            {totalAllocation !== 100 && (
              <p className="mt-2 text-xs font-medium text-rose-600">
                ⚠ Total must equal 100% to save configuration.
              </p>
            )}
          </div>
          
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-600">
              Member Payment Check
            </h4>
            <div className="mt-3 max-h-72 space-y-2 overflow-auto pr-1">
              {paymentChecks.length ? (
                paymentChecks.map((payment) => (
                  <div key={payment.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-slate-800">{payment.name}</span>
                      <span className="font-semibold text-slate-900">
                        {currencyFormatter.format(payment.net)}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <span>Amount: {currencyFormatter.format(payment.amount)}</span>
                      {payment.debt > 0 ? (
                        <span>Debt: {currencyFormatter.format(payment.debt)}</span>
                      ) : null}
                      {payment.reference ? (
                        <span>Ref: {payment.reference}</span>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No matching payments found.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Visual Breakdown */}
        <div className="rounded-2xl bg-white p-5 md:p-6 ring-1 ring-slate-100 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            Visual Breakdown
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={loading ? defaultSplits : splits}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={100}
                  paddingAngle={1}
                  dataKey="value"
                >
                  {(loading ? defaultSplits : splits).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => [
                    `${value}% (${currencyFormatter.format((totalRevenue * value) / 100)})`,
                    name || props.payload.name,
                  ]}
                />
                {/* <Legend verticalAlign="bottom" height={30} /> */}
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-600">
              Distribution Summary
            </h4>
            <div className="space-y-2">
              {(loading ? defaultSplits : splits).map((split) => {
                const splitKey = split.key || split.name;
                const splitAmount = splitAmounts[splitKey]?.amount || 0;
                return (
                  <div
                    key={split.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-slate-600">{split.name}</span>
                    <span className="font-semibold text-slate-800">
                      {currencyFormatter.format(splitAmount)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-slate-300 pt-3 mt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700">Total</span>
                <span className="font-extrabold text-lg text-slate-900">
                  {currencyFormatter.format(totalRevenue)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
