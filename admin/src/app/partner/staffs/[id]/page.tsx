"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Edit2,
    Trash2,
    AlertCircle,
    ArrowLeft,
    RefreshCw,
    CheckCircle2,
    Mail,
    Phone,
    MapPin,
    UserRound,
    BadgeInfo,
    Camera,
} from "lucide-react";
import {
    getStaff,
    deleteStaff,
    updateStaff,
    Staff,
} from "@/lib/services/staff";
import { useAuth } from "@/context/AuthContext";
import { useParams } from "next/navigation";

export default function StaffDetailsPage() {
    const { id } = useParams();
    const { user } = useAuth();

    const router = useRouter();
    const [avatarFileName, setAvatarFileName] = useState("");
    const [staff, setStaff] = useState<Staff | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        fullname: "",
        email: "",
        phone: "",
        gender: "",
        location: "",
    });
    const [saving, setSaving] = useState(false);
    const [toasts, setToasts] = useState<
        { id: number; type: string; message: string }[]
    >([]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const addToast = (type: "success" | "error", message: string, ttl = 4000) => {
        const id = Date.now() + Math.random();
        setToasts((s) => [...s, { id, type, message }]);
        setTimeout(() => setToasts((s) => s.filter((t) => t.id !== id)), ttl);
    };

    const fetchData = useCallback(() => {
        let mounted = true;
        const load = async () => {
            setLoading(true);
            try {
                const s = await getStaff(id as string);
                if (!mounted) return;

                const data = s.staff;
                setStaff(data);
                setForm({
                    fullname: data?.fullname || "",
                    email: data?.email || "",
                    phone: data?.phone || "",
                    gender: data?.gender || "",
                    location: data?.location || "",
                });

                addToast("success", "Staff loaded");
            } catch (e) {
                console.error(e);
                addToast("error", "Failed to fetch staff");
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => (mounted = false);
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleChange = (k: string, v: string | boolean) => {
        setForm((s) => ({
            ...s,
            [k]: v,
        }));
    };

    const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setAvatarFileName(file?.name || "");
        setForm((s) => ({
            ...s,
            avatar: "",
        }));
    };

    const handleSave = async () => {
        if (!form.fullname || !form.email || !form.phone) {
            addToast("error", "Please fill all required fields");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                ...form
            };

            await updateStaff(id as string, payload);
            setStaff((prev) => ({
                ...prev,
                ...payload,
            }));
            setEditing(false);
            addToast("success", "Staff updated successfully");
        } catch (e) {
            console.error(e);
            addToast("error", e.error || e.message || "Update failed");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteStaff(id as string);
            addToast("success", "Staff deleted successfully");
            setTimeout(() => router.push("/admin/staffs"), 1500);
        } catch (e) {
            console.error(e);
            addToast("error", "Delete failed");
        } finally {
            setDeleting(false);
            setDeleteModalOpen(false);
        }
    };

    const handleRetry = async () => {
        setLoading(true);
        try {
            const s = await getStaff(id as string);
            const data = s.staff;
            setStaff(data);
            setForm({
                fullname: data?.fullname || "",
                email: data?.email || "",
                phone: data?.phone || "",
                gender: data?.gender || "",
                location: data?.location || ""
            });
            addToast("success", "Staff loaded");
        } catch (e) {
            console.error(e);
            addToast("error", "Failed to fetch staff");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setForm({
            fullname: staff?.fullname || "",
            email: staff?.email || "",
            phone: staff?.phone || "",
            gender: staff?.gender || "",
            location: staff?.location || ""
        });
        setAvatarFileName("");
        setEditing(false);
    };

    const avatarLabel = staff?.avatar || "No avatar uploaded";
    const avatarInitial = (staff?.fullname || form.fullname || "S").charAt(0).toUpperCase();

    const detailCards = [
        {
            label: "Email",
            value: staff?.email || "—",
            icon: Mail,
        },
        {
            label: "Phone",
            value: staff?.phone || "—",
            icon: Phone,
        },
        {
            label: "Location",
            value: staff?.location || "—",
            icon: MapPin,
        },
        {
            label: "Gender",
            value: staff?.gender || "—",
            icon: UserRound,
        },
    ];

    return (
        <div className="mx-auto max-w-7xl space-y-4 p-4 md:p-6">
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

            {deleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-100">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                            <AlertCircle className="text-red-600" size={24} />
                        </div>
                        <h3 className="mb-2 text-center text-lg font-semibold text-slate-900">
                            Delete Staff Member?
                        </h3>
                        <p className="mb-6 text-center text-sm text-slate-600">
                            Are you sure you want to delete <strong>{staff?.fullname}</strong>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteModalOpen(false)}
                                disabled={deleting}
                                className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                            >
                                {deleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <button
                    onClick={() => router.push("/admin/staffs")}
                    className="inline-flex items-center gap-2 text-slate-600 transition-colors hover:text-slate-900"
                >
                    <ArrowLeft size={18} />
                    <span className="text-sm font-medium">Back to Staffs</span>
                </button>

                <div className="flex items-center gap-2">
                    {editing ? (
                        <>
                            <button
                                onClick={handleCancel}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50"
                            >
                                <ArrowLeft size={14} />
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-700 disabled:translate-y-0 disabled:opacity-50"
                            >
                                <CheckCircle2 size={16} />
                                {saving ? "Saving..." : "Save"}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setEditing(true)}
                                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-700"
                            >
                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 text-white">
                                    <Edit2 size={14} />
                                </span>
                                <span>Edit Staff</span>
                            </button>
                            <button
                                onClick={() => setDeleteModalOpen(true)}
                                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-50"
                            >
                                <Trash2 size={15} />
                                <span>Delete Staff</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex min-h-96 items-center justify-center rounded-2xl bg-white p-8 ring-1 ring-slate-100">
                    <div className="text-center">
                        <RefreshCw className="mx-auto mb-2 animate-spin text-emerald-600" size={24} />
                        <p className="text-sm text-slate-600">Loading staff details...</p>
                    </div>
                </div>
            ) : staff ? (
                <div className="space-y-4">
                    <div className="rounded-2xl bg-linear-to-r from-emerald-50 via-white to-cyan-50 p-5 ring-1 ring-emerald-100 md:p-6">
                        <div className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-start">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                    Staff Overview
                                </p>
                                <h2 className="mt-2 text-2xl font-bold text-slate-800 md:text-3xl">
                                    {staff.fullname || "Unnamed Staff"}
                                </h2>
                                <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
                                    View and manage this staff profile from one place.
                                </p>

                                <div className="mt-5 flex flex-wrap gap-2">
                                    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 gap-1">
                                        <CheckCircle2 className="mr-1" size={14} />
                                        {staff.role || "STAFF"}
                                    </span>
                                    <span
                                        className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${staff.status === false
                                            ? "border-red-200 bg-red-50 text-red-700"
                                            : "border-emerald-200 bg-emerald-50 text-emerald-700"
                                            }`}
                                    >
                                        {staff.status === false ? "Inactive" : "Active"}
                                    </span>
                                </div>
                            </div>

                            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-2xl font-bold text-slate-600 ring-1 ring-slate-200">
                                        {staff.avatar ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={staff.avatar}
                                                alt={staff.fullname || "Staff avatar"}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            avatarInitial
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Avatar
                                        </p>
                                        <p className="mt-1 truncate text-sm font-medium text-slate-900">
                                            {avatarLabel}
                                        </p>
                                        <div className="mt-4 grid gap-3 text-sm text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <BadgeInfo size={16} className="text-slate-400" />
                                                <span>Staff ID: {staff.uid || "—"}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Mail size={16} className="text-slate-400" />
                                                <span className="truncate">{staff.email || "—"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* {editing && (
                                    <div className="mt-5 border-t border-slate-100 pt-5">
                                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            Avatar File
                                        </label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarFileChange}
                                            className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                                        />
                                        <p className="mt-2 text-xs text-slate-500">
                                            {avatarFileName ? `Selected: ${avatarFileName}` : "No file selected"}
                                        </p>
                                    </div>
                                )} */}
                            </div>
                        </div>
                    </div>

                    {/* basic information */}
                    <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-sm md:p-6">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <h3 className="text-lg font-semibold text-slate-900">
                                Basic Information
                            </h3>
                            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold gap-2 text-slate-600">
                                <Camera className="mr-1" size={14} />
                                Profile details
                            </span>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                {editing ? (
                                    <input
                                        type="text"
                                        value={form.fullname}
                                        onChange={(e) => handleChange("fullname", e.target.value)}
                                        className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                                    />
                                ) : (
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                                        {staff.fullname || "—"}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                {editing ? (
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => handleChange("email", e.target.value)}
                                        className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                                    />
                                ) : (
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                                        {staff.email || "—"}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                                    Phone <span className="text-red-500">*</span>
                                </label>
                                {editing ? (
                                    <input
                                        type="tel"
                                        value={form.phone}
                                        onChange={(e) => handleChange("phone", e.target.value)}
                                        className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                                    />
                                ) : (
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                                        {staff.phone || "—"}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                                    Gender
                                </label>
                                {editing ? (
                                    <select
                                        value={form.gender}
                                        onChange={(e) => handleChange("gender", e.target.value)}
                                        className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                ) : (
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                                        {staff.gender || "—"}
                                    </div>
                                )}
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                                    Location
                                </label>
                                {editing ? (
                                    <input
                                        type="text"
                                        value={form.location}
                                        onChange={(e) => handleChange("location", e.target.value)}
                                        className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                                    />
                                ) : (
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                                        {staff.location || "—"}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* detail summary */}
                    <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-sm md:p-6">
                        <h3 className="mb-4 text-lg font-semibold text-slate-900">
                            Detail Summary
                        </h3>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {detailCards.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div
                                        key={item.label}
                                        className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                                    >
                                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 ring-1 ring-slate-200">
                                            <Icon size={18} />
                                        </div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            {item.label}
                                        </p>
                                        <p className="mt-2 wrap-break-word text-sm font-medium text-slate-900">
                                            {item.value}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* record metadata */}
                    <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-sm md:p-6">
                        <h3 className="mb-4 text-lg font-semibold text-slate-900">
                            Record Metadata
                        </h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                                    Created
                                </label>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                                    {staff.createdAt
                                        ? new Date(staff.createdAt).toLocaleString()
                                        : "—"}
                                </div>
                            </div>
                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                                    Last Updated
                                </label>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                                    {staff.updatedAt
                                        ? new Date(staff.updatedAt).toLocaleString()
                                        : "—"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-slate-100">
                    <AlertCircle className="mx-auto mb-2 text-red-600" size={32} />
                    <p className="mb-4 text-sm text-slate-600">
                        Failed to load staff details
                    </p>
                    <button
                        onClick={handleRetry}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                    >
                        <RefreshCw size={16} />
                        Retry
                    </button>
                </div>
            )}
        </div>
    );
}
