"use client";

import React, { useState, useEffect } from "react";
import {
    ArrowLeft,
    ArrowDownLeft,
    ArrowUpRight,
    CheckCircle2,
    Clock3,
    XCircle,
    Copy,
    Loader2,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import withAuth from "@/components/withAuth";
import { Transaction } from "@/lib/services/wallet";
import { useWallet } from "@/context/WalletContext";
import { useAuth } from "@/context/AuthContext";

// CopyableField component - extracted outside to avoid recreation on each render
interface CopyableFieldProps {
    label: string;
    value: string;
    copiedField: string | null;
    onCopy: (text: string, field: string) => void;
}

const CopyableField = ({ label, value, copiedField, onCopy }: CopyableFieldProps) => (
    <div className="flex items-start justify-between gap-4 rounded-lg bg-slate-50 p-3">
        <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 font-mono text-sm text-slate-700">{value || "—"}</p>
        </div>
        {value && (
            <button
                type="button"
                onClick={() => onCopy(value, label)}
                className="shrink-0 rounded p-2 hover:bg-slate-200 transition-colors"
                title="Copy to clipboard"
            >
                <Copy className={`h-4 w-4 ${copiedField === label ? "text-emerald-600" : "text-slate-400"}`} />
            </button>
        )}
    </div>
);

function TransactionDetailPage() {
    const router = useRouter();
    const params = useParams();
    const transactionId = params.id as string;
    const { wallet, getTransaction } = useWallet();
    const { user } = useAuth();
    
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    useEffect(() => {
        // Load via WalletContext getTransaction
        const fetchTransaction = async () => {
            setLoading(true);
            setError(null);
            try {
                const userId = user?.uid || wallet?.userId || wallet?.id;
                if (!userId) {
                    setError("No user id available to fetch transactions");
                    setLoading(false);
                    return;
                }

                const res: any = await getTransaction(transactionId);
                if (res?.ok && res?.transaction) {
                    setTransaction(res.transaction as Transaction);
                }else {
                    setError(res?.message || "Failed to fetch transactions");
                }
            } catch (err) {
                console.error(err);
                setError("An error occurred while fetching transactions");
            } finally {
                setLoading(false);
            }
        };

        fetchTransaction();
    }, [transactionId, getTransaction, user?.uid, wallet?.id, wallet?.userId]);

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const formatCurrency = (value: string | number) => {
        const numValue = typeof value === "string" ? Number(value) : value;
        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
        }).format(numValue);
    };

    const formatDate = (dateInput?: string | Date) => {
        if (!dateInput) return "—";
        const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
        if (!d || Number.isNaN(d.getTime())) return "—";
        return d.toLocaleString("en-NG", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    const getStatusBadge = (status: string | number) => {
        let normalizedStatus = "";
        if (typeof status === "number") {
            // Map numeric enum values to names: 0=PENDING,1=SUCCESS,2=FAILED,3=REFUNDED,4=CANCELLED
            switch (status) {
                case 1:
                    normalizedStatus = "SUCCESS";
                    break;
                case 0:
                    normalizedStatus = "PENDING";
                    break;
                case 3:
                    normalizedStatus = "REFUNDED";
                    break;
                case 4:
                    normalizedStatus = "CANCELLED";
                    break;
                case 2:
                default:
                    normalizedStatus = "FAILED";
                    break;
            }
        } else {
            normalizedStatus = (status || "").toUpperCase();
        }

        if (normalizedStatus === "SUCCESS") {
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Success
                </span>
            );
        }
        if (normalizedStatus === "PENDING") {
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                    <Clock3 className="h-4 w-4" />
                    Pending
                </span>
            );
        }
        if (normalizedStatus === "REFUNDED") {
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-sm font-semibold text-violet-700">
                    <Clock3 className="h-4 w-4" />
                    Refunded
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-sm font-semibold text-rose-700">
                <XCircle className="h-4 w-4" />
                Failed
            </span>
        );
    };

    const getTransactionTypeIcon = (type: string) => {
        const normalizedType = (type || "").toLowerCase();
        return normalizedType === "nomba.payment.credit" ? (
            <ArrowDownLeft className="h-5 w-5 text-emerald-600" />
        ) : (
            <ArrowUpRight className="h-5 w-5 text-rose-600" />
        );
    };

    if (loading) {
        return (
            <div className="mx-auto max-w-7xl p-4 md:p-6">
                <div className="flex items-center justify-center min-h-96">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                        <p className="text-slate-600">Loading transaction details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mx-auto max-w-7xl p-4 md:p-6 space-y-4">
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Go Back
                </button>
                <div className="rounded-2xl bg-rose-50 border border-rose-200 p-6">
                    <p className="text-sm text-rose-700">{error}</p>
                </div>
            </div>
        );
    }

    if (!transaction) {
        return (
            <div className="mx-auto max-w-7xl p-4 md:p-6 space-y-4">
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Go Back
                </button>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 text-center">
                    <p className="text-slate-600">Transaction not found. Please check the transaction ID.</p>
                </div>
            </div>
        );
    }

    const transactionType = (transaction.event || "").toLowerCase();
    const isCredit = transactionType === "nomba.payment.credit";

    return (
        <div className="mx-auto max-w-7xl p-4 md:p-6 space-y-4 md:space-y-5">
            {/* Header */}
            <div className="rounded-2xl bg-linear-to-r from-emerald-50 via-white to-cyan-50 ring-1 ring-emerald-100 p-5 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Transaction Details</h1>
                        <p className="mt-1 text-sm text-slate-600">
                            View complete information about this transaction
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Wallet
                    </button>
                </div>
            </div>

            {/* Transaction Summary Card */}
            <div className="rounded-2xl bg-white p-5 md:p-6 ring-1 ring-slate-100 shadow-sm">
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="rounded-full bg-slate-100 p-3">
                            {getTransactionTypeIcon(transaction.event || "")}
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">
                                {isCredit ? "Money In" : "Money Out"}
                            </p>
                            <p className={`text-3xl font-bold mt-1 ${isCredit ? "text-emerald-600" : "text-rose-600"}`}>
                                {isCredit ? "+" : "-"}
                                {formatCurrency(transaction.amount || 0)}
                            </p>
                        </div>
                    </div>
                    {getStatusBadge((transaction as any).status)}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-6 border-t border-slate-200">
                    <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">Reference ID</p>
                            <p className="mt-1 font-semibold text-slate-900">{transaction.reference || transaction.id || "—"}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">Type</p>
                        <p className="mt-1 font-semibold text-slate-900 capitalize">{transaction.event ? "CREDIT" : "DEBIT"}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">Date</p>
                        <p className="mt-1 font-semibold text-slate-900 text-sm">{formatDate(transaction.createdAt || transaction.updatedAt)}</p>
                    </div>
                </div>
            </div>

            {/* Transaction Details */}
            <div className="rounded-2xl bg-white p-5 md:p-6 ring-1 ring-slate-100 shadow-sm space-y-4">
                <h2 className="text-lg font-semibold text-slate-900">Transaction Information</h2>

                    <div className="grid gap-3">
                    <CopyableField label="Reference" value={transaction.reference || transaction.id || ""} copiedField={copiedField} onCopy={handleCopy} />
                    <CopyableField label="Transaction Amount" value={String(transaction.amount || "")} copiedField={copiedField} onCopy={handleCopy} />
                    <CopyableField label="Currency" value={transaction.currency || "NGN"} copiedField={copiedField} onCopy={handleCopy} />
                    <CopyableField label="Narration" value={(transaction as any).metadata?.narration || (transaction as any).gatewayResponse || ""} copiedField={copiedField} onCopy={handleCopy} />
                    <CopyableField label="Channel" value={transaction.channel || ""} copiedField={copiedField} onCopy={handleCopy} />
                </div>
            </div>

            {/* Sender Details */}
            {(((transaction as any).metadata?.senderName) || ((transaction as any).metadata?.senderAccountNumber)) && (
                <div className="rounded-2xl bg-white p-5 md:p-6 ring-1 ring-slate-100 shadow-sm space-y-4">
                    <h2 className="text-lg font-semibold text-slate-900">Sender Details</h2>

                    <div className="grid gap-3">
                        <CopyableField label="Sender Name" value={(transaction as any).metadata?.senderName || ""} copiedField={copiedField} onCopy={handleCopy} />
                        <CopyableField label="Sender Account Number" value={(transaction as any).metadata?.senderAccountNumber || ""} copiedField={copiedField} onCopy={handleCopy} />
                        <CopyableField label="Sender Bank Code" value={(transaction as any).metadata?.senderBankCode || ""} copiedField={copiedField} onCopy={handleCopy} />
                        <CopyableField label="Sender Bank Name" value={(transaction as any).metadata?.senderBankName || ""} copiedField={copiedField} onCopy={handleCopy} />
                    </div>
                </div>
            )}

            {/* Alias Account Details (Virtual Account) */}
            {(((transaction as any).metadata?.aliasAccountName) || ((transaction as any).metadata?.aliasAccountNumber)) && (
                <div className="rounded-2xl bg-white p-5 md:p-6 ring-1 ring-slate-100 shadow-sm space-y-4">
                    <h2 className="text-lg font-semibold text-slate-900">Alias Account Details</h2>

                    <div className="grid gap-3">
                        <CopyableField label="Alias Account Name" value={(transaction as any).metadata?.aliasAccountName || ""} copiedField={copiedField} onCopy={handleCopy} />
                        <CopyableField label="Alias Account Number" value={(transaction as any).metadata?.aliasAccountNumber || ""} copiedField={copiedField} onCopy={handleCopy} />
                        <CopyableField label="Alias Account Type" value={(transaction as any).metadata?.aliasAccountType || ""} copiedField={copiedField} onCopy={handleCopy} />
                        <CopyableField label="Alias Account Reference" value={(transaction as any).metadata?.aliasAccountReference || ""} copiedField={copiedField} onCopy={handleCopy} />
                    </div>
                </div>
            )}

            {/* Reference & Transaction Information */}
            <div className="rounded-2xl bg-white p-5 md:p-6 ring-1 ring-slate-100 shadow-sm space-y-4">
                <h2 className="text-lg font-semibold text-slate-900">Reference Information</h2>

                    <div className="grid gap-3">
                    <CopyableField label="Merchant Transaction Reference" value={(transaction as any).merchantTxRef || ""} copiedField={copiedField} onCopy={handleCopy} />
                    <CopyableField label="Transaction ID" value={(transaction as any).metadata?.transactionId || (transaction as any).reference || ""} copiedField={copiedField} onCopy={handleCopy} />
                    <CopyableField label="Request ID" value={(transaction as any).metadata?.requestId || ""} copiedField={copiedField} onCopy={handleCopy} />
                    <CopyableField label="Session ID" value={(transaction as any).metadata?.sessionId || ""} copiedField={copiedField} onCopy={handleCopy} />
                </div>
            </div>

            {/* Transaction Status & Type */}
            <div className="rounded-2xl bg-white p-5 md:p-6 ring-1 ring-slate-100 shadow-sm space-y-4">
                <h2 className="text-lg font-semibold text-slate-900">Transaction Status & Type</h2>

                    <div className="grid gap-3">
                    <CopyableField label="Gateway Response" value={transaction.gatewayResponse || ""} copiedField={copiedField} onCopy={handleCopy} />
                    <CopyableField label="Transaction Type" value={(transaction as any).metadata?.transactionType || ""} copiedField={copiedField} onCopy={handleCopy} />
                    <CopyableField label="Transaction Type Name" value={(transaction as any).metadata?.transactionTypeName || ""} copiedField={copiedField} onCopy={handleCopy} />
                    <CopyableField label="Originating From" value={(transaction as any).metadata?.originatingFrom || ""} copiedField={copiedField} onCopy={handleCopy} />
                </div>
            </div>

            {/* Metadata Information */}
            <div className="rounded-2xl bg-white p-5 md:p-6 ring-1 ring-slate-100 shadow-sm space-y-4">
                <h2 className="text-lg font-semibold text-slate-900">Metadata Information</h2>

                <div className="grid gap-3">
                    <CopyableField label="Role" value={(transaction as any).metadata?.role || ""} copiedField={copiedField} onCopy={handleCopy} />
                    <CopyableField label="Credited Amount" value={String((transaction as any).metadata?.creditedAmount || transaction.amount || "")} copiedField={copiedField} onCopy={handleCopy} />
                    <CopyableField label="Payment Time" value={formatDate((transaction as any).metadata?.time)} copiedField={copiedField} onCopy={handleCopy} />
                </div>
            </div>

            {/* Metadata */}
            <div className="rounded-2xl bg-white p-5 md:p-6 ring-1 ring-slate-100 shadow-sm space-y-4">
                <h2 className="text-lg font-semibold text-slate-900">Additional Information</h2>

                <div className="grid gap-3">
                    <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Entry Type</p>
                        <p className="mt-1 text-sm text-slate-700 capitalize">{(transaction as any).entryType || "—"}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Transaction Category</p>
                        <p className="mt-1 text-sm text-slate-700 capitalize">{(transaction as any).transactionCategory || "—"}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Agent Transaction</p>
                        <p className="mt-1 text-sm text-slate-700">{(transaction as any).isAgentTransaction ? "Yes" : "No"}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">International</p>
                        <p className="mt-1 text-sm text-slate-700">{(transaction as any).isInternational ? "Yes" : "No"}</p>
                    </div>
                    <CopyableField label="User ID" value={transaction.userId || ""} copiedField={copiedField} onCopy={handleCopy} />
                    <CopyableField label="Date Created" value={formatDate(transaction.createdAt)} copiedField={copiedField} onCopy={handleCopy} />
                    <CopyableField label="Date Updated" value={formatDate(transaction.updatedAt)} copiedField={copiedField} onCopy={handleCopy} />
                </div>
            </div>
        </div>
    );
}

export default withAuth(TransactionDetailPage);
