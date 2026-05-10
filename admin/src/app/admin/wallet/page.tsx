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
    Wallet,
    X,
    XCircle,
} from "lucide-react";
import withAuth from "@/components/withAuth";
import Link from "next/link";
type WalletTransactionStatus = "SUCCESS" | "PENDING" | "FAILED" | "REFUNDED";
type WalletTransactionType = "credit" | "debit";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import { useRouter } from "next/navigation";
import { Transaction } from "@/lib/services/wallet";

function WalletPage() {
    const router = useRouter();
    const [load, setLoad] = useState(false);
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | WalletTransactionStatus>("all");
    const [typeFilter, setTypeFilter] = useState<"all" | WalletTransactionType>("all");
    const [copyMessage, setCopyMessage] = useState("");
    const { user } = useAuth();
    const { wallet, isWallet, loading, error, message, refresh, setUid, getTransactions } = useWallet();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [toDate, setToDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [fromDate, setFromDate] = useState(() => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);

    const fetChTransactions = useCallback(async () => {
        setLoad(true);
        if (wallet) {
            try {
                const res = await getTransactions(user.uid);
                if (res.ok && res.transactions?.data?.results) {
                    setTransactions(res.transactions.data.results);
                } else {
                    setTransactions([]);
                }
            } catch (error) {
                console.error("Error fetching transactions:", error);
                setTransactions([]);
            } finally {
                setLoad(false);
            }
        }
    }, [wallet, getTransactions, user.uid]);

    useEffect(() => {
        fetChTransactions();
    }, [fetChTransactions]);

    useEffect(() => {

        setUid(user?.uid || null);

        if (!wallet) {
            router.replace("/admin/complete");
        }
    }, [router, wallet, setUid, user?.uid]);

    //this id for the bank details 
    const bankDetails = {
        bankName: wallet?.bank?.name || "Not available",
        accountName: wallet?.accountName || user?.center || "Not available",
        accountNumber: wallet?.accountNo || "Not available",
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(value);
    };

    const filteredTransactions = useMemo(() => {
        const queryValue = query.trim().toLowerCase();

        return transactions.filter((item) => {
            const itemEvent = String(item?.event || "").toLowerCase();
            const itemStatus = String(item?.status || "").toLowerCase();
            const itemDate = new Date(item?.createdAt || item?.updatedAt || "");

            const matchesQuery = !queryValue || [
                item?.reference,
                item?.id,
                item?.paymentReference,
                item?.customerEmail,
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(queryValue));

            const matchesStatus =
                statusFilter === "all" || itemStatus === statusFilter.toLowerCase();

            const matchesType =
                typeFilter === "all" || itemEvent === typeFilter.toLowerCase();

            const matchesDate = (() => {
                if (Number.isNaN(itemDate.getTime())) return true;
                const from = fromDate ? new Date(fromDate) : null;
                const to = toDate ? new Date(toDate) : null;
                if (from && itemDate < from) return false;
                if (to) {
                    const endOfDay = new Date(to);
                    endOfDay.setHours(23, 59, 59, 999);
                    if (itemDate > endOfDay) return false;
                }
                return true;
            })();

            return matchesQuery && matchesStatus && matchesType && matchesDate;
        });
    }, [transactions, query, statusFilter, typeFilter, fromDate, toDate]);

    // This is for the balance calculations, we can connect this to the backend later
    const balances = useMemo(() => {

        const walletBalance = Number(wallet?.balance ?? 0);
        const available = Number.isFinite(walletBalance) ? walletBalance : 0;
        const ledger = available;

        return {
            available,
            ledger,
            pendingDebits: 0,
            totalInflow: 0,
            totalOutflow: 0,
        };
    }, [wallet?.balance]);

    // This is the function to handle copying account details to clipboard
    const handleCopyAccountDetails = async () => {
        const text = `${bankDetails.bankName}\n${bankDetails.accountName}\n${bankDetails.accountNumber}`;

        try {
            if (navigator?.clipboard) {
                await navigator.clipboard.writeText(text);
                setCopyMessage("Account details copied");
                return;
            }

            setCopyMessage("Copy is not supported in this browser");
        } catch {
            setCopyMessage("Unable to copy account details");
        }

        setTimeout(() => setCopyMessage(""), 1000);
    };

    // This is to refresh wallet data after creating wallet or when the page loads
    const statusBadge = (status: any) => {
        const statusStr = String(status || "").toUpperCase();
        if (statusStr === "SUCCESS" || statusStr === "1") {
            return (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Success
                </span>
            );
        }

        if (statusStr === "PENDING" || statusStr === "0") {
            return (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                    <Clock3 className="h-3.5 w-3.5" />
                    Pending
                </span>
            );
        }

        if (statusStr === "REFUNDED" || statusStr === "3") {
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

    return (
        <div className="mx-auto max-w-7xl p-4 md:p-6 space-y-4 md:space-y-5">
            <div className="rounded-2xl bg-linear-to-r from-emerald-50 via-white to-cyan-50 ring-1 ring-emerald-100 p-5 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Wallet</h1>
                        <p className="mt-1 text-sm text-slate-600">
                            Track available funds, monitor payouts, and review transaction activity.
                        </p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 ring-1 ring-slate-200 text-sm text-slate-600">
                        <Wallet className="h-4 w-4 text-emerald-600" />
                        Secure wallet mode
                    </div>
                </div>
            </div>

            <div className="rounded-2xl bg-white p-4 md:p-5 ring-1 ring-slate-100 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">Payout Account</p>
                        <h2 className="mt-1 text-lg font-semibold text-slate-900">Bank transfer destination</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Use this account for settlement, withdrawals, and bank transfers.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        {!isWallet ? (<button
                            type="button"
                            onClick={refresh}
                            disabled={loading}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:cursor-not-allowed disabled:bg-emerald-300 cursor-pointer"
                        >
                            {loading ? "Please wait..." : "Get Account Number"}
                        </button>) : (
                            <>
                                <button
                                    type="button"
                                    onClick={handleCopyAccountDetails}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    Copy Details
                                </button>
                                <button
                                    type="button"
                                    onClick={() => router.push("/admin/wallet/transfer")}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:cursor-not-allowed disabled:bg-emerald-300"
                                >
                                    Transfer
                                </button>
                            </>
                        )}
                    </div>
                </div>
                {isWallet && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Bank Name</p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">{bankDetails.bankName}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Account Name</p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">{bankDetails.accountName}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Account Number</p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">{bankDetails.accountNumber}</p>
                        </div>
                    </div>
                )}

                {copyMessage && (
                    <p className="mt-3 text-sm text-emerald-700">{copyMessage}</p>
                )}

                {error && (
                    <p className="mt-3 text-sm text-rose-700">{error.message}</p>
                )}

                {message && !error && (
                    <p className="mt-3 text-sm text-slate-600">{message}</p>
                )}
            </div>

            {/* The following sections for balances and transactions are using mock data and can be connected to the backend later */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Available Balance</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(balances.available)}</p>
                    <p className="text-xs text-emerald-600 mt-1">Cleared funds ready for transfer</p>
                </div>
                <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Ledger Balance</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(user.ledger || 0.00)}</p>
                    <p className="text-xs text-slate-500 mt-1">Includes pending wallet movements</p>
                </div>
                <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Pending Debits</p>
                    <p className="mt-2 text-2xl font-bold text-amber-600">{formatCurrency(balances.pendingDebits)}</p>
                    <p className="text-xs text-slate-500 mt-1">Waiting for settlement confirmation</p>
                </div>
                <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Net Movement</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                        {formatCurrency(balances.totalInflow - balances.totalOutflow)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Success credits minus success debits</p>
                </div>
            </div>

            {/* Transactions Section */}
            <div className="rounded-2xl bg-white p-4 md:p-5 ring-1 ring-slate-100 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Transactions</h2>
                        <p className="text-sm text-slate-500">{filteredTransactions.length} result(s)</p>
                    </div>
                    <button
                        type="button"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                    >
                        <Download className="h-4 w-4" />
                        Export Statement
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    <div className="relative lg:col-span-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search by title or reference"
                            className="w-full rounded-xl border border-slate-400 bg-transparent pl-9 pr-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 text-slate-600"
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
                                onChange={(event) =>
                                    setStatusFilter(event.target.value as "all" | WalletTransactionStatus)
                                }
                                className="w-full appearance-none rounded-xl border border-slate-400 bg-transparent pl-9 pr-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 text-slate-600"
                            >
                                <option value="all">All statuses</option>
                                <option value="success">Success</option>
                                <option value="pending">Pending</option>
                                <option value="failed">Failed</option>
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
                            onChange={(event) => setTypeFilter(event.target.value as "all" | WalletTransactionType)}
                            className="w-full rounded-xl border border-slate-400 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 appearance-none text-slate-600"
                        >
                            <option value="all">All types</option>
                            <option value="credit">Credit</option>
                            <option value="debit">Debit</option>
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
                            className="w-full rounded-xl border border-slate-400 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 text-slate-600"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="sr-only" htmlFor="toDate">To date</label>
                        <input
                            id="toDate"
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="w-full rounded-xl border border-slate-400 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 text-slate-600"
                        />
                    </div>

                    <p className="text-sm text-slate-500 mt-1 sm:mt-0">Showing transactions between selected dates. Changes auto-refresh results.</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-190">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Reference</th>
                                <th className="py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                                <th className="py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                                <th className="py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                                <th className="py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.length === 0 ? (
                                <tr>
                                    <td className="py-8 text-center text-sm text-slate-500" colSpan={5}>
                                        No transactions match your filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map((item) => (
                                    <tr key={item.id} className="border-b border-slate-100 last:border-b-0">
                                        <td className="py-4 text-sm font-medium text-slate-800"><Link href={`/admin/transactions/${item.id}`}>{item.reference || item.id}</Link></td>
                                        <td className="py-4 text-sm text-slate-600 capitalize">{item.event || "transaction"}</td>
                                        <td className="py-4 text-sm text-slate-600">
                                            {new Date(item.createdAt || item.updatedAt).toLocaleString("en-NG", {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </td>
                                        <td className="py-4 text-sm">{statusBadge(item.status)}</td>
                                        <td
                                            className={`py-4 text-right text-sm font-semibold ${(item.event || "").toLowerCase() === "credit" ? "text-emerald-700" : "text-rose-700"
                                                }`}
                                        >
                                            <span className="inline-flex items-center gap-1.5">
                                                {(item.event || "").toLowerCase() === "credit" ? (
                                                    <ArrowDownLeft className="h-4 w-4" />
                                                ) : (
                                                    <ArrowUpRight className="h-4 w-4" />
                                                )}
                                                {(item.event || "").toLowerCase() === "credit" ? "+" : "-"}
                                                {formatCurrency(Math.abs(Number(item.amount || 0)))}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default withAuth(WalletPage);
