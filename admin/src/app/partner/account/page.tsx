"use client";

import { useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    CheckCircle2,
    LocateFixed,
    Loader2,
    LogOut,
    Pencil,
    Save,
    X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Admin } from "@/lib/services/admin";
import stateAndLgasData from "@/lib/jsons/state_and_lgas.json";
import { useRouter } from "next/navigation";

type StateLgaMap = Record<string, string[]>;
const stateLgaMap = stateAndLgasData as StateLgaMap;
type Feedback = {
    type: "success" | "error";
    message: string;
};

const mapAdminToForm = (admin: any): Admin => ({
    id: admin?.id ? String(admin.id) : "",
    uid: admin?.uid ? String(admin.uid) : "",
    center: admin?.center ?? "",
    email: admin?.email ?? "",
    phone: admin?.phone ?? "",
    adminName: admin?.adminName ?? "",
    adminEmail: admin?.adminEmail ?? "",
    adminPhone: admin?.adminPhone ?? "",
    adminLocation: admin?.adminLocation ?? "",
    state: admin?.state ?? "",
    address: admin?.address ?? "",
    lga: admin?.lga ?? "",
    country: admin?.country ?? "",
    location: {
        latitude:
            admin?.location?.latitude !== undefined
                ? admin.location.latitude
                : "",
        longitude:
            admin?.location?.longitude !== undefined
                ? admin.location.longitude
                : "",
    },
    status: admin?.status !== false,
});

import { getLocation } from "@/lib/services/location";

export default function AccountPage() {
    const router = useRouter();
    const { user, update, logout, refresh } = useAuth();

    const [form, setForm] = useState<Admin | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [locating, setLocating] = useState(false);
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [suggestions, setSuggestions] = useState([]);
    const [adminSuggestions, setAdminSuggestions] = useState([]);

    const states = useMemo(
        () => Object.keys(stateLgaMap).sort((a, b) => a.localeCompare(b)),
        [],
    );

    const lgas = useMemo(
        () => (form?.state ? stateLgaMap[form.state] ?? [] : []),
        [form?.state],
    );

    const hasProfile = useMemo(() => {
        return Boolean(form?.uid || form?.id || form?.email);
    }, [form]);

    useEffect(() => {
        setLoading(true);
        setFeedback(null);

        if (user) {
            setForm(mapAdminToForm(user));
        } else {
            setForm(null);
        }

        setLoading(false);
    }, [user]);

    useEffect(() => {
        if (!loading && !hasProfile) {
            router.replace("/");
        }
    }, [hasProfile, loading, router]);

    type StringField = Exclude<keyof Admin, "location">;

    const updateField = (field: StringField, value: string) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const buildUpdatePayload = () => {
        const payload: Record<string, unknown> = {
            center: form?.center.trim(),
            email: form?.email.trim(),
            state: form?.state.trim(),
            address: form?.address.trim(),
            lga: form?.lga.trim(),
            country: form?.country.trim(),
            phone: form?.phone.trim(),
            adminName: form?.adminName.trim(),
            adminEmail: form?.adminEmail.trim(),
            adminPhone: form?.adminPhone.trim(),
            adminLocation: form?.adminLocation.trim(),
        };

        if (
            form?.location?.latitude !== undefined &&
            form?.location?.latitude !== null &&
            form?.location?.longitude !== undefined &&
            form?.location?.longitude !== null
        ) {
            const latitude = Number(form?.location?.latitude);
            const longitude = Number(form?.location?.longitude);

            if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
                payload.location = {
                    latitude,
                    longitude,
                };
            }
        }

        return payload;
    };

    const handleEditOrUpdate = async () => {
        if (!editing) {
            setEditing(true);
            setFeedback(null);
            return;
        }

        setSaving(true);
        setFeedback(null);

        try {
            const data = await update(buildUpdatePayload(), user?.uid ?? "");
            if (data?.admin) {
                setForm(mapAdminToForm(data.admin));
                refresh();
            }
            setFeedback({
                type: "success",
                message: "Account details updated successfully",
            });
        } catch (error) {
            setFeedback({
                type: "error",
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to update account details",
            });
        } finally {
            setSaving(false);
            setEditing(false);
        }
    };

    const handleUseCurrentLocation = () => {
        setFeedback(null);

        if (typeof navigator === "undefined" || !navigator.geolocation) {
            setFeedback({
                type: "error",
                message: "Geolocation is not supported on this browser.",
            });
            return;
        }

        setLocating(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setForm((prev) => ({
                    ...prev,
                    location: {
                        latitude: Number(position.coords.latitude.toFixed(6)),
                        longitude: Number(position.coords.longitude.toFixed(6)),
                    },
                }));

                setFeedback({
                    type: "success",
                    message: "Location updated from your current device position",
                });
                setLocating(false);
            },
            (geoError) => {
                let message = "Unable to get your current location.";

                if (geoError.code === geoError.PERMISSION_DENIED) {
                    message = "Location permission denied. Please allow access and try again.";
                } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
                    message = "Location information is unavailable.";
                } else if (geoError.code === geoError.TIMEOUT) {
                    message = "Location request timed out. Try again.";
                }

                setFeedback({
                    type: "error",
                    message,
                });
                setLocating(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            },
        );
    };

    const handleLocationChange = async (value: string) => {
        updateField("address", value);

        if (!value?.trim()) {
            setSuggestions([]);
            return;
        }

        try {
            const res = await getLocation({ query: value, limit: 30 });
            setSuggestions(res || []);
        } catch (e) {
            console.error("Failed to fetch locations", e);
            setSuggestions([]);
        }
    };

    const handleAdminLocationChange = async (value: string) => {
        updateField("adminLocation", value);

        if (!value?.trim()) {
            setAdminSuggestions([]);
            return;
        }

        try {
            const res = await getLocation({ query: value, limit: 30 });
            setAdminSuggestions(res || []);
        } catch (e) {
            console.error("Failed to fetch locations", e);
            setAdminSuggestions([]);
        }
    };

    if (loading) {
        return (
            <div className="p-4 md:p-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                    <div className="inline-flex items-center gap-2 text-slate-600">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Loading account details...
                    </div>
                </div>
            </div>
        );
    }

    if (!hasProfile) {
        return (
            <div className="p-4 md:p-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                    <div className="inline-flex items-center gap-2 text-slate-600">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Redirecting...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Account</h1>
                        <p className="text-sm text-slate-500">
                            Manage your profile and account actions.
                        </p>
                    </div>
                    <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${form?.status
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                    >
                        {form?.status ? "Active" : "Disabled"}
                    </span>
                </div>
            </div>

            {feedback && (
                <div
                    className={`rounded-xl border p-3 text-sm flex items-center gap-2 ${feedback.type === "success"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-rose-50 border-rose-200 text-rose-700"
                        }`}
                >
                    {feedback.type === "success" ? (
                        <CheckCircle2 className="h-4 w-4" />
                    ) : (
                        <AlertCircle className="h-4 w-4" />
                    )}
                    <span>{feedback.message}</span>
                </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
                {!hasProfile ? (
                    <p className="text-sm text-slate-600 text-center">No account data available.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">
                                Center UID
                            </label>
                            <input
                                value={form?.uid}
                                readOnly
                                className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">
                                Center Name
                            </label>
                            <input
                                value={form?.center}
                                readOnly={!editing}
                                onChange={(event) => updateField("center", event.target.value)}
                                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${editing
                                    ? "border-slate-300 bg-white text-slate-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                                    : "border-slate-200 bg-slate-100 text-slate-700"
                                    }`}
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">
                                Center Email
                            </label>
                            <input
                                value={form?.email}
                                readOnly={!editing}
                                onChange={(event) => updateField("email", event.target.value)}
                                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${editing
                                    ? "border-slate-300 bg-white text-slate-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                                    : "border-slate-200 bg-slate-100 text-slate-700"
                                    }`}
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">
                                Center Phone Number
                            </label>
                            <input
                                value={form?.phone}
                                readOnly={!editing}
                                onChange={(event) => updateField("phone", event.target.value)}
                                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${editing
                                    ? "border-slate-300 bg-white text-slate-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                                    : "border-slate-200 bg-slate-100 text-slate-700"
                                    }`}
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">
                                Admin Name
                            </label>
                            <input
                                value={form?.adminName}
                                readOnly={!editing}
                                onChange={(event) => updateField("adminName", event.target.value)}
                                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${editing
                                    ? "border-slate-300 bg-white text-slate-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                                    : "border-slate-200 bg-slate-100 text-slate-700"
                                    }`}
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">
                                Admin Phone Number
                            </label>
                            <input
                                value={form?.adminPhone}
                                readOnly={!editing}
                                onChange={(event) => updateField("adminPhone", event.target.value)}
                                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${editing
                                    ? "border-slate-300 bg-white text-slate-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                                    : "border-slate-200 bg-slate-100 text-slate-700"
                                    }`}
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">
                                Admin Email Address
                            </label>
                            <input
                                value={form?.adminEmail}
                                readOnly={!editing}
                                onChange={(event) => updateField("adminEmail", event.target.value)}
                                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${editing
                                    ? "border-slate-300 bg-white text-slate-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                                    : "border-slate-200 bg-slate-100 text-slate-700"
                                    }`}
                            />
                        </div>

                        <div className="relative">
                            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">
                                Admin Location Description
                            </label>
                            <input
                                value={form?.adminLocation}
                                readOnly={!editing}
                                onChange={(event) => handleAdminLocationChange(event.target.value)}
                                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${editing
                                    ? "border-slate-300 bg-white text-slate-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                                    : "border-slate-200 bg-slate-100 text-slate-700"
                                    }`}
                            />
                            <div className="absolute top-full left-0 right-0 z-10">
                                {adminSuggestions.length > 0 && (
                                    <div className="border border-emerald-500 rounded-lg mt-1 max-h-40 overflow-y-auto bg-white p-2">
                                        {adminSuggestions.map((suggestion) => (
                                            <div
                                                key={suggestion.id}
                                                className="px-4 py-2 hover:bg-emerald-500 hover:text-white cursor-pointer text-slate-700 rounded-lg"
                                                onClick={() => {
                                                    updateField("adminLocation", suggestion.name);
                                                    setAdminSuggestions([]);
                                                }}
                                            >
                                                {suggestion.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">
                                State
                            </label>
                            <select
                                id="state"
                                name="state"
                                value={form?.state}
                                disabled={!editing}
                                onChange={(event) => updateField("state", event.target.value)}
                                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${editing
                                    ? "border-slate-300 bg-white text-slate-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                                    : "border-slate-200 bg-slate-100 text-slate-700"
                                    }`}
                            >
                                <option value="">Select state</option>
                                {states.map((stateName) => (
                                    <option key={stateName} value={stateName}>
                                        {stateName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">
                                LGA
                            </label>
                            <select
                                id="lga"
                                name="lga"
                                value={form?.lga}
                                disabled={!editing}
                                onChange={(event) => updateField("lga", event.target.value)}
                                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${editing
                                    ? "border-slate-300 bg-white text-slate-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                                    : "border-slate-200 bg-slate-100 text-slate-700"
                                    }`}
                            >
                                <option value="">{form?.state ? "Select LGA" : "Select state first"}</option>
                                {lgas.map((lgaName) => (
                                    <option key={lgaName} value={lgaName}>
                                        {lgaName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">
                                Country
                            </label>
                            <input
                                value={form?.country}
                                readOnly={!editing}
                                onChange={(event) => updateField("country", event.target.value)}
                                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${editing
                                    ? "border-slate-300 bg-white text-slate-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                                    : "border-slate-200 bg-slate-100 text-slate-700"
                                    }`}
                            />
                        </div>

                        <div className="relative">
                            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">
                                Address
                            </label>
                            <input
                                value={form?.address}
                                readOnly={!editing}
                                onChange={(event) => handleLocationChange(event.target.value)}
                                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${editing
                                    ? "border-slate-300 bg-white text-slate-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                                    : "border-slate-200 bg-slate-100 text-slate-700"
                                    }`}
                            />
                            <div className="absolute top-full left-0 right-0 z-10">
                                {suggestions.length > 0 && (
                                    <div className="border border-emerald-500 rounded-lg mt-1 max-h-40 overflow-y-auto bg-white p-2">
                                        {suggestions.map((suggestion) => (
                                            <div
                                                key={suggestion.id}
                                                className="px-4 py-2 hover:bg-emerald-500 hover:text-white cursor-pointer text-slate-700 rounded-lg"
                                                onClick={() => {
                                                    updateField("address", suggestion.name);
                                                    setSuggestions([]);
                                                }}
                                            >
                                                {suggestion.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">
                                Latitude
                            </label>
                            <input
                                value={form?.location?.latitude}
                                readOnly
                                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${editing
                                    ? "border-slate-300 bg-white text-slate-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                                    : "border-slate-200 bg-slate-100 text-slate-700"
                                    }`}
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">
                                Longitude
                            </label>
                            <input
                                value={form?.location?.longitude}
                                readOnly
                                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${editing
                                    ? "border-slate-300 bg-white text-slate-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                                    : "border-slate-200 bg-slate-100 text-slate-700"
                                    }`}
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <button
                                type="button"
                                onClick={handleUseCurrentLocation}
                                disabled={!editing || locating}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-100 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-200 transition-colors disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed"
                            >
                                {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed size={16} />}
                                {locating ? "Getting current location..." : "Update from Current Location"}
                            </button>
                            {!editing && (
                                <p className="mt-2 text-xs text-slate-500">
                                    Enable edit mode to update and save your current location.
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
                <div className={`grid grid-cols-1 gap-3 ${editing ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                    <button
                        type="button"
                        onClick={handleEditOrUpdate}
                        disabled={saving}
                        className={`inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:bg-emerald-300 disabled:cursor-not-allowed ${editing ? "bg-amber-500 hover:bg-amber-600 text-neutral-950" : ""}`}
                    >
                        {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : editing ? (
                            <Save size={16} />
                        ) : (
                            <Pencil size={16} />
                        )}
                        {editing ? "Update" : "Edit"}
                    </button>

                    {editing && (
                        <button
                            type="button"
                            onClick={() => setEditing(false)}
                            disabled={saving}
                            className={`inline-flex items-center justify-center gap-2 rounded-lg bg-gray-200 px-4 py-2.5 text-sm font-semibold hover:bg-gray-300 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-neutral-950`}
                        >
                            {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <X size={16} />
                            )}
                            Cancel
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={logout}
                        disabled={saving}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
}
