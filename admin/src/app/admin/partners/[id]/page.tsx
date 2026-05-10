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
    BadgeInfo,
    Camera,
    Hash,
    Users,
} from "lucide-react";
import {
    getCompany,
    deleteCompany,
    updateCompany,
    Company,
} from "@/lib/services/company";
import { useAuth } from "@/context/AuthContext";
import { useParams } from "next/navigation";
import { getWallet, Wallet as WalletType } from "@/lib/services/wallet";

export default function PartnerDetailsPage() {
    const { id } = useParams();
    const { user } = useAuth();

    const router = useRouter();
    const [avatarFileName, setAvatarFileName] = useState("");
    const [partner, setPartner] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        location: "",
        category: "HOSPITALITY & ACCOMMODATION"
    });
    const [saving, setSaving] = useState(false);
    const [toasts, setToasts] = useState<
        { id: number; type: string; message: string }[]
    >([]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [wallet, setWallet] = useState<WalletType | null>(null);

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
                const s = await getCompany(id as string);
                if (!mounted) return;

                const data = s.company;
                setPartner(data);
                setForm({
                    name: data?.name || "",
                    email: data?.email || "",
                    phone: data?.phone || "",
                    location: data?.location || "",
                    category: data?.category || "HOSPITALITY & ACCOMMODATION"
                });

                addToast("success", "Partner loaded");
            } catch (e) {
                console.error(e);
                addToast("error", "Failed to fetch partner");
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
    
    const fetchWalletData = useCallback(async () => {
        try {
          if (!partner?.uid) {
            setWallet(null);
            return;
          }
          const walletData = await getWallet(partner?.uid, "COMPANY");
    
          if (walletData?.ok) {
            setWallet(walletData?.wallet);
          } else {
            setWallet(null)
          }
        } catch (error: any) {
          console.log(error)
          addToast("error", error?.message || error?.error || "Failed to fetch wallet data");
        }
      }, [partner?.uid]);
    
      useEffect(() => {
        fetchWalletData();
      }, [fetchWalletData])

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
        if (!form.name || !form.email || !form.phone) {
            addToast("error", "Please fill all required fields");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                ...form
            };

            await updateCompany(id as string, payload);
            setPartner((prev) => ({
                ...prev,
                ...payload,
            }));
            setEditing(false);
            addToast("success", "Partner updated successfully");
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
            await deleteCompany(id as string);
            addToast("success", "Partner deleted successfully");
            setTimeout(() => router.push("/admin/partners"), 1500);
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
            const s = await getCompany(id as string);
            const data = s.company;
            setPartner(data);
            setForm({
                name: data?.name || "",
                email: data?.email || "",
                phone: data?.phone || "",
                location: data?.location || "",
                category: data?.category || "HOSPITALITY & ACCOMMODATION"
            });
            addToast("success", "Partner loaded");
        } catch (e) {
            console.error(e);
            addToast("error", "Failed to fetch partner");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setForm({
            name: partner?.name || "",
            email: partner?.email || "",
            phone: partner?.phone || "",
            location: partner?.location || "",
            category: partner?.category || "HOSPITALITY & ACCOMMODATION"
        });
        setAvatarFileName("");
        setEditing(false);
    };

    const avatarLabel = partner?.avatar || "No logo uploaded";
    const avatarInitial = (partner?.name || form.name || "O").charAt(0).toUpperCase();

    const detailCards = [
        {
            label: "Email",
            value: partner?.email || "—",
            icon: Mail,
        },
        {
            label: "Phone",
            value: partner?.phone || "—",
            icon: Phone,
        },
        {
            label: "Partner ID",
            value: partner?.uid || "—",
            icon: Hash,
        },
        {
            label: "Location",
            value: partner?.location || "—",
            icon: MapPin,
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-emerald-sm px-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-100">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                            <AlertCircle className="text-red-600" size={24} />
                        </div>
                        <h3 className="mb-2 text-center text-lg font-semibold text-slate-900">
                            Delete Partner?
                        </h3>
                        <p className="mb-6 text-center text-sm text-slate-600">
                            Are you sure you want to delete <strong>{partner?.name}</strong>? This action cannot be undone.
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
                                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                            >
                                {deleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <button
                    onClick={() => router.push("/admin/partners")}
                    className="inline-flex items-center gap-2 text-slate-600 transition-colors hover:text-slate-900"
                >
                    <ArrowLeft size={18} />
                    <span className="text-sm font-medium">Back to Partners</span>
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
                                onClick={() => router.push(`/admin/partners/${partner?.uid || id as string}/agents`)}
                                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50"
                            >
                                <Users size={15} />
                                <span>View Agents</span>
                            </button>
                            <button
                                onClick={() => setEditing(true)}
                                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-700"
                            >
                                <Edit2 size={14} />
                                <span>Edit Partner</span>
                            </button>
                            <button
                                onClick={() => setDeleteModalOpen(true)}
                                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-50"
                            >
                                <Trash2 size={15} />
                                <span>Delete Partner</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex min-h-96 items-center justify-center rounded-2xl bg-white p-8 ring-1 ring-slate-100">
                    <div className="text-center">
                        <RefreshCw className="mx-auto mb-2 animate-spin text-emerald-600" size={24} />
                        <p className="text-sm text-slate-600">Loading partner details...</p>
                    </div>
                </div>
            ) : partner ? (
                <div className="space-y-4">
                    {/* head card  */}
                    <div className="rounded-2xl bg-linear-to-r from-emerald-50 via-white to-cyan-50 p-5 ring-1 ring-emerald-100 md:p-6">
                        <div className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-start">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                    Partner Overview
                                </p>
                                <h2 className="mt-2 text-2xl font-bold text-slate-800 md:text-3xl">
                                    {partner.name || "Unnamed Partner"}
                                </h2>
                                <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
                                    View and manage this partner profile from one place.
                                </p>

                                <div className="mt-5 flex flex-wrap gap-2">
                                    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 gap-1">
                                        <CheckCircle2 className="mr-1" size={14} />
                                        {partner.role || "COMPANY"}
                                    </span>
                                    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 gap-1">
                                        <CheckCircle2 className="mr-1" size={14} />
                                        {partner.category}
                                    </span>
                                    <span
                                        className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${partner.status === false
                                            ? "border-red-200 bg-red-50 text-red-700"
                                            : "border-emerald-200 bg-emerald-50 text-emerald-700"
                                            }`}
                                    >
                                        {partner.status === false ? "Inactive" : "Active"}
                                    </span>
                                </div>
                            </div>

                            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-2xl font-bold text-slate-600 ring-1 ring-slate-200 aspect-square">
                                        {partner.avatar ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={partner.avatar}
                                                alt={partner.name || "Partner logo"}
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
                                                <span>Partner ID: {partner.uid || "—"}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Mail size={16} className="text-slate-400" />
                                                <span className="truncate">{partner.email || "—"}</span>
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
                                    Partner Name <span className="text-red-500">*</span>
                                </label>
                                {editing ? (
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => handleChange("name", e.target.value)}
                                        className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                                    />
                                ) : (
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                                        {partner.name || "—"}
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
                                        {partner.email || "—"}
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
                                        {partner.phone || "—"}
                                    </div>
                                )}
                            </div>

                            {/* Category */}
                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                                    Category <span className="text-red-500">*</span>
                                </label>
                                {editing ? (
                                    <select
                                        name="category"
                                        value={form.category}
                                        onChange={(e) => handleChange("category", e.target.value)}
                                        required
                                        className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                                    >
                                        <option value="HOSPITALITY & ACCOMMODATION">Hospitality & Accommodation</option>
                                        <option value="FOOD & BEVERAGE">Food & Beverage</option>
                                        <option value="CORPORATE & OFFICE PREMISES">Corporate & Office Premises</option>
                                        <option value="RETAIL & TRADE">Retail & Trade</option>
                                        <option value="SERVICES & ARTISANS">Services & Artisans</option>
                                        <option value="MEDIA & TELECOMMUNICATIONS">Media & Telecommunications</option>
                                    </select>
                                ) : (
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                                        {partner.category || "HOSPITALITY & ACCOMMODATION"}
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
                                        {partner.location || "—"}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* wallet card */}
                    {wallet && (
                        <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-sm md:p-6">
                            <h3 className="mb-4 text-lg font-semibold text-slate-900">
                                Wallet Details
                            </h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                                        Ledger Balance
                                    </label>
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                                        {typeof wallet.balance === 'number'
                                            ? `₦${wallet.balance.toFixed(2)}`
                                            : wallet.balance !== undefined
                                                ? `₦${wallet.balance}`
                                                : "—"}
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                                        Current Balance
                                    </label>
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                                        {typeof wallet.balance === 'number' ? `₦${wallet.balance.toFixed(2)}` : "—"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* account details */}
                    {wallet && (
                        <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-sm md:p-6">
                            <h3 className="mb-4 text-lg font-semibold text-slate-900">Account Details</h3>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account Name</p>
                                    <p className="mt-2 wrap-break-word text-sm font-medium text-slate-900">{wallet.accountName || "—"}</p>
                                </div>

                                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bank</p>
                                    <p className="mt-2 wrap-break-word text-sm font-medium text-slate-900">{wallet.bank?.name || "—"}</p>
                                </div>

                                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account Number</p>
                                    <p className="mt-2 wrap-break-word text-sm font-medium text-slate-900">{wallet.accountNo || "—"}</p>
                                </div>
                            </div>
                        </div>
                    )}

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
                                    {partner.createdAt
                                        ? new Date(partner.createdAt).toLocaleString()
                                        : "—"}
                                </div>
                            </div>
                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                                    Last Updated
                                </label>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
                                    {partner.updatedAt
                                        ? new Date(partner.updatedAt).toLocaleString()
                                        : "—"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex min-h-96 items-center justify-center rounded-2xl bg-white p-8 ring-1 ring-slate-100">
                    <div className="text-center">
                        <AlertCircle className="mx-auto mb-2 text-red-600" size={24} />
                        <p className="text-sm text-slate-600 mb-4">Failed to load partner</p>
                        <button
                            onClick={handleRetry}
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                        >
                            <RefreshCw size={16} />
                            Retry
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
