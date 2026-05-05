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
import { calculateDistribution } from "@/lib/api";

export default function PaymentSplit() {
  const { user, update, uid } = useAuth();

  const defaultSplits = [
    { key: "main", name: "Main Account", value: 70, color: "#10b981" },
    { key: "agent", name: "Agent Commission", value: 15, color: "#3b82f6" },
    { key: "technology", name: "Technology Fund", value: 10, color: "#8b5cf6" },
    { key: "operation", name: "Operational Costs", value: 5, color: "#f59e0b" },
  ];

  const [splits, setSplits] = useState(defaultSplits);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [payments, setPayments] = useState({});
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
    admin: "Main Account",
    agent: "Agent Commission",
    technology: "Technology Fund",
    operation: "Operational Costs",
  };

  const displayToKey = {
    "Main Account": "admin",
    "Agent Commission": "agent",
    "Technology Fund": "technology",
    "Operational Costs": "operation",
  };

  const normalizeSplits = (config) => {
    if (!config) return defaultSplits;
    let arr = [];

    if (Array.isArray(config)) {
      arr = config.map((item, idx) => ({
        key:
          item?.key ||
          displayToKey[item?.name] ||
          displayToKey[item?.label] ||
          undefined,
        name:
          item?.name ||
          keyToDisplay[item?.key] ||
          item?.label ||
          `Split ${idx + 1}`,
        value:
          typeof item?.value === "number"
            ? item.value
            : typeof item?.percentage === "number"
              ? item.percentage
              : 0,
        color: item?.color || colorPalette[idx % colorPalette.length],
      }));
    } else if (typeof config === "object" && config !== null) {
      arr = Object.entries(config).map(([key, value], idx) => ({
        key,
        name: keyToDisplay[key] || key,
        value: Number(value) || 0,
        color: colorPalette[idx % colorPalette.length],
      }));
    }

    return arr.length ? arr : defaultSplits;
  };

  const calculateSplitAmounts = (paymentsData, currentSplits) => {
    // Calculate total from all split amounts
    const total = Object.values(paymentsData).reduce(
      (sum, amount) => sum + (amount || 0),
      0,
    );
    setTotalRevenue(total);

    const amounts = {};
    currentSplits.forEach((split) => {
      const splitKey = split.key || split.name;
      amounts[splitKey] = {
        name: split.name,
        amount: paymentsData[splitKey] || 0,
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

      // const distribution = await calculateDistribution(config, user?.uid ?? "");
      // console.log("Calculated distribution:", distribution);
      // setPayments(distribution.data);

      const normalized = normalizeSplits(config);
      setSplits(normalized);

      // Fetch payments and calculate splits
      // calculateSplitAmounts(distribution.data, normalized);

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

    // Recalculate split amounts with new percentages
    calculateSplitAmounts(payments, newSplits);
  };

  const totalAllocation = splits.reduce((acc, curr) => acc + curr.value, 0);

  const handleSave = async () => {
    if (totalAllocation !== 100) {
      setStatus({ type: "error", msg: "Total allocation must be 100%" });
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      const payloadConfig = (splits || []).reduce((acc, curr) => {
        const key = curr.key || displayToKey[curr.name] || curr.name;
        acc[key] = curr.value;
        return acc;
      }, {});
      console.log("Saving config:", payloadConfig);
      await update({ paymentConfig: payloadConfig }, uid ?? user?.uid ?? "");
      setStatus({ type: "success", msg: "Payment configuration saved" });
    } catch (e) {
      setStatus({ type: "error", msg: e.message || "Failed to save config" });
    } finally {
      setSaving(false);
    }
  };

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
            <button
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
            </button>
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
          Distribution amount from all payments
        </p>
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
