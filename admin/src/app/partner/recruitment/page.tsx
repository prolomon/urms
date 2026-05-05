"use client";

import { useCallback, useEffect, useState } from "react";
import { FormState, getRecruitments } from "@/lib/services/recruitment";
import Link from "next/link";

export default function AdminRecruitmentPage() {
    const [records, setRecords] = useState<FormState[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadRecruitments = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const res = await getRecruitments();
            setRecords(Array.isArray(res?.data) ? res.data : []);
        } catch (e: any) {
            setError(e?.message || "Failed to load recruitment records");
            setRecords([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadRecruitments();
    }, [loadRecruitments]);

    const escapeCSV = (value: string | number | null | undefined) => {
        if (value === null || value === undefined) return "";
        const text = typeof value === "string" ? value : String(value);
        return `"${text.replace(/"/g, '""')}"`;
    };

    const handleDownloadCSV = () => {
        if (records.length === 0) return;

        const headers = [
            "Full Name",
            "Email",
            "Phone",
            "Gender",
            "State",
            "LGA",
            "Copper",
            "Address",
            "Date",
        ];

        const lines = [headers.join(",")];

        records.forEach((record) => {
            lines.push(
                [
                    escapeCSV(record.fullname || "-"),
                    escapeCSV(record.email || "-"),
                    escapeCSV(record.phone || "-"),
                    escapeCSV(record.gender || "-"),
                    escapeCSV(record.state || "-"),
                    escapeCSV(record.lga || "-"),
                    escapeCSV(record.isCopper || "-"),
                    escapeCSV(record.address || "-"),
                    escapeCSV(record.createdAt ? new Date(record.createdAt).toLocaleDateString() : "-"),
                ].join(","),
            );
        });

        const csv = lines.join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `Registered-Recruitment-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();

        URL.revokeObjectURL(url);
    };

    return (
        <div className="max-w-full space-y-4 overflow-x-hidden p-4 md:p-6">
            <div className="rounded-2xl bg-linear-to-r from-emerald-50 via-white to-cyan-50 p-5 md:p-6 ring-1 ring-emerald-100">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
                            Recruitment Signups
                        </h1>
                        <p className="mt-1 text-sm text-slate-600 md:text-base">
                            View all candidates who signed up through the recruitment portal.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={loadRecruitments}
                            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                        >
                            Refresh
                        </button>

                        <button
                            type="button"
                            onClick={handleDownloadCSV}
                            disabled={loading || records.length === 0}
                            className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Download CSV
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-100 shadow-sm">
                    <p className="text-sm text-slate-600">Loading recruitment records...</p>
                </div>
            ) : records.length === 0 ? (
                <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-100 shadow-sm">
                    <p className="text-sm text-slate-600">No recruitment signups found yet.</p>
                </div>
            ) : (
                <>
                    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm md:p-5">
                        <p className="text-sm text-slate-600">
                            Total Registered: <span className="font-semibold text-slate-900">{records.length}</span>
                        </p>
                    </div>

                    <div className="relative block w-full max-w-full rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm">
                        <div className="relative block w-full max-w-full">
                            <table className="w-full min-w-230 table-auto text-left">
                                <thead className="border-b border-slate-200 bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-700 md:px-6 md:text-sm">Full Name</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-700 md:px-6 md:text-sm">Email</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-700 md:px-6 md:text-sm">Gender</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-700 md:px-6 md:text-sm">State</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-700 md:px-6 md:text-sm">LGA</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-700 md:px-6 md:text-sm">Copper</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-700 md:px-6 md:text-sm">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {records.map((record, index) => (
                                        <tr key={`${record.email}-${record.phone}-${index}`} className="transition-colors hover:bg-slate-50">
                                            <td className="px-4 py-4 text-xs font-semibold text-slate-900 md:px-6 md:text-sm text-nowrap"><Link href={`/admin/recruitment/${record.id}`} className="hover:text-emerald-600">{record.fullname || "-"}</Link></td>
                                            <td className="px-4 py-4 text-xs text-slate-700 text-nowrap md:px-6 md:text-sm">{record.email || "-"}</td>
                                            <td className="px-4 py-4 text-xs text-slate-700 md:px-6 md:text-sm text-nowrap">{record.gender || "-"}</td>
                                            <td className="px-4 py-4 text-xs text-slate-700 md:px-6 md:text-sm text-nowrap">{record.state || "-"}</td>
                                            <td className="px-4 py-4 text-xs text-slate-700 md:px-6 md:text-sm text-nowrap">{record.lga || "-"}</td>
                                            <td className="px-4 py-4 text-xs md:px-6 md:text-sm text-nowrap">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${record.isCopper === "Yes"
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : "bg-slate-100 text-slate-700"
                                                        }`}
                                                >
                                                    {record.isCopper || "-"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-xs text-slate-700 md:px-6 md:text-sm text-nowrap">
                                                {record.createdAt ? new Date(record.createdAt).toLocaleDateString() : "-"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
