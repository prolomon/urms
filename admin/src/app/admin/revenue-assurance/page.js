"use client";

import React, { useEffect, useMemo, useState } from "react";
import LineChartCard from "../../../components/LineChartCard";
import { getPayments } from "@/lib/services/payments";
import {
  FileText,
  FileSpreadsheet,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  BarChart3,
  Wallet,
  XCircle,
} from "lucide-react";

const paymentTrends = [
  { name: "Week 1", value: 90 },
  { name: "Week 2", value: 88 },
  { name: "Week 3", value: 92 },
  { name: "Week 4", value: 89 },
];

export default function AssurancePage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await getPayments();
        const list = res?.data || res?.payments || [];
        if (!mounted) return;
        setPayments(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error("Failed to load payments", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const escapeCSV = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };

  const parseAmount = (value) => {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const cleaned = value.replace(/[^0-9.-]/g, "");
      const amount = Number(cleaned);
      return Number.isFinite(amount) ? amount : 0;
    }
    return 0;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const filteredPayments = useMemo(() => {
    if (!selectedDate) return payments;
    return (payments || []).filter((payment) => {
      const paymentDate = new Date(payment?.updatedAt || payment?.date || payment?.createdAt);
      return (
        paymentDate.getDate() === selectedDate.getDate() &&
        paymentDate.getMonth() === selectedDate.getMonth() &&
        paymentDate.getFullYear() === selectedDate.getFullYear()
      );
    });
  }, [payments, selectedDate]);

  const normalizedPayments = useMemo(() => {
    return (filteredPayments || []).map((payment) => {
      const status = String(payment?.status || "UNKNOWN").toUpperCase();
      return {
        ...payment,
        businessName: payment.member?.businessName || payment.member?.fullname || payment.businessName || "—",
        businessType: payment.member?.type || payment.businessType || "—",
        category: payment.member?.category || payment.category || "—",
        _amount: parseAmount(payment?.amount),
        _status: status,
      };
    });
  }, [filteredPayments]);

  const metrics = useMemo(() => {
    const totalVolume = normalizedPayments.reduce((sum, payment) => sum + payment._amount, 0);
    const completed = normalizedPayments.filter(
      (payment) => payment._status === "COMPLETED" || payment._status === "SUCCESS",
    );
    const pending = normalizedPayments.filter((payment) => payment._status === "PENDING");
    const failed = normalizedPayments.filter((payment) => payment._status === "FAILED");

    const completedAmount = completed.reduce((sum, payment) => sum + payment._amount, 0);
    const pendingAmount = pending.reduce((sum, payment) => sum + payment._amount, 0);
    const failedAmount = failed.reduce((sum, payment) => sum + payment._amount, 0);

    const compliant = completed.filter((p) => {
      if (!p.due) return true;
      const updated = new Date(p.updatedAt || p.date || p.createdAt);
      const due = new Date(p.due);
      return updated <= due;
    });

    const collectionRate = totalVolume > 0 ? (completedAmount / totalVolume) * 100 : 0;
    const complianceRate = normalizedPayments.length > 0 ? (compliant.length / normalizedPayments.length) * 100 : 0;

    const overdueCount = normalizedPayments.filter((p) => {
      if (p._status === "COMPLETED" || p._status === "SUCCESS") return false;
      if (!p.due) return false;
      return new Date() > new Date(p.due);
    }).length;

    return {
      totalVolume,
      completedAmount,
      pendingAmount,
      failedAmount,
      completedCount: completed.length,
      pendingCount: pending.length,
      failedCount: failed.length,
      totalCount: normalizedPayments.length,
      collectionRate,
      complianceRate,
      overdueCount,
    };
  }, [normalizedPayments]);

  const chartData = useMemo(() => {
    const days = {};
    (payments || []).forEach((payment) => {
      const date = new Date(payment?.updatedAt || payment?.date || payment?.createdAt);
      const dayKey = date.toISOString().split("T")[0];
      days[dayKey] = (days[dayKey] || 0) + parseAmount(payment?.amount);
    });
    return Object.entries(days)
      .map(([dateStr, value]) => ({
        name: new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        date: dateStr,
        value,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7);
  }, [payments]);

  const recentActions = useMemo(() => {
    return [...normalizedPayments]
      .sort((a, b) => new Date(b?.updatedAt || b?.date || b?.createdAt || 0).getTime() - new Date(a?.updatedAt || a?.date || a?.createdAt || 0).getTime())
      .slice(0, 3)
      .map((payment) => {
        const status = payment._status;
        if (status === "COMPLETED" || status === "SUCCESS") {
          return {
            tone: "emerald",
            icon: CheckCircle,
            title: `${payment.businessName || "Entity"} payment confirmed`,
            subtitle: `${formatCurrency(payment._amount)} processed`,
          };
        }
        if (status === "PENDING") {
          return {
            tone: "amber",
            icon: Clock,
            title: `${payment.businessName || "Entity"} payment pending`,
            subtitle: `${formatCurrency(payment._amount)} awaiting confirmation`,
          };
        }
        return {
          tone: "rose",
          icon: AlertCircle,
          title: `${payment.businessName || "Entity"} payment issue`,
          subtitle: `${formatCurrency(payment._amount)} needs attention`,
        };
      });
  }, [normalizedPayments]);

  const downloadCSV = () => {
    if (!payments || payments.length === 0) return;
    const headers = [
      "reference",
      "businessName",
      "businessType",
      "frequency",
      "date",
      "amount",
      "payment",
      "status",
    ];
    const rows = payments.map((payment) => [
      payment.reference || payment.id || "",
      payment.businessName || payment.business_name || "",
      payment.businessType || payment.business_type || "",
      payment.frequency || payment.billingFrequency || payment.billing_frequency || "",
      payment.date || payment.createdAt || "",
      typeof payment.amount === "number" ? payment.amount : payment.amount || "",
      payment.payment || payment.method || "",
      payment.status || "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map(escapeCSV).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `revenue-payments-${date}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = () => {
    const win = window.open("", "_blank", "noopener,noreferrer");
    if (!win) return;
    const rows = payments
      .map(
        (payment) => `
      <tr>
        <td style="padding:6px;border:1px solid #ddd">${payment.reference || payment.id || ""}</td>
        <td style="padding:6px;border:1px solid #ddd">${payment.businessName || ""}</td>
        <td style="padding:6px;border:1px solid #ddd">${payment.businessType || ""}</td>
        <td style="padding:6px;border:1px solid #ddd">${payment.frequency || payment.billingFrequency || ""}</td>
        <td style="padding:6px;border:1px solid #ddd">${payment.date || payment.createdAt || ""}</td>
        <td style="padding:6px;border:1px solid #ddd">${payment.amount || ""}</td>
        <td style="padding:6px;border:1px solid #ddd">${payment.payment || payment.method || ""}</td>
        <td style="padding:6px;border:1px solid #ddd">${payment.status || ""}</td>
      </tr>`
      )
      .join("");
    const html = `
      <html>
      <head>
        <title>Payments</title>
        <style>table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f3f4f6}</style>
      </head>
      <body>
        <h2>Payments</h2>
        <table>
          <thead>
            <tr>
              <th>Ref</th><th>Business</th><th>Type</th><th>Frequency</th><th>Date</th><th>Amount</th><th>Payment</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </body>
      </html>`;
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 300);
  };

  const actionToneClasses = {
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
    amber: "bg-amber-50 border-amber-100 text-amber-700",
    rose: "bg-rose-50 border-rose-100 text-rose-700",
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="rounded-2xl bg-linear-to-r from-emerald-50 via-white to-cyan-50 p-5 md:p-6 ring-1 ring-emerald-100">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="text-emerald-600" size={28} />
              Revenue Assurance Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-600 md:text-base">
              Wallet-style overview for collection health, compliance, and transaction integrity.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <input
                type="date"
                value={
                  selectedDate instanceof Date && !isNaN(selectedDate.getTime())
                    ? selectedDate.toISOString().split("T")[0]
                    : new Date().toISOString().split("T")[0]
                }
                onChange={(e) => {
                  const newDate = new Date(e.target.value + "T00:00:00");
                  if (!isNaN(newDate.getTime())) {
                    setSelectedDate(newDate);
                  }
                }}
                className="text-sm text-slate-700 outline-none bg-transparent"
              />
            </div>
            <button
              onClick={downloadCSV}
              disabled={loading || payments.length === 0}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                loading || payments.length === 0
                  ? "cursor-not-allowed bg-slate-200 text-slate-500"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              <FileSpreadsheet size={17} />
              Export CSV
            </button>

            <button
              onClick={downloadPDF}
              disabled={loading || payments.length === 0}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                loading || payments.length === 0
                  ? "cursor-not-allowed bg-slate-200 text-slate-500"
                  : "bg-slate-800 text-white hover:bg-slate-900"
              }`}
            >
              <FileText size={17} />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Volume</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(metrics.totalVolume)}</p>
          <p className="mt-1 text-xs text-slate-500">Across {metrics.totalCount} transactions</p>
        </div>

        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Completed</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">{formatCurrency(metrics.completedAmount)}</p>
          <p className="mt-1 text-xs text-slate-500">{metrics.completedCount} successful transactions</p>
        </div>

        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Pending</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">{formatCurrency(metrics.pendingAmount)}</p>
          <p className="mt-1 text-xs text-slate-500">{metrics.pendingCount} pending confirmations</p>
        </div>

        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Failed / Owing Risk</p>
          <p className="mt-2 text-2xl font-bold text-rose-700">{formatCurrency(metrics.failedAmount)}</p>
          <p className="mt-1 text-xs text-slate-500">{metrics.failedCount} flagged transactions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl bg-white p-5 md:p-6 ring-1 ring-slate-100 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="text-slate-800 font-semibold text-lg flex items-center gap-2">
                <TrendingUp className="text-emerald-600" size={20} />
                Collection Rate
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                Live
              </span>
            </div>

            <div className="mt-4 text-4xl font-extrabold text-emerald-600">
              {metrics.collectionRate.toFixed(1)}%
            </div>

            <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
              <Wallet size={16} className="text-slate-400" />
              <span>{formatCurrency(metrics.completedAmount)} collected from {formatCurrency(metrics.totalVolume)} total volume</span>
            </div>

            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                <span>Progress</span>
                <span>{metrics.collectionRate.toFixed(1)}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-600"
                  style={{ width: `${Math.min(100, Math.max(0, metrics.collectionRate))}%` }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-2 ring-1 ring-slate-100 shadow-sm">
            <LineChartCard data={chartData} title="Payment Trends (Recent)" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-5 md:p-6 ring-1 ring-slate-100 shadow-sm">
            <div className="mb-4 font-semibold text-lg text-slate-800 flex items-center gap-2">
              <CheckCircle className="text-blue-600" size={20} />
              Compliance Snapshot
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700">On-time / Completed</span>
                  <span className="font-bold text-emerald-700">{metrics.complianceRate.toFixed(1)}%</span>
                </div>
              </div>

              <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700">Pending</span>
                  <span className="font-bold text-amber-700">
                    {metrics.totalCount > 0 ? ((metrics.pendingCount / metrics.totalCount) * 100).toFixed(1) : "0.0"}%
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-rose-100 bg-rose-50 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700">Failed / Overdue Risk</span>
                  <span className="font-bold text-rose-700">
                    {metrics.totalCount > 0 ? (((metrics.failedCount + metrics.overdueCount) / metrics.totalCount) * 100).toFixed(1) : "0.0"}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 md:p-6 ring-1 ring-slate-100 shadow-sm">
            <div className="mb-3 font-semibold text-lg text-slate-800 flex items-center gap-2">
              <Clock className="text-slate-600" size={20} />
              Recent Compliance Actions
            </div>

            {recentActions.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                No recent payment actions.
              </div>
            ) : (
              <div className="space-y-3">
                {recentActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <div
                      key={`${action.title}-${index}`}
                      className={`flex items-start gap-3 rounded-xl border p-3 ${actionToneClasses[action.tone]}`}
                    >
                      <div className="rounded-lg bg-white/70 p-1.5">
                        <Icon size={16} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-slate-700">{action.title}</div>
                        <div className="mt-1 text-xs text-slate-500">{action.subtitle}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between md:p-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Transactions</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">Recent Payments</h3>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {normalizedPayments.length} record(s)
          </span>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-slate-500">Loading payments...</div>
        ) : normalizedPayments.length === 0 ? (
          <div className="p-8 text-center">
            <XCircle className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-slate-500">No payments available for assurance analysis.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-max w-full text-left">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-700 md:px-6 md:text-sm">Reference</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-700 md:px-6 md:text-sm">Business</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-700 md:px-6 md:text-sm">Type</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-700 md:px-6 md:text-sm">Category</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-700 md:px-6 md:text-sm">Frequency</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-700 md:px-6 md:text-sm">Amount</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-700 md:px-6 md:text-sm">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {normalizedPayments.slice(0, 10).map((payment) => (
                  <tr key={payment.id || payment.reference} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-700 md:px-6 md:text-sm">
                      {payment.reference || payment.id || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700 md:px-6 md:text-sm">
                      {payment.businessName || payment.business_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700 md:px-6 md:text-sm">
                      {payment.businessType || payment.business_type || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700 md:px-6 md:text-sm">
                      {payment.category || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700 md:px-6 md:text-sm">
                      {payment.frequency || payment.billingFrequency || payment.billing_frequency || payment.method || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-900 md:px-6 md:text-sm">
                      {formatCurrency(payment._amount)}
                    </td>
                    <td className="px-4 py-3 text-xs md:px-6 md:text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                          payment._status === "COMPLETED" || payment._status === "SUCCESS"
                            ? "bg-emerald-100 text-emerald-700"
                            : payment._status === "PENDING"
                              ? "bg-amber-100 text-amber-700"
                              : payment._status === "FAILED"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {payment.status || "Unknown"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {normalizedPayments.length > 10 && (
          <div className="border-t border-slate-100 p-4 text-xs text-slate-500 md:px-6">
            Showing 10 of {normalizedPayments.length} transactions.
          </div>
        )}
      </div>
    </div>
  );
}
