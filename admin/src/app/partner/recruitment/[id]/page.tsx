"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
	ArrowLeft,
	CalendarDays,
	CreditCard,
	Landmark,
	Mail,
	MapPin,
	Phone,
	RefreshCw,
	ShieldCheck,
	Trash2,
	UserRound,
} from "lucide-react";
import {
	FormState,
	deleteRecruitment,
	getRecruitment,
} from "@/lib/services/recruitment";

const formatDate = (value?: string) => {
	if (!value) return "-";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "-";
	return date.toLocaleString();
};

export default function AdminRecruitmentDetailsPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const id = params?.id || "";

	const [record, setRecord] = useState<FormState | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [deleting, setDeleting] = useState(false);

	const loadRecruitment = useCallback(async () => {
		if (!id) return;

		setLoading(true);
		setError("");

		try {
			const res = await getRecruitment(id);
			setRecord(res?.data || null);

            console.log(res)
		} catch (e: any) {
			setError(e?.message || "Failed to load recruitment record");
			setRecord(null);
		} finally {
			setLoading(false);
		}
	}, [id]);

	useEffect(() => {
		loadRecruitment();
	}, [loadRecruitment]);

	const handleDelete = async () => {
		if (!id || deleting) return;

		const confirmed = window.confirm("Delete this recruit record? This action cannot be undone.");
		if (!confirmed) return;

		setDeleting(true);
		try {
			await deleteRecruitment(id);
			router.push("/admin/recruitment");
		} catch (e: any) {
			setError(e?.message || "Failed to delete recruitment record");
		} finally {
			setDeleting(false);
		}
	};

	const copperStatus = useMemo(() => {
		if (record?.isCopper === "Yes") {
			return "bg-emerald-100 text-emerald-700";
		}
		return "bg-slate-100 text-slate-700";
	}, [record?.isCopper]);

	return (
		<div className="mx-auto max-w-7xl space-y-4 p-4 md:space-y-5 md:p-6">
			<div className="rounded-2xl bg-linear-to-r from-emerald-50 via-white to-cyan-50 p-5 ring-1 ring-emerald-100 md:p-6">
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div>
						<h1 className="text-2xl font-bold text-slate-800 md:text-3xl">Recruitment Details</h1>
						<p className="mt-1 text-sm text-slate-600">
							View complete recruit profile, onboarding details, and submitted bank data.
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<Link
							href="/admin/recruitment"
							className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
						>
							<ArrowLeft className="h-4 w-4" />
							Back
						</Link>
						<button
							type="button"
							onClick={loadRecruitment}
							disabled={loading}
							className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
						>
							<RefreshCw className="h-4 w-4" />
							Refresh
						</button>
						<button
							type="button"
							onClick={handleDelete}
							disabled={deleting || loading || !record}
							className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
						>
							<Trash2 className="h-4 w-4" />
							{deleting ? "Deleting..." : "Delete"}
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
					<p className="text-sm text-slate-600">Loading recruit details...</p>
				</div>
			) : !record ? (
				<div className="rounded-2xl bg-white p-6 ring-1 ring-slate-100 shadow-sm">
					<p className="text-sm text-slate-600">Recruitment record not found.</p>
				</div>
			) : (
				<>
					<div className="grid gap-4 md:grid-cols-2">
						<div className="rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-sm">
							<p className="text-xs uppercase tracking-wide text-slate-500">Personal Information</p>
							<h2 className="mt-1 text-lg font-semibold text-slate-900">Recruit Profile</h2>

							<div className="mt-4 space-y-3 text-sm text-slate-700">
								<p className="flex items-start gap-2">
									<UserRound className="mt-0.5 h-4 w-4 text-emerald-600" />
									<span>{record.fullname || "-"}</span>
								</p>
								<p className="flex items-start gap-2">
									<Mail className="mt-0.5 h-4 w-4 text-emerald-600" />
									<span>{record.email || "-"}</span>
								</p>
								<p className="flex items-start gap-2">
									<Phone className="mt-0.5 h-4 w-4 text-emerald-600" />
									<span>{record.phone || "-"}</span>
								</p>
								<p className="flex items-center gap-2">
									<ShieldCheck className="h-4 w-4 text-emerald-600" />
									<span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${copperStatus}`}>
										Copper: {record.isCopper || "-"}
									</span>
								</p>
								<p className="text-slate-600">
									<span className="font-semibold text-slate-700">Gender:</span> {record.gender || "-"}
								</p>
								<p className="text-slate-600">
									<span className="font-semibold text-slate-700">Date of Birth:</span> {new Date(record.dob).toDateString() || "-"}
								</p>
							</div>
						</div>

						<div className="rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-sm">
							<p className="text-xs uppercase tracking-wide text-slate-500">Location</p>
							<h2 className="mt-1 text-lg font-semibold text-slate-900">Address Details</h2>

							<div className="mt-4 space-y-3 text-sm text-slate-700">
								<p className="flex items-start gap-2">
									<MapPin className="mt-0.5 h-4 w-4 text-emerald-600" />
									<span>{record.state || "-"}, {record.lga || "-"}</span>
								</p>
								<p className="rounded-xl bg-slate-50 px-3 py-2 text-slate-700">
									{record.address || "-"}
								</p>
							</div>
						</div>
					</div>

					<div className="grid gap-4 md:grid-cols-2">
						<div className="rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-sm">
							<p className="text-xs uppercase tracking-wide text-slate-500">Banking</p>
							<h2 className="mt-1 text-lg font-semibold text-slate-900">Payout Account</h2>

							<div className="mt-4 space-y-3 text-sm text-slate-700">
								<p className="flex items-start gap-2">
									<Landmark className="mt-0.5 h-4 w-4 text-emerald-600" />
									<span>{record.bank || "-"}</span>
								</p>
								<p className="flex items-start gap-2">
									<UserRound className="mt-0.5 h-4 w-4 text-emerald-600" />
									<span>{record.accountName || "-"}</span>
								</p>
								<p className="flex items-start gap-2">
									<CreditCard className="mt-0.5 h-4 w-4 text-emerald-600" />
									<span>{record.accountNumber || "-"}</span>
								</p>
							</div>
						</div>

						<div className="rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-sm">
							<p className="text-xs uppercase tracking-wide text-slate-500">Record Timeline</p>
							<h2 className="mt-1 text-lg font-semibold text-slate-900">Submission Metadata</h2>

							<div className="mt-4 space-y-3 text-sm text-slate-700">
								<p className="flex items-start gap-2">
									<CalendarDays className="mt-0.5 h-4 w-4 text-emerald-600" />
									<span>
										<span className="font-semibold text-slate-700">Created:</span> {formatDate(record.createdAt)}
									</span>
								</p>
								<p className="flex items-start gap-2">
									<CalendarDays className="mt-0.5 h-4 w-4 text-emerald-600" />
									<span>
										<span className="font-semibold text-slate-700">Updated:</span> {formatDate(record.updatedAt)}
									</span>
								</p>
								<p className="rounded-xl bg-slate-50 px-3 py-2 text-slate-600">
									<span className="font-semibold text-slate-700">Note:</span> Review bank details before approval and follow up with applicant if verification is pending.
								</p>
							</div>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
