"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import {
    ArrowDownLeft,
    ArrowUpRight,
    CheckCircle2,
    Clock3,
    Download,
    Filter,
    Search,
    FileText,
    XCircle,
    Loader2,
    ArrowLeft,
} from "lucide-react";
import withAuth from "@/components/withAuth";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { PaymentTransaction } from "@/lib/services/payments";
import { getWallet, Wallet as WalletType, TransactionStatus } from "@/lib/services/wallet";
import { getRecords } from "@/lib/services/payments";

function PartnerFinancePage() {
    const router = useRouter();
    const params = useParams();
    const partnerId = params.id as string;
    const { user } = useAuth();

    const [records, setRecords] = useState<PaymentTransaction[]>([]);
    const [wallet, setWallet] = useState<WalletType | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingRecords, setLoadingRecords] = useState(false);
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [typeFilter, setTypeFilter] = useState<string>("");
    const [toDate, setToDate] = useState<Date>(() => new Date().toISOString().split("T")[0]);
    const [fromDate, setFromDate] = useStat<Date>(() => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);

    const [toasts, setToasts] = useState<{ id: number; type: string; message: string }[]>([]);

    const addToast = (type: "success" | "error", message: string, ttl = 4000) => {
        const id = Date.now() + Math.random();
        setToasts((s) => [...s, { id, type, message }]);
        setTimeout(() => setToasts((s) => s.filter((t) => t.id !== id)), ttl);
    };

    const fetchWalletData = useCallback(async () => {
        try {
            if (!partnerId) {
                setWallet(null);
                return;
            }
            const walletData = await getWallet(partnerId, "COMPANY");

            if (walletData?.ok) {
                setWallet(walletData?.wallet);
            } else {
                setWallet(null);
            }
        } catch (error: any) {
            console.log(error);
            addToast("error", error?.message || error?.error || "Failed to fetch wallet data");
        }
    }, [partnerId]);

    useEffect(() => {
        fetchWalletData();
    }, [fetchWalletData]);

    // Balance data from wallet
    const balances = useMemo(() => {
        const totalRevenue = wallet?.balance ? Number(wallet.balance) : 0;
        const pendingAmount = 0;

        return {
            totalRevenue,
            pendingAmount,
        };
    }, [wallet?.balance]);

    const formatCurrency = (value: number | string) => {
        const numValue = typeof value === "string" ? Number(value) : value;
        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
        }).format(numValue);
    };

    const fetchRecords = useCallback(async () => {
        setLoadingRecords(true);
        try {
            const res = await getRecords(partnerId, fromDate, toDate, query);
            setRecords(res.transactions || []);
        } catch (error) {
            console.error("Error fetching records:", error);
            setRecords([]);
        } finally {
            setLoadingRecords(false);
        }
    }, [fromDate, partnerId, query, toDate]);

    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    console.log(records);

    const statusBadge = (status: TransactionStatus) => {
        if (status === TransactionStatus.SUCCESS) {
            return (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Success
                </span>
            );
        }

        if (status === TransactionStatus.PENDING) {
            return (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                    <Clock3 className="h-3.5 w-3.5" />
                    Pending
                </span>
            );
        }

        if (status === TransactionStatus.REFUNDED) {
            return (
                <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                    <Clock3 className="h-3.5 w-3.5" />
                    Refunded
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                <XCircle className="h-3.5 w-3.5" />
                Failed
            </span>
        );
    };

    const handleDownloadReport = () => {
        // TODO: Implement download report functionality
        console.log("Download report clicked");
    };

    const handleDownloadRecord = () => {
        // TODO: Implement download record functionality
        console.log("Download record clicked");
    };

    const handleDownloadStatement = () => {
        // TODO: Implement download statement functionality
        console.log("Download statement clicked");
    };

    return (
        <div className="mx-auto max-w-7xl p-4 md:p-6 space-y-4 md:space-y-5">
            <div className="fixed top-4 right-4 z-50 space-y-2">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`rounded-lg px-4 py-3 text-sm font-medium ${toast.type === "success"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                    >
                        {toast.message}
                    </div>
                ))}
            </div>

            {/* Header */}
            <div className="rounded-2xl bg-linear-to-r from-blue-50 via-white to-cyan-50 ring-1 ring-blue-100 p-5 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.back()}
                                className="inline-flex items-center justify-center rounded-lg hover:bg-slate-100 p-2 transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5 text-slate-600" />
                            </button>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Partner Finance</h1>
                                <p className="mt-1 text-sm text-slate-600">
                                    Monitor payments, review records, and manage financial reports.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 ring-1 ring-slate-200 text-sm text-slate-600">
                        <FileText className="h-4 w-4 text-blue-600" />
                        Finance Overview
                    </div>
                </div>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Total Revenue</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(balances.totalRevenue)}</p>
                    <p className="text-xs text-emerald-600 mt-1">From successful transactions</p>
                </div>
                <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Pending Amount</p>
                    <p className="mt-2 text-2xl font-bold text-amber-600">{formatCurrency(balances.pendingAmount)}</p>
                    <p className="text-xs text-slate-500 mt-1">Awaiting settlement</p>
                </div>
            </div>

            {/* Download Actions Card */}
            <div className="rounded-2xl bg-white p-5 md:p-6 ring-1 ring-slate-100 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Export & Reports</h2>
                        <p className="mt-1 text-sm text-slate-500">Download financial records and reports</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            type="button"
                            onClick={handleDownloadReport}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            Download Report
                        </button>
                        <button
                            type="button"
                            onClick={handleDownloadRecord}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            Download Record
                        </button>
                        <button
                            type="button"
                            onClick={handleDownloadStatement}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            Download Statement
                        </button>
                    </div>
                </div>
            </div>

            {/* Payment Records Section */}
            <div className="rounded-2xl bg-white p-4 md:p-5 ring-1 ring-slate-100 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Payment Records</h2>
                        <p className="text-sm text-slate-500">{records.length} record(s)</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    <div className="relative lg:col-span-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="reference"
                            className="w-full rounded-xl border border-slate-400 bg-transparent pl-9 pr-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-slate-600"
                        />
                    </div>

                    <div className="lg:col-span-1">
                        <label className="sr-only" htmlFor="statusFilter">
                            Status filter
                        </label>
                        <div className="relative">
                            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <select
                                id="statusFilter"
                                value={statusFilter}
                                onChange={(event) => setStatusFilter(event.target.value)}
                                className="w-full appearance-none rounded-xl border border-slate-400 bg-transparent pl-9 pr-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-slate-600"
                            >
                                <option value="" hidden>All statuses</option>
                                <option value="SUCCESS">Success</option>
                                <option value="PENDING">Pending</option>
                                <option value="FAILED">Failed</option>
                                <option value="REFUNDED">Refunded</option>
                            </select>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <label className="sr-only" htmlFor="typeFilter">
                            Type filter
                        </label>
                        <select
                            id="typeFilter"
                            value={typeFilter}
                            onChange={(event) => setTypeFilter(event.target.value)}
                            className="w-full rounded-xl border border-slate-400 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 appearance-none text-slate-600"
                        >
                            <option value="" hidden>All types</option>
                            <option value="CREDIT">Credit</option>
                            <option value="DEBIT">Debit</option>
                        </select>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:col-span-3">
                    <div className="flex items-center gap-2">
                        <label className="sr-only" htmlFor="fromDate">From date</label>
                        <input
                            id="fromDate"
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="w-full rounded-xl border border-slate-400 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-slate-600"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="sr-only" htmlFor="toDate">To date</label>
                        <input
                            id="toDate"
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="w-full rounded-xl border border-slate-400 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-slate-600"
                        />
                    </div>

                    <p className="text-sm text-slate-500 mt-1 sm:mt-0">Showing records between selected dates.</p>
                </div>

                {loadingRecords ? (
                    <div className="flex items-center justify-center min-h-96">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            <p className="text-slate-600">Loading payment records...</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-190">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Reference</th>
                                    <th className="py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                                    <th className="py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                                    <th className="py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                                    <th className="py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</th>
                                    <th className="py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Category</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.length === 0 ? (
                                    <tr>
                                        <td className="py-8 text-center text-sm text-slate-500" colSpan={6}>
                                            No payment records found.
                                        </td>
                                    </tr>
                                ) : (
                                    records.map((record) => (
                                        <tr key={record.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors">
                                            <td className="py-4 text-sm font-medium text-slate-800">
                                                <Link href={`/admin/partners/${partnerId}/finance/${record.id}`} className="hover:text-blue-700">
                                                    {record.reference.slice(0, 27)}
                                                </Link>
                                            </td>
                                            <td className="py-4 text-sm text-slate-600 capitalize">{record.type || "—"}</td>
                                            <td className="py-4 text-sm text-slate-600">
                                                {new Date(record.createdAt).toLocaleString("en-NG", {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </td>
                                            <td className="py-4 text-sm">{statusBadge(record.status)}</td>
                                            <td className={`py-4 text-right text-sm font-semibold ${record.type === "CREDIT" ? "text-emerald-700" : "text-rose-700"}`}>
                                                <span className="inline-flex items-center gap-1.5">
                                                    {record.type === "CREDIT" ? (
                                                        <ArrowDownLeft className="h-3.5 w-3.5" />
                                                    ) : (
                                                        <ArrowUpRight className="h-3.5 w-3.5" />
                                                    )}
                                                    {formatCurrency(record.amount)}
                                                </span>
                                            </td>
                                            <td className="py-4 text-right text-sm text-slate-600 capitalize">{record.category || "—"}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default withAuth(PartnerFinancePage);
