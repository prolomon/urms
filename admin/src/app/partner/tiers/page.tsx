"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Check, Edit2, AlertCircle, RefreshCcw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getPricingByCenter, Pricing as PricingType, togglePricing } from "@/lib/services/pricing";
import { getMembersByPricingId } from "@/lib/services/member";
import { useRouter } from "next/navigation";

export default function Pricing() {
  const router = useRouter();
  const { uid, user } = useAuth();
  const [pricing, setPricing] = useState<PricingType[] | null>(null);
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
              onClick={() => router.push("/admin/tiers/add")}
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
                          0%
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
                        onClick={() => router.push(`/admin/tiers/${tier.id}`)}
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
                  onClick={() => router.push("/admin/tiers/add")}
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
    </div>
  );
}
