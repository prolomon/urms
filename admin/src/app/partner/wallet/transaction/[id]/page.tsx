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
import withPartnerAuth from "@/components/withPartnerAuth";
import { Transaction } from "@/lib/services/wallet";
import { useWallet } from "@/context/WalletContext";

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
    const { wallet } = useWallet();
    
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    useEffect(() => {
        // TODO: Replace with actual API call to fetch transaction by ID
        // For now, we'll need to implement a getTransactionById service method
        // const fetchTransaction = async () => {
        //     try {
        //         const res = await getTransactionById(transactionId);
        //         if (res.ok) {
        //             setTransaction(res.transaction);
        //         } else {
        //             setError(res.message || "Failed to fetch transaction");
        //         }
        //     } catch (err) {
        //         setError("An error occurred while fetching the transaction");
        //         console.error(err);
        //     } finally {
        //         setLoading(false);
        //     }
        // };
        // fetchTransaction();

        // Placeholder: Load from localStorage or context
        // setLoading(false);
    }, [transactionId]);

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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString("en-NG", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    const getStatusBadge = (status: string) => {
        const normalizedStatus = (status || "").toUpperCase();
        
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
        return normalizedType === "credit" ? (
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

    const transactionType = (transaction.type || "").toLowerCase();
    const isCredit = transactionType === "credit";

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
                            {getTransactionTypeIcon(transaction.type || "")}
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
                    {getStatusBadge(transaction.status || "")}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-6 border-t border-slate-200">
                    <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">Reference ID</p>
                        <p className="mt-1 font-semibold text-slate-900">{transaction.sessionId || "—"}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">Type</p>
                        <p className="mt-1 font-semibold text-slate-900 capitalize">{transaction.type || "—"}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">Date</p>
                        <p className="mt-1 font-semibold text-slate-900 text-sm">{formatDate(transaction.timeCreated || transaction.timeUpdated || "")}</p>
                    </div>
                </div>
            </div>

            {/* Transaction Details */}
            <div className="rounded-2xl bg-white p-5 md:p-6 ring-1 ring-slate-100 shadow-sm space-y-4">
                <h2 className="text-lg font-semibold text-slate-900">Transaction Information</h2>

                <div className="grid gap-3">
                    <CopyableField label="Session ID" value={transaction.sessionId || ""} copiedField={copiedField} onCopy={handleCopy} />
                    <CopyableField label="Transaction Amount" value={transaction.amount || ""} copiedField={copiedField} onCopy={handleCopy} />
                    <CopyableField label="Charge" value={transaction.fixedCharge || ""} copiedField={copiedField} onCopy={handleCopy} />
                    <CopyableField label="Narration" value={transaction.narration || ""} copiedField={copiedField} onCopy={handleCopy} />
                </div>
            </div>

            {/* Account Details */}
            {(transaction.senderName || transaction.ktaSenderAccountNumber) && (
                <div className="rounded-2xl bg-white p-5 md:p-6 ring-1 ring-slate-100 shadow-sm space-y-4">
                    <h2 className="text-lg font-semibold text-slate-900">Sender Details</h2>

                    <div className="grid gap-3">
                        <CopyableField label="Sender Name" value={transaction.senderName || transaction.ktaSenderName || ""} copiedField={copiedField} onCopy={handleCopy} />
                        <CopyableField label="Sender Account Number" value={transaction.ktaSenderAccountNumber || ""} copiedField={copiedField} onCopy={handleCopy} />
                        <CopyableField label="Sender Bank Code" value={transaction.ktaSenderBankCode || ""} copiedField={copiedField} onCopy={handleCopy} />
                    </div>
                </div>
            )}

            {/* Recipient Details */}
            {(transaction.recipientAccountName || transaction.recipientAccountNumber) && (
                <div className="rounded-2xl bg-white p-5 md:p-6 ring-1 ring-slate-100 shadow-sm space-y-4">
                    <h2 className="text-lg font-semibold text-slate-900">Recipient Details</h2>

                    <div className="grid gap-3">
                        <CopyableField label="Recipient Name" value={transaction.recipientAccountName || ""} copiedField={copiedField} onCopy={handleCopy} />
                        <CopyableField label="Recipient Account Number" value={transaction.recipientAccountNumber || ""} copiedField={copiedField} onCopy={handleCopy} />
                        <CopyableField label="Recipient Account Type" value={transaction.recipientAccountType || ""} copiedField={copiedField} onCopy={handleCopy} />
                        <CopyableField label="Bank Name" value={transaction.bankName || ""} copiedField={copiedField} onCopy={handleCopy} />
                        <CopyableField label="Bank Code" value={transaction.bankCode || ""} copiedField={copiedField} onCopy={handleCopy} />
                    </div>
                </div>
            )}

            {/* Vendor & Reference Information */}
            <div className="rounded-2xl bg-white p-5 md:p-6 ring-1 ring-slate-100 shadow-sm space-y-4">
                <h2 className="text-lg font-semibold text-slate-900">Vendor & Reference Information</h2>

                <div className="grid gap-3">
                    <CopyableField label="Billing Vendor Reference" value={transaction.billingVendorReference || ""} copiedField={copiedField} onCopy={handleCopy} />
                    <CopyableField label="Payment Vendor Reference" value={transaction.paymentVendorReference || ""} copiedField={copiedField} onCopy={handleCopy} />
                    <CopyableField label="Product ID" value={transaction.productId || ""} copiedField={copiedField} onCopy={handleCopy} />
                    <CopyableField label="Source" value={transaction.source || ""} copiedField={copiedField} onCopy={handleCopy} />
                </div>
            </div>

            {/* Financial Details */}
            <div className="rounded-2xl bg-white p-5 md:p-6 ring-1 ring-slate-100 shadow-sm space-y-4">
                <h2 className="text-lg font-semibold text-slate-900">Financial Details</h2>

                <div className="grid gap-3">
                    <CopyableField label="Wallet Balance" value={transaction.walletBalance || ""} copiedField={copiedField} onCopy={handleCopy} />
                    <CopyableField label="Wallet Currency" value={transaction.walletCurrency || ""} copiedField={copiedField} onCopy={handleCopy} />
                    <CopyableField label="Currency" value={transaction.currency || ""} copiedField={copiedField} onCopy={handleCopy} />
                    <CopyableField label="Customer Commission" value={transaction.customerCommission || ""} copiedField={copiedField} onCopy={handleCopy} />
                </div>
            </div>

            {/* Terminal & Location Info */}
            <div className="rounded-2xl bg-white p-5 md:p-6 ring-1 ring-slate-100 shadow-sm space-y-4">
                <h2 className="text-lg font-semibold text-slate-900">Terminal & Location</h2>

                <div className="grid gap-3">
                    <CopyableField label="POS Terminal ID" value={transaction.posTid || ""} copiedField={copiedField} onCopy={handleCopy} />
                    <CopyableField label="POS Serial Number" value={transaction.posSerialNumber || ""} copiedField={copiedField} onCopy={handleCopy} />
                    <CopyableField label="Receipt Terminal ID" value={transaction.receiptTerminalId || ""} copiedField={copiedField} onCopy={handleCopy} />
                    <CopyableField label="Customer Biller ID" value={transaction.customerBillerId || ""} copiedField={copiedField} onCopy={handleCopy} />
                </div>
            </div>

            {/* Metadata */}
            <div className="rounded-2xl bg-white p-5 md:p-6 ring-1 ring-slate-100 shadow-sm space-y-4">
                <h2 className="text-lg font-semibold text-slate-900">Additional Information</h2>

                <div className="grid gap-3">
                    <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Entry Type</p>
                        <p className="mt-1 text-sm text-slate-700 capitalize">{transaction.entryType || "—"}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Transaction Category</p>
                        <p className="mt-1 text-sm text-slate-700 capitalize">{transaction.transactionCategory || "—"}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Agent Transaction</p>
                        <p className="mt-1 text-sm text-slate-700">{transaction.isAgentTransaction ? "Yes" : "No"}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">International</p>
                        <p className="mt-1 text-sm text-slate-700">{transaction.isInternational ? "Yes" : "No"}</p>
                    </div>
                    <CopyableField label="User ID" value={transaction.userId || ""} copiedField={copiedField} onCopy={handleCopy} />
                    <CopyableField label="Date Created" value={formatDate(transaction.timeCreated || "")} copiedField={copiedField} onCopy={handleCopy} />
                    <CopyableField label="Date Updated" value={formatDate(transaction.timeUpdated || "")} copiedField={copiedField} onCopy={handleCopy} />
                </div>
            </div>
        </div>
    );
}

export default withPartnerAuth(TransactionDetailPage);
