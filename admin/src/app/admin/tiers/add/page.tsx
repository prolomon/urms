"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Pricing as PricingType, createPricing } from "@/lib/services/pricing";
import { useRouter } from "next/navigation";

export default function Pricing() {
  const router = useRouter();
  const { uid } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<PricingType>({
    title: "",
    price: "",
    type: "BUSINESS",
    benefit: "",
    category: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  console.log(formData);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (
      !formData.title ||
      !formData.benefit ||
      !formData.category ||
      !formData.price ||
      !formData.type
    ) {
      setError("All fields required");
    }
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await createPricing(formData, uid ?? "");

      setFormData({
        title: "",
        price: "",
        type: "BUSINESS",
        benefit: "",
        category: "",
      });

      router.push("/admin/tiers");
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 md:space-y-5 md:p-6">
      <div className="w-full overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100">
        {/* pricing Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
          <h2 className="text-xl font-bold text-slate-900">
            Create New Pricing Tier
          </h2>
        </div>

        {/* pricing Content */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
              <p className="text-sm text-red-700">{error}</p>
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
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  category: e.target.value,
                }))
              }
              required
              className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="HOSPITALITY & ACCOMMODATION">
                Hospitality & Accommodation
              </option>
              <option value="FOOD & BEVERAGE">Food & Beverage</option>
              <option value="CORPORATE & OFFICE PREMISES">
                Corporate & Office Premises
              </option>
              <option value="RETAIL & TRADE">Retail & Trade</option>
              <option value="SERVICES & ARTISANS">Services & Artisans</option>
              <option value="MEDIA & TELECOMMUNICATIONS">
                Media & Telecommunications
              </option>
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
              {loading ? "Saving..." : "Create Tier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
