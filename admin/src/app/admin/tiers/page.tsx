"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Check, Edit2, X, AlertCircle, RefreshCcw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getPricingByCenter, Pricing as PricingType, createPricing, updatePricing, togglePricing } from "@/lib/services/pricing";
import { getMembersByPricingId } from "@/lib/services/member";

export default function Pricing() {

  const { uid, user } = useAuth();
  const [pricing, setPricing] = useState<PricingType[] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successToast, setSuccessToast] = useState("");
  const [entityCounts, setEntityCounts] = useState<Record<string, number>>({});

  const [formData, setFormData] = useState<PricingType>({
    title: "",
    price: "",
    type: "BUSINESS",
    benefit: "",
    category: "SMALL",
  });

  const fetchPricingEntity = useCallback(async (pricingId: string) => {
    try {
      const data = await getMembersByPricingId(1, 1000, pricingId);
      return Array.isArray(data?.data) ? data.data : [];
    }
    catch (err) {
      console.error("Failed to fetch entities for pricing ID:", pricingId, err);
      return [];
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const loadEntityCounts = async () => {
      const list = pricing ?? [];

      if (!list.length) {
        if (!isCancelled) {
          setEntityCounts({});
        }
        return;
      }

      const pairs = await Promise.all(
        list.map(async (tier) => {
          const entities = tier.id ? await fetchPricingEntity(tier.id) : [];
          return [tier.id || "", entities.length] as const;
        }),
      );

      if (!isCancelled) {
        setEntityCounts(Object.fromEntries(pairs));
      }
    };

    loadEntityCounts();

    return () => {
      isCancelled = true;
    };
  }, [fetchPricingEntity, pricing]);

  const pricingStats = useMemo(() => {
    const list = pricing ?? [];
    const activeTiers = list.filter((tier) => tier.status).length;
    const averagePrice = list.length
      ? Math.round(list.reduce((sum, tier) => sum + Number(tier.price || 0), 0) / list.length)
      : 0;
    const highestPrice = list.length
      ? Math.max(...list.map((tier) => Number(tier.price || 0)))
      : 0;

    return {
      totalTiers: list.length,
      activeTiers,
      averagePrice,
      highestPrice,
    };
  }, [pricing]);

  const loadPricing = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPricingByCenter(user?.uid || uid);
      const pricingData = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      setPricing(pricingData);
      setError("");
    } catch (err) {
      setError("Failed to load pricing tiers");
      setPricing([]);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, uid]);

  useEffect(() => {
    loadPricing();
  }, [loadPricing]);

  const handleOpenModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      title: "",
      price: "",
      type: "BUSINESS",
      benefit: "",
      category: "SMALL",
    });
    setError("");
    setIsModalOpen(true);
  };

  const handleEditTier = (tier: PricingType) => {
    setIsEditMode(true);
    setEditingId(tier.id);
    setFormData({
      title: tier.title || "",
      price: tier.price || "",
      type: tier.type || "BUSINESS",
      benefit: tier.benefit || "",
      category: tier.category || "SMALL",
    });
    setError("");
    setIsModalOpen(true);
  };

  const handleViewTierEntities = async (tier: PricingType) => {
    if (!tier.id) return;
    await fetchPricingEntity(tier.id);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      title: "",
      price: "",
      type: "BUSINESS",
      benefit: "",
      category: "SMALL",
    });
    setError("");
  };

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

    try {
      if (isEditMode) {
        await updatePricing(formData, editingId);
      } else {
        await createPricing(formData, uid ?? "");
      }

      await loadPricing();
      handleCloseModal();
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    if (!id) return;
    setLoading(true);
    try {
      await togglePricing(id);
      await loadPricing();
      setSuccessToast("Tier status updated successfully");
      setTimeout(() => setSuccessToast(""), 2500);
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 md:space-y-5 md:p-6">
      <div className="rounded-2xl bg-linear-to-r from-emerald-50 via-white to-cyan-50 p-5 md:p-6 ring-1 ring-emerald-100">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
              Pricing Tiers & Rate Management
            </h1>
            <p className="mt-1 text-sm text-slate-600 md:text-base">
              Manage revenue collection brackets and entity pricing categories.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={loadPricing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <RefreshCcw size={18} />
              Refresh Tiers
            </button>
            <button
              onClick={handleOpenModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              <Plus size={18} />
              Add New Tier
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Tiers</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{pricingStats.totalTiers}</p>
          <p className="mt-1 text-xs text-slate-500">Pricing packages available</p>
        </div>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Active Tiers</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">{pricingStats.activeTiers}</p>
          <p className="mt-1 text-xs text-slate-500">Currently promoted tiers</p>
        </div>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Average Price</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">₦{pricingStats.averagePrice.toLocaleString()}</p>
          <p className="mt-1 text-xs text-slate-500">Across all pricing tiers</p>
        </div>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Highest Tier</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">₦{pricingStats.highestPrice.toLocaleString()}</p>
          <p className="mt-1 text-xs text-slate-500">Top monthly package</p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      {successToast && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
          {successToast}
        </div>
      )}

      <div className="rounded-2xl bg-white p-5 md:p-6 ring-1 ring-slate-100 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Tier Catalog</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">All pricing plans</h2>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <Check className="h-3.5 w-3.5" />
            Collections ready
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="col-span-full py-16 text-center">
              <div className="flex flex-col items-center justify-center">
                <div className="mb-4 animate-spin">
                  <div className="h-8 w-8 rounded-full border-4 border-slate-200 border-t-emerald-600" />
                </div>
                <p className="font-medium text-slate-600">Loading pricing tiers...</p>
              </div>
            </div>
          ) : pricing?.length > 0 ? (
            pricing.map((tier, index) => (
              <div
                key={index}
                className={`relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white transition-all duration-300 ${tier.status
                  ? "border-emerald-200 shadow-xl ring-1 ring-emerald-500/20"
                  : "border-slate-100 shadow-sm hover:border-emerald-200 hover:shadow-lg"
                  }`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        {tier.type}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold capitalize text-slate-900">
                        {tier.title}
                      </h3>
                      <p className="mt-2 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                        {tier.category || "SMALL"}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${tier.status
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border border-slate-200 bg-slate-50 text-slate-600"
                        }`}
                    >
                      {tier.status ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="mt-5 border-b border-slate-200 pb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-emerald-600">
                        ₦{Number(tier.price || 0).toLocaleString()}
                      </span>
                      <span className="font-medium text-slate-500">/month</span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Includes
                    </p>
                    <div className="space-y-2">
                      {tier.benefit &&
                        tier.benefit.split(",").map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                            <span className="text-sm font-medium text-slate-700">
                              {feature.trim()}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Active Entities
                        </p>
                        <p className="mt-1 text-2xl font-bold text-slate-900">
                          {entityCounts[tier.id || ""] ?? 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Collection Rate
                        </p>
                        <p className="mt-1 text-2xl font-bold text-emerald-600">
                          87%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleToggleStatus(tier.id || "")}
                        disabled={loading || !tier.id}
                        className={`inline-flex items-center justify-center rounded-xl px-3 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${tier.status
                          ? "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                          : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          }`}
                      >
                        {tier.status ? "Set Inactive" : "Set Active"}
                      </button>
                      <button
                        onClick={() => {
                          handleViewTierEntities(tier);
                          handleEditTier(tier);
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-emerald-600"
                      >
                        <Edit2 size={16} />
                        Edit Tier
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center">
              <div className="flex flex-col items-center justify-center">
                <AlertCircle className="mb-4 h-12 w-12 text-slate-300" />
                <h3 className="mb-2 text-lg font-semibold text-slate-700">No Pricing Tiers Found</h3>
                <p className="mb-6 text-slate-600">Create your first pricing tier to get started</p>
                <button
                  onClick={handleOpenModal}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                >
                  <Plus size={20} />
                  Add First Tier
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="max-h-screen w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100">
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
              <h2 className="text-xl font-bold text-slate-900">
                {isEditMode ? "Edit Pricing Tier" : "Create New Pricing Tier"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="rounded-lg p-1 transition-colors hover:bg-slate-100"
              >
                <X size={22} className="text-slate-500" />
              </button>
            </div>

            {/* Modal Content */}
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
                  onChange={handleInputChange}
                  required
                  className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="SMALL">Small</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LARGE">Large</option>
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
                  onClick={handleCloseModal}
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:bg-emerald-400"
                >
                  {loading ? "Saving..." : isEditMode ? "Update Tier" : "Create Tier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
