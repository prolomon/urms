"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
    ArrowLeft,
    Building2,
    Mail,
    Phone,
    MapPin,
    User,
    Zap,
    Save,
    RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePartner } from "@/context/PartnerContext";
import { Member, createMember } from "@/lib/services/member";
import { getCompanies, Company } from "@/lib/services/company";
import { getPricingByCenter, Pricing } from "@/lib/services/pricing";
import { getLocation } from "@/lib/services/location";
import statesData from "@/lib/jsons/state_and_lgas.json";

export default function AddEntityPage() {
    const router = useRouter();
    const { uid, user } = usePartner();
    const centerId = user?.center || uid || "";
    const adminState = user?.state || "";
    const adminLga = user?.lga || "";

    const [formData, setFormData] = useState({
        fullname: "",
        email: "",
        pricing: [],
        businessName: "",
        location: null as any,
        phone: "",
        center: "",
        type: "INDIVIDUAL" as "BUSINESS" | "INDIVIDUAL",
        category: "",
    });

    const [pricingOptions, setPricingOptions] = useState<Pricing[]>([]);
    const [locationSuggestions, setLocationSuggestions] = useState<
        Array<{ id: string | number; name: string; display_name?: string }>
    >([]);

    const [selectedLocation, setSelectedLocation] = useState<{
        state: string;
        city: string;
        address: string;
        zipcode: string;
        nearestBusStop: string;
    } | null>(null);
    const [locationInput, setLocationInput] = useState("");
    const [locationStateValue, setLocationStateValue] = useState(adminState || "");
    const [locationLgaValue, setLocationLgaValue] = useState(adminLga || "");
    const [availableLgas, setAvailableLgas] = useState<string[]>([]);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [toasts, setToasts] = useState<
        { id: number; type: string; message: string }[]
    >([]);

    const addToast = (type: "success" | "error", message: string, ttl = 4000) => {
        const id = Date.now() + Math.random();
        setToasts((s) => [...s, { id, type, message }]);
        setTimeout(() => setToasts((s) => s.filter((t) => t.id !== id)), ttl);
    };

    // Load companies and pricing options
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [ pricingRes] = await Promise.all([
                    getPricingByCenter(centerId),
                ]);

                setPricingOptions(
                    Array.isArray(pricingRes?.data) ? pricingRes.data : []
                );
            } catch (e) {
                console.error("Failed to load data:", e);
                addToast("error", e.message || e.error || "Failed to load companies or pricing options");
            } finally {
                setLoading(false);
            }
        };

        if (centerId) {
            loadData();
        }
    }, [centerId]);

    const handleInputChange = (
        field: keyof Omit<Member, "location">,
        value: string
    ) => {
        setFormData((prev) => {
            const updated = {
                ...prev,
                [field]: value,
            };
            // If type is changed to INDIVIDUAL, set businessName to fullname
            if (field === "type" && value === "INDIVIDUAL") {
                updated.businessName = prev.fullname || "";
            }
            // If type is changed to BUSINESS, clear businessName
            if (field === "type" && value === "BUSINESS") {
                updated.businessName = "";
            }
            // If fullname changes and type is INDIVIDUAL, update businessName too
            if (field === "fullname" && prev.type === "INDIVIDUAL") {
                updated.businessName = value;
            }
            return updated;
        });
        setError("");
    };

    const handleLocationSearch = async (query: string) => {
        setLocationInput(query);
        if (!query?.trim()) {
            setLocationSuggestions([]);
            setSelectedLocation(null);
            return;
        }

        try {
            const res = await getLocation({ query, limit: 30 });
            setLocationSuggestions(Array.isArray(res) ? res : []);
        } catch (e) {
            console.error("Failed to fetch locations:", e);
            addToast("error", e.message || "Failed to fetch location suggestions");
            setLocationSuggestions([]);
        }
    };

    const handleLocationSelect = (location: any) => {
        const address = location?.display_name || location?.name || "";
        setLocationInput(address);
        const nextLocation = {
            state: locationStateValue || adminState,
            city: locationLgaValue || adminLga,
            address,
            zipcode: location?.postcode || "0",
            nearestBusStop: location?.name || "",
        };

        setSelectedLocation(nextLocation);
        setFormData((prev) => ({
            ...prev,
            location: nextLocation,
        }));
        setLocationSuggestions([]);
    };

    const handleLocationFieldChange = (key: "state" | "lga" | "address", value: string) => {
        if (key === "state") setLocationStateValue(value);
        if (key === "lga") setLocationLgaValue(value);
        if (key === "address") setLocationInput(value);
        setSelectedLocation(null);
    };

    // When state changes, update available LGAs
    useEffect(() => {
        if (locationStateValue) {
            const lgas = (statesData as Record<string, string[]>)[locationStateValue] || [];
            setAvailableLgas(lgas);
            // If current LGA is not in the list, pick the first one or clear
            if (!lgas.includes(locationLgaValue)) {
                setLocationLgaValue(lgas[0] || "");
            }
        } else {
            setAvailableLgas([]);
            setLocationLgaValue("");
        }
    }, [locationStateValue, locationLgaValue]);

    const handlePricingToggle = (pricingId: string) => {
        setFormData((prev) => {
            const currentPricing = prev.pricing || [];
            const isSelected = currentPricing.includes(pricingId);
            return {
                ...prev,
                pricing: isSelected
                    ? currentPricing.filter((id) => id !== pricingId)
                    : [...currentPricing, pricingId],
            };
        });
    };

    const validateForm = (): boolean => {
        if (!formData.fullname?.trim()) {
            addToast("error", "Full name is required");
            return false;
        }
        if (!formData.email?.trim()) {
            addToast("error", "Email is required");
            return false;
        }
        if (!formData.phone?.trim()) {
            addToast("error", "Phone is required");
            return false;
        }
        if (!formData.businessName?.trim()) {
            addToast("error", "Business name is required");
            return false;
        }
        if (!formData.type) {
            addToast("error", "Entity type is required");
            return false;
        }
        if (!formData.category) {
            addToast("error", "Category is required");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!validateForm()) {
            return;
        }

        setSaving(true);
        try {
            const finalLocation = selectedLocation || {
                state: locationStateValue || adminState,
                city: locationLgaValue || adminLga,
                address: locationInput || "",
                zipcode: "0",
                nearestBusStop: "",
            };

            const payload = {
                ...formData,
                center: user.center,
                location: finalLocation,
                company: user?.uid || "",
            };

            const res = await createMember(payload as Member);

            if (!res?.ok) {
                throw new Error(res?.message || "Failed to create entity");
            }

            addToast("success", "Entity created successfully");
            setTimeout(() => {
                router.push("/partner/entities");
            }, 1500);
        } catch (e) {
            console.error("Error creating entity:", e);
            addToast("error", e.message || "Failed to create entity. Please try again.");
        } finally {
            setSaving(false);
            setLoading(false);
        }
    };

    const getFilteredPricing = () => {
        return pricingOptions.filter((p) => p.category === formData.category);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-slate-600">
                    <RotateCcw color="currentColor" size={20} className="animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 md:p-6 relative">

            {/* Toast Notifications */}
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
            <div className="rounded-2xl bg-linear-to-r from-emerald-50 via-white to-cyan-50 p-5 md:p-6 ring-1 ring-emerald-100">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-700"
                    >
                        <ArrowLeft size={16} />
                        Back to Entities
                    </button>
                </div>
                <h1 className="mt-3 text-2xl md:text-3xl font-bold text-slate-900">
                    Add New Entity
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                    Create and register a new member entity in the system
                </p>
            </div>

            {/* Form Card */}
            <div className="rounded-2xl bg-white p-6 md:p-8 ring-1 ring-slate-100 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Status Messages */}
                    {error && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
                            {success}
                        </div>
                    )}

                    {/* Section 1: Entity Classification */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Entity Classification
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Entity Type */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Entity Type *
                                </label>
                                <select
                                    value={formData.type || ""}
                                    onChange={(e) =>
                                        handleInputChange("type", e.target.value)
                                    }
                                    className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                                >
                                    <option hidden>Select entity type</option>
                                    <option value="INDIVIDUAL">Individual</option>
                                    <option value="BUSINESS">Business</option>
                                </select>
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Category *
                                </label>
                                <select
                                    value={formData.category || ""}
                                    onChange={(e) =>
                                        handleInputChange("category", e.target.value)
                                    }
                                    className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                                >
                                    <option hidden>Select category</option>
                                    <option value="HOSPITALITY & ACCOMMODATION">Hospitality & Accommodation</option>
                                    <option value="FOOD & BEVERAGE">Food & Beverage</option>
                                    <option value="CORPORATE & OFFICE PREMISES">Corporate & Office Premises</option>
                                    <option value="RETAIL & TRADE">Retail & Trade</option>
                                    <option value="SERVICES & ARTISANS">Services & Artisans</option>
                                    <option value="MEDIA & TELECOMMUNICATIONS">Media & Telecommunications</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <hr className="border-b border-slate-200" />

                    {/* Section 2: Basic Information */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Basic Information
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Full Name *
                                </label>
                                <div className="relative">
                                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        placeholder="e.g., John Doe"
                                        value={formData.fullname || ""}
                                        onChange={(e) =>
                                            handleInputChange("fullname", e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Email *
                                </label>
                                <div className="relative">
                                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="email"
                                        placeholder="e.g., john@example.com"
                                        value={formData.email || ""}
                                        onChange={(e) => handleInputChange("email", e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                                    />
                                </div>
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Phone *
                                </label>
                                <div className="relative">
                                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="tel"
                                        placeholder="e.g., 08012345678"
                                        value={formData.phone || ""}
                                        onChange={(e) => handleInputChange("phone", e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                                    />
                                </div>
                            </div>

                            {/* Business Name - Only show for BUSINESS type */}
                            {formData.type === "BUSINESS" && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Business Name *
                                    </label>
                                    <div className="relative">
                                        <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            placeholder="e.g., Acme Corp"
                                            value={formData.businessName || ""}
                                            onChange={(e) =>
                                                handleInputChange("businessName", e.target.value)
                                            }
                                            className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <hr className="border-b border-slate-200" />

                    {/* Section 4: Location */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-slate-900">Location</h2>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Search Location
                            </label>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">State</label>
                                    <select
                                        value={locationStateValue}
                                        onChange={(e) => handleLocationFieldChange("state", e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 appearance-none"
                                    >
                                        <option value="" hidden>Select state</option>
                                        {Object.keys(statesData).map((st) => (
                                            <option key={st} value={st}>{st}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">LGA</label>
                                    <select
                                        value={locationLgaValue}
                                        onChange={(e) => handleLocationFieldChange("lga", e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 appearance-none"
                                    >
                                        <option value="" hidden>Select LGA</option>
                                        {availableLgas.map((lga) => (
                                            <option key={lga} value={lga}>{lga}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Address</label>
                                    <div className="relative">
                                        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="e.g., Wuse, Lagos, Abuja"
                                            value={locationInput}
                                            onChange={(e) => handleLocationSearch(e.target.value)}
                                            className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Location Suggestions */}
                            {locationSuggestions.length > 0 && (
                                <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-emerald-300 bg-white p-2">
                                    {locationSuggestions.map((suggestion) => (
                                        <button
                                            key={suggestion.id}
                                            type="button"
                                            onClick={() => handleLocationSelect(suggestion)}
                                            className="w-full text-left cursor-pointer rounded-lg px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-emerald-500 hover:text-white"
                                        >
                                            {suggestion.display_name || suggestion.name}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Selected Location */}
                            {selectedLocation && (
                                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="font-semibold text-slate-700">State</p>
                                            <p className="text-emerald-700">{selectedLocation.state}</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-700">LGA</p>
                                            <p className="text-emerald-700">{selectedLocation.city}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="font-semibold text-slate-700">Address</p>
                                            <p className="text-emerald-700">{selectedLocation.address}</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-700">Zip Code</p>
                                            <p className="text-emerald-700">{selectedLocation.zipcode}</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-700">Nearest Bus Stop</p>
                                            <p className="text-emerald-700">{selectedLocation.nearestBusStop}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section 5: Pricing Plans */}
                    {getFilteredPricing().length > 0 && (
                        <div className="space-y-4 pb-6">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Pricing Plans
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {getFilteredPricing().map((pricing) => {
                                    const isSelected = (formData.pricing || []).includes(pricing.id as string);
                                    return (
                                        <label
                                            key={pricing.id}
                                            className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${isSelected
                                                ? "border-emerald-400 bg-emerald-50"
                                                : "border-slate-300 hover:border-emerald-400 hover:bg-emerald-50"
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() =>
                                                    handlePricingToggle(pricing.id as string)
                                                }
                                                className="hidden"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <Zap size={16} className={isSelected ? "text-emerald-700" : "text-amber-500"} />
                                                    <p className={`font-semibold ${isSelected ? "text-emerald-700" : "text-slate-900"}`}>
                                                        {pricing.title}
                                                    </p>
                                                </div>
                                                <p className={`mt-1 text-xs ${isSelected ? "text-emerald-700" : "text-slate-600"}`}>
                                                    ₦{Number(pricing.price)?.toLocaleString()}
                                                </p>
                                                {pricing.benefit && (
                                                    <p className={`mt-1 text-xs ${isSelected ? "text-emerald-700" : "text-slate-600"}`}>
                                                        {pricing.benefit}
                                                    </p>
                                                )}
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-6">
                        <Link
                            href="/admin/entities"
                            className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:bg-emerald-400"
                        >
                            <Save size={18} />
                            {saving ? "Creating..." : "Create Entity"}
                        </button>
                    </div>
                </form>
            </div>

        </div>
    );
}
