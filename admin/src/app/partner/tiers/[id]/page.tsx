"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getPricingById, Pricing as PricingType, updatePricing, togglePricing } from "@/lib/services/pricing";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";

export default function Pricing() {
    const router = useRouter();
    const { id } = useParams();
    const { uid, user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [formData, setFormData] = useState<PricingType>({
        title: "",
        price: "",
        type: "BUSINESS",
        benefit: "",
        category: "SMALL",
    });

    const loadPrice = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getPricingById(id as string);
            setFormData(data.pricing);

            setSuccess("Fetched pricing tier successfully");
            setError("");
        } catch (err) {
            setError("Failed to load pricing tier");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadPrice();
    }, [loadPrice]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            await updatePricing({ title: formData.title, price: formData.price, type: formData.type, benefit: formData.benefit, category: formData.category }, id as string);
            setSuccess("Pricing tier updated successfully");
        } catch (err) {
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    //   const handleToggleStatus = async (id: string) => {
    //     if (!id) return;
    //     setLoading(true);
    //     try {a
    //       await togglePricing(id);
    //       await loadPrice();
    //       setSuccessToast("Tier status updated successfully");
    //       setTimeout(() => setSuccessToast(""), 2500);
    //     } catch (err) {
    //       setError(err.message || "An error occurred");
    //     } finally {
    //       setLoading(false);
    //     }
    //   };

    setTimeout(() => {
        setError("");
        setSuccess("");
    }, 3000);

    return (
        <div className="mx-auto max-w-7xl space-y-4 p-4 md:space-y-5 md:p-6">
            <div className="w-full rounded-2xl overflow-hidden bg-white shadow-2xl ring-1 ring-slate-100">
                {/* pricing Header */}
                <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
                    <h2 className="text-xl font-bold text-slate-900">
                        Edit Pricing Tier
                    </h2>
                </div>

                {/* pricing Content */}
                <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
                    {error && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}
                    {success && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                            <p className="text-sm text-emerald-700">{success}</p>
                        </div>
                    )}

                    {/* Tier Title */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Tier Title *
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder="e.g., Small Business"
                            required
                            className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                        />
                    </div>

                    {/* Price */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Monthly Price (₦) *
                        </label>
                        <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleInputChange}
                            placeholder="e.g., 8000"
                            required
                            className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                        />
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Type *
                        </label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleInputChange}
                            required
                            className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                        >
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
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            required
                            className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                        >
                            <option value="HOSPITALITY & ACCOMMODATION">Hospitality & Accommodation</option>
                            <option value="FOOD & BEVERAGE">Food & Beverage</option>
                            <option value="CORPORATE & OFFICE PREMISES">Corporate & Office Premises</option>
                            <option value="RETAIL & TRADE">Retail & Trade</option>
                            <option value="SERVICES & ARTISANS">Services & Artisans</option>
                            <option value="MEDIA & TELECOMMUNICATIONS">Media & Telecommunications</option>
                        </select>
                    </div>

                    {/* Benefits */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Benefits
                        </label>
                        <textarea
                            name="benefit"
                            value={formData.benefit}
                            onChange={handleInputChange}
                            placeholder="e.g., Basic support, Monthly billing, Digital receipts"
                            rows={3}
                            className="w-full resize-none appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                        />
                    </div>

                    {/* Modal Actions */}
                    <div className="flex gap-3 border-t border-slate-200 pt-6">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:bg-emerald-400"
                        >
                            {loading ? "Saving..." : "Update Tier"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
