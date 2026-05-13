"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    CheckCircle2,
    Clock3,
    Copy,
    Loader2,
    XCircle,
} from "lucide-react";
import withAuth from "@/components/withAuth";
import { getRecord, PaymentTransaction } from "@/lib/services/payments";
import { getMember, Member } from "@/lib/services/member";
import { getPricingById, Pricing } from "@/lib/services/pricing";

function formatCurrency(value: number | string, currency = "NGN") {
    const amount = typeof value === "string" ? Number(value) : value;
    if (!Number.isFinite(amount)) return "—";

    return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency,
    }).format(amount);
}

function formatDate(value?: string | Date) {
    if (!value) return "—";
    const date = typeof value === "string" ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString("en-NG", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

function statusBadge(status) {
    const normalized = String(status || "").toUpperCase();

    if (normalized === "SUCCESS") {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Success
            </span>
        );
    }

    if (normalized === "PENDING") {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                <Clock3 className="h-4 w-4" />
                Pending
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
            <XCircle className="h-4 w-4" />
            Failed
        </span>
    );
}

interface InfoCardProps {
    label: string;
    value: string;
}

function InfoCard({ label, value }: InfoCardProps) {
    return (
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-2 wrap-break-word text-sm font-medium text-slate-900">{value || "—"}</p>
        </div>
    );
}

function RecordDetailPage() {
    const router = useRouter();
    const params = useParams();
    const partnerId = params.id as string;
    const recordId = params.recordId as string;

    const [record, setRecord] = useState<PaymentTransaction | null>(null);
    const [member, setMember] = useState<Member | null>(null);
    const [pricing, setPricing] = useState<Pricing | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const recordResponse = await getRecord(recordId);
            const transaction = recordResponse.transaction;

            if (!transaction) {
                setRecord(null);
                setMember(null);
                setPricing(null);
                setError("Record not found");
                return;
            }

            setRecord(transaction);

            const nextMemberPromise = transaction.userId ? getMember(transaction.userId) : Promise.resolve(null);
            const nextPricingPromise = transaction.pricingId ? getPricingById(transaction.pricingId) : Promise.resolve(null);

            const [memberResponse, pricingResponse] = await Promise.all([nextMemberPromise, nextPricingPromise]);

            setMember(memberResponse?.data || null);
            setPricing(pricingResponse?.pricing || null);
        } catch (fetchError: any) {
            console.error(fetchError);
            setError(fetchError?.message || "Failed to load payment record");
        } finally {
            setLoading(false);
        }
    }, [recordId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const metadata = record?.metadata || {};
    const receipt = metadata?.receipt || {};
    const split = metadata?.split || {};
    const sender = receipt?.sender || {};
    const recipients = receipt?.recipients || {};

    const settlementCards = useMemo(
        () => [
            { label: "Gross Amount", value: formatCurrency(receipt?.grossAmount ?? record?.amount ?? 0, record?.currency) },
            { label: "Net Amount", value: formatCurrency(receipt?.netAmount ?? record?.amount ?? 0, record?.currency) },
            { label: "Fee", value: formatCurrency(receipt?.fee ?? split?.fee ?? 0, record?.currency) },
            { label: "Main Amount", value: formatCurrency(split?.mainAmount ?? receipt?.breakdown?.main ?? 0, record?.currency) },
            { label: "Agent Amount", value: formatCurrency(split?.agentAmount ?? receipt?.breakdown?.agent ?? 0, record?.currency) },
            { label: "Technology Amount", value: formatCurrency(split?.technologyAmount ?? receipt?.breakdown?.technology ?? 0, record?.currency) },
        ],
        [record?.amount, record?.currency, receipt, split],
    );

    const handleCopy = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 1500);
        } catch (copyError) {
            console.error(copyError);
        }
    };

    if (loading) {
        return (
            <div className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center p-4 md:p-6">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                    <p className="text-sm text-slate-600">Loading record details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mx-auto max-w-7xl space-y-4 p-4 md:p-6">
                <button
                    type="button"
                    onClick={() => router.push(`/admin/partners/${partnerId}/finance`)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Finance
                </button>
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
                    <p className="text-sm font-medium">{error}</p>
                </div>
            </div>
        );
    }

    if (!record) {
        return (
            <div className="mx-auto max-w-7xl space-y-4 p-4 md:p-6">
                <button
                    type="button"
                    onClick={() => router.push(`/admin/partners/${partnerId}/finance`)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Finance
                </button>
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-600 shadow-sm">
                    Record not found.
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl space-y-4 p-4 md:p-6 md:space-y-5">
            <div className="rounded-2xl bg-linear-to-r from-emerald-50 via-white to-cyan-50 p-5 ring-1 ring-emerald-100 md:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Payment Record</p>
                        <h1 className="mt-2 text-2xl font-bold text-slate-800 md:text-3xl">Record Details</h1>
                        <p className="mt-1 text-sm text-slate-600">Review the payment record, member, and pricing information.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => router.push(`/admin/partners/${partnerId}/finance`)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Finance
                    </button>
                </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 md:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-xl font-bold text-slate-900">{record.reference}</h2>
                            {statusBadge(record.status)}
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{record.type || "—"} · {record.billing || "—"}</p>
                    </div>
                    <div className="text-left md:text-right">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Amount</p>
                        <p className="mt-1 text-3xl font-bold text-slate-900">{formatCurrency(record.amount, record.currency)}</p>
                        <p className="mt-1 text-sm text-slate-500">{record.currency || "NGN"}</p>
                    </div>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-3">
                    <InfoCard label="Date" value={formatDate(record.date)} />
                    <InfoCard label="Payment ID" value={record.paymentId || "—"} />
                    <InfoCard label="Record ID" value={record.id || "—"} />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 md:p-6 xl:col-span-2">
                    <h3 className="text-lg font-semibold text-slate-900">Payment Breakdown</h3>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {settlementCards.map((item) => (
                            <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                                <p className="mt-2 text-sm font-semibold text-slate-900">{item.value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 md:p-6">
                    <h3 className="text-lg font-semibold text-slate-900">Summary</h3>
                    <div className="mt-4 space-y-3 text-sm">
                        <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
                            <span className="text-slate-500">Channel</span>
                            <span className="font-medium text-slate-900">{record.name || record.type || "—"}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
                            <span className="text-slate-500">Category</span>
                            <span className="font-medium text-slate-900">{record.category || "—"}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
                            <span className="text-slate-500">Billing</span>
                            <span className="font-medium text-slate-900">{record.billing || "—"}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
                            <span className="text-slate-500">Reference</span>
                            <button
                                type="button"
                                onClick={() => handleCopy(record.reference, "reference")}
                                className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-right font-medium text-slate-900 hover:bg-white"
                            >
                                {copiedField === "reference" ? "Copied" : record.reference}
                                <Copy className="h-3.5 w-3.5 text-slate-400" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 md:p-6">
                    <h3 className="mb-4 text-lg font-semibold text-slate-900">Member Information</h3>
                    <div className="grid gap-3">
                        <InfoCard label="Full Name" value={member?.fullname || "—"} />
                        <InfoCard label="Business Name" value={member?.businessName || "—"} />
                        <InfoCard label="Member UID" value={member?.uid || member?.id || "—"} />
                        <InfoCard label="Email" value={member?.email || "—"} />
                        <InfoCard label="Phone" value={member?.phone || "—"} />
                        <InfoCard label="Type" value={member?.type || "—"} />
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 md:p-6">
                    <h3 className="mb-4 text-lg font-semibold text-slate-900">Pricing Information</h3>
                    <div className="grid gap-3">
                        <InfoCard label="Pricing Title" value={pricing?.title || "—"} />
                        <InfoCard label="Pricing ID" value={pricing?.id || record.pricingId || "—"} />
                        <InfoCard label="Price" value={pricing?.price ? formatCurrency(pricing.price, record.currency) : "—"} />
                        <InfoCard label="Category" value={pricing?.category || "—"} />
                        <InfoCard label="Type" value={pricing?.type || "—"} />
                        <InfoCard label="Status" value={pricing?.status ? "Active" : "Inactive"} />
                    </div>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 md:p-6">
                    <h3 className="mb-4 text-lg font-semibold text-slate-900">Receipt Details</h3>
                    <div className="grid gap-3">
                        <InfoCard label="Receipt Reference" value={receipt?.reference || "—"} />
                        <InfoCard label="Payment Reference" value={receipt?.paymentReference || metadata?.paymentReference || "—"} />
                        <InfoCard label="Receipt Date" value={formatDate(receipt?.date)} />
                        <InfoCard label="Payment ID" value={receipt?.paymentId || record.paymentId || "—"} />
                        <InfoCard label="Gross Amount" value={formatCurrency(receipt?.grossAmount ?? record.amount ?? 0, record.currency)} />
                        <InfoCard label="Net Amount" value={formatCurrency(receipt?.netAmount ?? record.amount ?? 0, record.currency)} />
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 md:p-6">
                    <h3 className="mb-4 text-lg font-semibold text-slate-900">Sender & Recipients</h3>
                    <div className="grid gap-3">
                        <InfoCard label="Sender Name" value={sender?.accountName || "—"} />
                        <InfoCard label="Sender Bank" value={sender?.bankName || "—"} />
                        <InfoCard label="Sender Account Number" value={sender?.accountNumber || "—"} />
                        <InfoCard label="Agent Recipient" value={recipients?.agent?.accountName || "—"} />
                        <InfoCard label="Agent Bank" value={recipients?.agent?.bankName || "—"} />
                        <InfoCard label="Admin Recipient" value={recipients?.admin?.accountName || "—"} />
                    </div>
                </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 md:p-6">
                <h3 className="mb-4 text-lg font-semibold text-slate-900">Additional Data</h3>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <InfoCard label="User ID" value={record.userId || "—"} />
                    <InfoCard label="Company ID" value={record.companyId || "—"} />
                    <InfoCard label="Center ID" value={record.centerId || "—"} />
                    <InfoCard label="Created At" value={formatDate(record.createdAt)} />
                    <InfoCard label="Updated At" value={formatDate(record.updatedAt)} />
                    <InfoCard label="Transaction Billing" value={record.billing || "—"} />
                </div>
            </div>

            {/* metadata section */}
            {/* <div className="rounded-2xl bg-white p-5 text-slate-100 shadow-sm md:p-6">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">Metadata</h3>
                        <p className="mt-1 text-sm text-slate-900">The transaction metadata from the payment service.</p>
                    </div>
                    <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-600">
                        {record.type || "—"}
                    </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <InfoCard label="Transaction Type" value={metadata?.transactionType || "—"} />
                    <InfoCard label="Transaction Type Name" value={metadata?.transactionTypeName || "—"} />
                    <InfoCard label="Originating From" value={metadata?.originatingFrom || "—"} />
                    <InfoCard label="Alias Account Name" value={metadata?.aliasAccountName || "—"} />
                    <InfoCard label="Alias Account Number" value={metadata?.aliasAccountNumber || "—"} />
                    <InfoCard label="Alias Account Type" value={metadata?.aliasAccountType || "—"} />
                    <InfoCard label="Request ID" value={metadata?.requestId || "—"} />
                    <InfoCard label="Session ID" value={metadata?.sessionId || "—"} />
                </div>
            </div> */}
        </div>
    );
}

export default withAuth(RecordDetailPage);
