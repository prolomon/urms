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
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Member, createMember } from "@/lib/services/member";
import { getAgents, Agent } from "@/lib/services/agent";
import { getPricingByCenter, Pricing } from "@/lib/services/pricing";
import { getLocation } from "@/lib/services/location";

export default function AddEntityPage() {
    const router = useRouter();
    const { uid, user } = useAuth();
    const centerId = user?.uid || uid || "";
    const adminState = user?.state || "";
    const adminLga = user?.lga || "";

    const [formData, setFormData] = useState<Partial<Member>>({
        fullname: "",
        email: "",
        pricing: [],
        businessName: "",
        location: null,
        phone: "",
        center: "",
        agent: "",
        type: "INDIVIDUAL" as "BUSINESS" | "INDIVIDUAL",
        category: "SMALL" as "SMALL" | "MEDIUM" | "LARGE",
    });

    const [agents, setAgents] = useState<Agent[]>([]);
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

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Load agents and pricing options
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [agentsRes, pricingRes] = await Promise.all([
                    getAgents(centerId),
                    getPricingByCenter(centerId),
                ]);

                setAgents(Array.isArray(agentsRes?.data) ? agentsRes.data : []);
                setPricingOptions(
                    Array.isArray(pricingRes?.data) ? pricingRes.data : []
                );
            } catch (e) {
                console.error("Failed to load data:", e);
                setError("Failed to load agents and pricing options");
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
        if (!query?.trim()) {
            setLocationSuggestions([]);
            return;
        }

        try {
            const res = await getLocation({ query, limit: 30 });
            setLocationSuggestions(Array.isArray(res) ? res : []);
        } catch (e) {
            console.error("Failed to fetch locations:", e);
            setLocationSuggestions([]);
        }
    };

    const handleLocationSelect = (location: any) => {
        const nextLocation = {
            state: adminState,
            city: adminLga,
            address: location?.display_name || location?.name || "",
            zipcode: "0",
            nearestBusStop: location?.name || "",
        };

        setSelectedLocation(nextLocation);
        setFormData((prev) => ({
            ...prev,
            location: nextLocation,
        }));
        setLocationSuggestions([]);
    };

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
            setError("Full name is required");
            return false;
        }
        if (!formData.email?.trim()) {
            setError("Email is required");
            return false;
        }
        if (!formData.phone?.trim()) {
            setError("Phone is required");
            return false;
        }
        if (!formData.businessName?.trim()) {
            setError("Business name is required");
            return false;
        }
        if (!formData.type) {
            setError("Entity type is required");
            return false;
        }
        if (!formData.category) {
            setError("Category is required");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setSaving(true);
        try {
            const payload = {
                ...formData,
                center: centerId,
                location: selectedLocation,
            };

            const res = await createMember(payload as Member);

            if (!res?.ok) {
                throw new Error(res?.message || "Failed to create entity");
            }

            setSuccess("Entity created successfully!");
            setTimeout(() => {
                router.push("/admin/entities");
            }, 1500);
        } catch (e) {
            console.error("Error creating entity:", e);
            setError(
                e instanceof Error ? e.message : "Failed to create entity. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    const getFilteredPricing = () => {
        return pricingOptions.filter((p) => p.category === formData.category);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-slate-600">Loading...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 md:p-6">

            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/entities"
                    className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                        Add New Entity
                    </h1>
                    <p className="mt-1 text-sm text-slate-600">
                        Create and register a new member entity in the system
                    </p>
                </div>
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
                                    <option value="SMALL">Small</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="LARGE">Large</option>
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

                    {/* Section 3: Agent Assignment */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Agent Assignment
                        </h2>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Assign Agent
                            </label>
                            <select
                                value={formData.agent || ""}
                                onChange={(e) => handleInputChange("agent", e.target.value)}
                                className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                            >
                                <option value="">No agent assigned</option>
                                {agents.map((agent) => (
                                    <option key={agent.uid || agent.id} value={agent.uid || agent.id}>
                                        {agent.fullname || agent.name}
                                    </option>
                                ))}
                            </select>
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
                            <div className="relative">
                                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="e.g., Wuse, Lagos, Abuja"
                                    onChange={(e) => handleLocationSearch(e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                                />
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
                                {getFilteredPricing().map((pricing) => (
                                    <label
                                        key={pricing.id}
                                        className="flex items-start gap-3 rounded-xl border border-slate-300 p-4 cursor-pointer transition-colors hover:border-emerald-400 hover:bg-emerald-50"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={(formData.pricing || []).includes(
                                                pricing.id as string
                                            )}
                                            onChange={() =>
                                                handlePricingToggle(pricing.id as string)
                                            }
                                            className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <Zap size={16} className="text-amber-500" />
                                                <p className="font-semibold text-slate-900">
                                                    {pricing.title}
                                                </p>
                                            </div>
                                            <p className="mt-1 text-xs text-slate-600">
                                                ₦{Number(pricing.price)?.toLocaleString()}
                                            </p>
                                            {pricing.benefit && (
                                                <p className="mt-1 text-xs text-slate-600">
                                                    {pricing.benefit}
                                                </p>
                                            )}
                                        </div>
                                    </label>
                                ))}
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
