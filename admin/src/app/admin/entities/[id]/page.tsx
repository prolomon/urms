"use client";
import React, { useEffect, useState, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Edit2,
  Trash2,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Download,
  CheckCircle2,
  ShieldCheck,
  Wallet,
  UserRound,
  Building2,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import {
  getMember,
  deleteMember,
  updateMember,
  Member,
  paymentAction,
  changeAgent,
  changeCompany,
} from "@/lib/services/member";
import { getPayments } from "@/lib/api";
import { getPricing, Pricing } from "@/lib/services/pricing";
import { useAuth } from "@/context/AuthContext";
import { getWallet, Wallet as WalletType } from "@/lib/services/wallet";
import { Agent, getAgents } from "@/lib/services/agent";
import { Company, getCompanies } from "@/lib/services/company";

import Link from "next/link";

export default function EntityDetailsPage({ params }) {
  const parameter: any = use(params);
  const id = parameter?.id;
  const { user } = useAuth();

  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [payments, setPayments] = useState([]);
  const [pricing, setPricing] = useState<Pricing[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    fullname: "",
    businessName: "",
    type: "BUSINESS",
    category: "",
    email: "",
    phone: "",
    billingFrequency: "",
    location: {
      state: "",
      city: "",
      address: "",
      zipcode: "",
      nearestBusStop: "",
    },
  });
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [isExist, setIsExist] = useState<boolean>(false);
  const [selectedPricing, setSelectedPricing] = useState<Pricing | null>(null);
  const [memberPricing, setMemberPricing] = useState<Pricing[] | null>(null);
  const [memberPrices, setMemberPrices] = useState<string[]>([]);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [selectedPricingIds, setSelectedPricingIds] = useState<string[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [agentLoading, setAgentLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [companyLoading, setCompanyLoading] = useState(false);

  const memberType = (member?.type || form.type || "BUSINESS").toUpperCase();
  const memberCategory = (member?.category || form.category || "").toUpperCase();
  const isIndividual = memberType === "INDIVIDUAL";
  const pricingOptions = Array.isArray(pricing) ? Array.from(new Set(pricing.map((item) => item.category).filter(Boolean))) : [];
  const [availablePricing, setAvailablePricing] = useState<Pricing[] | null>(null);

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
        const [m, p, pr] = await Promise.all([
          getMember(id),
          getPayments(id),
          getPricing(user?.uid, 1, 100),
        ]);
        if (!mounted) return;

        const data = m.data;
        const paymentsData = p?.payments || [];
        const pricingData = pr?.data || [];
        setMember(data);
        setMemberPrices(Array.isArray(data?.pricing) ? data.pricing : []);

        setPayments(paymentsData);
        setPricing(pricingData);
        setForm({
          fullname: data?.fullname || "",
          businessName:
            data?.type === "INDIVIDUAL"
              ? data?.fullname || ""
              : data?.businessName || "",
          type: data?.type || "BUSINESS",
          category: data?.category || "",
          email: data?.email || "",
          phone: data?.phone || "",
          location: data?.location || null,
          billingFrequency: data?.billingFrequency || "",
        });

        addToast("success", "Member loaded");
      } catch (e) {
        console.error(e);
        addToast("error", "Failed to fetch member");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => (mounted = false);
  }, [id, user?.uid]);

  useEffect(() => {
    fetchData()
  }, [fetchData]);

  const customerCode = member?.uid || "";

  const fetchWalletData = useCallback(async () => {
    try {
      if (!customerCode) {
        setWallet(null);
        return;
      }
      const walletData = await getWallet(customerCode, "MEMBER");

      setIsExist(walletData?.isExist || false);
      if (walletData?.ok) {
        setWallet(walletData?.wallet);
      } else {
        setWallet(null)
      }
    } catch (error: any) {
      console.log(error)
      addToast("error", error?.message || error?.error || "Failed to fetch wallet data");
    }
  }, [customerCode])

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData])

  const fetchAgentData = useCallback(async () => {
    if (!user?.uid) {
      setAgents([]);
      setCurrentAgent(null);
      return;
    }

    try {
      setAgentLoading(true);
      const centerId = member?.company || user?.uid;
      const res = await getAgents(centerId);
      const allAgents = res?.data || [];
      setAgents(allAgents);

      if (member?.agent) {
        const assignedAgent = allAgents.find(
          (a) => a.uid === member.agent || a.id === member.agent,
        );
        setCurrentAgent(assignedAgent || null);
      } else {
        setCurrentAgent(null);
      }
    } catch (error) {
      console.error("Failed to fetch agents", error);
    } finally {
      setAgentLoading(false);
    }
  }, [member?.agent, member?.company, user?.uid]);

  const fetchCompanyData = useCallback(async () => {
    if (!user?.uid) {
      setCompanies([]);
      setCurrentCompany(null);
      return;
    }

    try {
      setCompanyLoading(true);
      const res = await getCompanies(user.uid);
      const allCompanies = res?.data || [];
      setCompanies(allCompanies);

      const assignedCompanyId = (member as any)?.company || (member as any)?.companyId || "";
      if (assignedCompanyId) {
        const assignedCompany = allCompanies.find(
          (company) => company.uid === assignedCompanyId || company.id === assignedCompanyId,
        );
        setCurrentCompany(assignedCompany || null);
      } else {
        setCurrentCompany(null);
      }
    } catch (error) {
      console.error("Failed to fetch companies", error);
    } finally {
      setCompanyLoading(false);
    }
  }, [member, user?.uid]);

  useEffect(() => {
    fetchAgentData();
  }, [fetchAgentData]);

  useEffect(() => {
    fetchCompanyData();
  }, [fetchCompanyData]);

  const handleChange = (k: string, v: string, p?: string) => {
    return setForm((s) => {
      if (p) {
        return { ...s, [k]: { ...s[k], [p]: v } };
      }
      return { ...s, [k]: v };
    });

  }

  const handleAgentChange = async (agentId: string) => {

    if (!agentId) {
      addToast("error", "Please select an agent");
      return;
    }

    try {
      const res = await changeAgent(id || customerCode, agentId);

      if (!res.ok) {
        addToast("error", res.message || "Failed to update agent");
        return;
      }
      addToast("success", "Agent updated");

      fetchData();
    } catch (error) {
      addToast("error", error?.message || "Failed to update agent");
    }

  };

  const handleCompanyChange = async (companyId: string) => {
    if (!companyId) {
      addToast("error", "Please select a company");
      return;
    }

    try {
      const res = await changeCompany(id || customerCode, companyId);

      if (!res.ok) {
        addToast("error", res.message || "Failed to update company");
        return;
      }

      addToast("success", "Company updated");
      fetchData();
    } catch (error: any) {
      addToast("error", error?.message || "Failed to update company");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // billingFrequency is rejected by the API validation schema
      // so omit it from the payload. Keep it in local form state.
      const payload = {
        fullname: form.fullname,
        businessName: isIndividual ? form.fullname : form.businessName,
        type: form.type,
        category: form.category,
        email: form.email,
        phone: form.phone,
        location: form.location,
      };
      const res = await updateMember(id, payload as Member);
      const updated = res?.member;
      setMember(updated);
      setForm({
        fullname: updated?.fullname || form.fullname || "",
        businessName:
          updated?.type === "INDIVIDUAL"
            ? updated?.fullname || form.fullname || ""
            : updated?.businessName || form.businessName || "",
        type: updated?.type || form.type || "BUSINESS",
        category: updated?.category || form.category || "",
        email: updated?.email || form.email || "",
        phone: updated?.phone || form.phone || "",
        // keep local billingFrequency since API doesn't accept it
        billingFrequency:
          form.billingFrequency || updated?.billingFrequency || "",
        location: updated?.location || null,
      });
      setEditing(false);
      addToast("success", "Member updated");
    } catch (e) {
      console.error(e);
      addToast("error", "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this entity? This action cannot be undone.")) return;
    try {
      await deleteMember(id);
      addToast("success", "Member deleted");
      router.push("/entities");
    } catch (e) {
      console.error(e);
      addToast("error", "Delete failed");
    }
  };

  const handleRetry = async () => {
    setLoading(true);
    try {
      const m = await getMember(id);
      const p = await getPayments(id);
      const data = m?.data;
      const paymentsData = p?.data || p?.payment || p || [];
      setMember(data);
      setPayments(paymentsData);
      setForm({
        fullname: data?.fullname || "",
        businessName:
          data?.type === "INDIVIDUAL"
            ? data?.fullname || ""
            : data?.businessName || "",
        type: data?.type || "BUSINESS",
        category: data?.category || "",
        email: data?.email || "",
        phone: data?.phone || "",
        billingFrequency: data?.billingFrequency,
        location: data?.location,
      });
      addToast("success", "Member loaded");
    } catch (e) {
      console.error(e);
      addToast("error", "Failed to fetch member");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => router.push("/entities");

  const handleCancel = () => {
    setForm({
      fullname: member?.fullname || "",
      businessName:
        member?.type === "INDIVIDUAL"
          ? member?.fullname || ""
          : member?.businessName || "",
      type: member?.type || "BUSINESS",
      category: member?.category || "",
      email: member?.email || "",
      phone: member?.phone || "",
      billingFrequency: member?.billingFrequency || "",
      location: member?.location || null,
    });
    setEditing(false);
  };

  const handlePricingSelect = (p: Pricing) => {
    setSelectedPricing(p);
    if (!p?.id) return;
    setSelectedPricingIds((current) => [...new Set([...current, p.id])]);
  };

  const togglePricingSelection = (pricingId: string) => {
    setSelectedPricingIds((current) =>
      current.includes(pricingId)
        ? current.filter((id) => id !== pricingId)
        : [...current, pricingId],
    );
  };

  const escapeCSV = (val: string | number | null | undefined) => {
    if (val === null || val === undefined) return "";
    const s = typeof val === "string" ? val : String(val);
    return `"${s.replace(/"/g, '""')}"`;
  };

  const downloadPaymentsCSV = () => {
    try {
      const headers = [
        "Reference",
        "Business Name",
        "Business Type",
        "Frequency",
        "Date",
        "Amount",
        "Payment Method",
        "Status",
      ];

      const lines = [headers.join(",")];

      payments.forEach((p) => {
        const line = [
          escapeCSV(p.reference || p.id),
          escapeCSV(p.businessName),
          escapeCSV(p.businessType),
          escapeCSV(p.frequency || p.billingFrequency),
          escapeCSV(
            p.date
              ? new Date(p.date).toLocaleDateString()
              : p.createdAt
                ? new Date(p.createdAt).toLocaleDateString()
                : "",
          ),
          escapeCSV(typeof p.amount === "number" ? p.amount : p.amount || ""),
          escapeCSV(p.payment || p.method),
          escapeCSV(p.status || ""),
        ].join(",");
        lines.push(line);
      });

      const csv = lines.join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const date = new Date().toISOString().slice(0, 10);
      const filename = `${member.businessName || member.fullname} - Payments ${date}.csv`;

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      addToast("success", "Payments downloaded");
    } catch (e) {
      console.error("Export failed", e);
      addToast("error", "Failed to download payments");
    }
  };

  const getExpectedPricing = useCallback(() => {
    if (memberPrices.length > 0 && pricing) {
      const matchedPricing = pricing.filter((p) => memberPrices.includes(p.id || ""));
      setMemberPricing(matchedPricing);
    }

    if (pricing) {
      const filteredPricing = pricing.filter((p) => p.category === memberCategory && p.type === memberType && !memberPrices.includes(p.id || ""));
      setAvailablePricing(filteredPricing);
    }

  }, [memberCategory, memberPrices, memberType, pricing])

  useEffect(() => {
    getExpectedPricing()
  }, [getExpectedPricing])

  const handlePricingSubmit = async (action: string) => {

    const res = await paymentAction(id, selectedPricingIds || [], action);

    if (!res.ok) {
      addToast("error", res.message || "Failed to complete action");
    }

    getExpectedPricing();
    fetchData();

    setSelectedPricingIds([]);
    setSelectedPricing(null);

    addToast("success", "Selected pricing ids logged to console");
    setIsPricingModalOpen(false);

  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 min-h-screen">
        <div className="w-full max-w-4xl space-y-6">
          {/* Header Skeleton */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-4 md:p-6">
            <div className="animate-pulse flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="h-6 bg-slate-200 rounded w-1/3" />
                <div className="h-4 bg-slate-200 rounded w-1/4" />
              </div>
            </div>
          </div>

          {/* Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-lg border border-slate-100 p-4 md:p-6"
              >
                <div className="h-5 bg-slate-200 rounded w-1/3 mb-4" />
                <div className="space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-1/4 mb-2" />
                  <div className="h-10 bg-slate-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg border border-slate-100 p-6 md:p-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="text-rose-600" size={48} />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">
            Entity not found
          </h2>
          <p className="text-sm md:text-base text-slate-600 mb-6">
            We couldn&apos;t find the requested entity. It may have been removed
            or the ID is incorrect.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleRetry}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              <RefreshCw size={18} />
              Retry
            </button>
            <button
              onClick={handleBack}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft size={18} />
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const parseAmount = (value: unknown) => {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const cleaned = value.replace(/[^0-9.-]/g, "");
      const parsed = Number(cleaned);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  };

  const paymentSummaryByCategory = payments.reduce((acc, payment) => {
    const category =
      payment?.frequency ||
      payment?.billingFrequency ||
      payment?.payment ||
      payment?.method ||
      "Other";

    if (!acc[category]) {
      acc[category] = {
        label: category,
        totalPaid: 0,
        pending: 0,
        owing: 0,
        total: 0,
      };
    }

    const amount = parseAmount(payment?.amount);
    const status = String(payment?.status || "").toUpperCase();
    acc[category].total += amount;

    if (status === "COMPLETED" || status === "SUCCESS") {
      acc[category].totalPaid += amount;
    } else if (status === "PENDING") {
      acc[category].pending += amount;
    } else {
      acc[category].owing += amount;
    }

    return acc;
  }, {} as Record<string, { label: string; totalPaid: number; pending: number; owing: number; total: number }>);

  const paymentSummaryCards = Object.values(paymentSummaryByCategory);

  return (
    <div className="mx-auto w-full space-y-4 p-4 md:p-6">
      {/* Toast Notifications */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`min-w-64 px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center justify-between ${t.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}`}
          >
            <div>{t.message}</div>
          </div>
        ))}
      </div>

      {/* Header Card */}
      <div className="rounded-2xl bg-linear-to-r from-emerald-50 via-white to-cyan-50 p-5 md:p-6 ring-1 ring-emerald-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-emerald-500 to-emerald-600 text-2xl font-bold text-white shadow-md">
              {(member.fullname || member.businessName || "")?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {member.businessName || member.fullname}
              </h1>
              <p className="mt-1 text-sm text-slate-600 md:text-base">
                {member.uid}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {member.role && (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {member.role}
                  </span>
                )}
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  {member.type || "BUSINESS"}
                </span>
                {member.type && (
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                    {member.category || "—"}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!editing ? (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                >
                  <Edit2 size={18} />
                  <span className="hidden sm:inline">Edit</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  <CheckCircle2 size={18} />
                  {saving ? "Updating..." : "Update"}
                </button>
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Cancel
                </button>
              </>
            )}
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
            >
              <Trash2 size={18} />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>
      </div>

      {/* member info */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 md:p-6 ring-1 ring-slate-100 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Member Details</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">Profile and contact information</h3>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              {memberType}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Full Name</label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  readOnly={!editing}
                  value={form.fullname}
                  onChange={(e) => handleChange("fullname", e.target.value)}
                  className={`w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none transition ${editing ? "border-slate-400 bg-transparent text-slate-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" : "border-slate-200 bg-slate-50 text-slate-700"}`}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  readOnly={!editing}
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={`w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none transition ${editing ? "border-slate-400 bg-transparent text-slate-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" : "border-slate-200 bg-slate-50 text-slate-700"} appearance-none`}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  readOnly={!editing}
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className={`w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none transition ${editing ? "border-slate-400 bg-transparent text-slate-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" : "border-slate-200 bg-slate-50 text-slate-700"} appearance-none`}
                />
              </div>
            </div>

            <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-600" />
                <h4 className="text-sm font-semibold text-slate-800">Location Details</h4>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">State</label>
                  <input
                    readOnly={!editing}
                    value={form?.location?.state || ""}
                    onChange={(e) => handleChange("location", e.target.value, "state")}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${editing ? "border-slate-400 bg-white text-slate-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" : "border-slate-200 bg-slate-100 text-slate-700"} appearance-none`}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">City</label>
                  <input
                    readOnly={!editing}
                    value={form?.location?.city || ""}
                    onChange={(e) => handleChange("location", e.target.value, "city")}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${editing ? "border-slate-400 bg-white text-slate-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" : "border-slate-200 bg-slate-100 text-slate-700"} appearance-none`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Address</label>
                  <input
                    readOnly={!editing}
                    value={form?.location?.address || ""}
                    onChange={(e) => handleChange("location", e.target.value, "address")}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${editing ? "border-slate-400 bg-white text-slate-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" : "border-slate-200 bg-slate-100 text-slate-700"} appearance-none`}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Nearest Bus Stop</label>
                  <input
                    readOnly={!editing}
                    value={form?.location?.nearestBusStop || ""}
                    onChange={(e) => handleChange("location", e.target.value, "nearestBusStop")}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${editing ? "border-slate-400 bg-white text-slate-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" : "border-slate-200 bg-slate-100 text-slate-700"} appearance-none`}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Zip Code</label>
                  <input
                    readOnly={!editing}
                    value={form?.location?.zipcode || ""}
                    onChange={(e) => handleChange("location", e.target.value, "zipcode")}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${editing ? "border-slate-400 bg-white text-slate-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" : "border-slate-200 bg-slate-100 text-slate-700"} appearance-none`}
                  />
                </div>
              </div>
            </div>

            {isIndividual ? (
              <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                This member is marked as <span className="font-semibold text-slate-800">INDIVIDUAL</span>, so business name is tied to the full name.
              </div>
            ) : (
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Business Name</label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    readOnly={!editing}
                    value={form.businessName}
                    onChange={(e) => handleChange("businessName", e.target.value)}
                    className={`w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none transition ${editing ? "border-slate-400 bg-transparent text-slate-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" : "border-slate-200 bg-slate-50 text-slate-700"} appearance-none`}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ACCOUNT SECTION */}
        <div className="rounded-2xl bg-white p-5 md:p-6 ring-1 ring-slate-100 shadow-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Account Status</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">Billing and membership</h3>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Member Type</label>
              <select
                disabled={!editing}
                value={form.type}
                onChange={(e) => handleChange("type", e.target.value)}
                className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${editing ? "border-slate-400 bg-transparent text-slate-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" : "border-slate-200 bg-slate-50 text-slate-700"} appearance-none`}
              >
                <option value="BUSINESS">BUSINESS</option>
                <option value="INDIVIDUAL">INDIVIDUAL</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Category</label>
              <select
                disabled={!editing}
                value={form.category}
                onChange={(e) => handleChange("category", e.target.value)}
                className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${editing ? "border-slate-400 bg-transparent text-slate-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" : "border-slate-200 bg-slate-50 text-slate-700"} appearance-none `}
              >
                <option value="">Select category</option>
                {pricingOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Billing Frequency</label>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700">
                {form.billingFrequency || "—"}
              </div>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <Wallet className="h-4 w-4" />
                Wallet Profile
              </div>
              <p className="mt-1 text-sm text-slate-600">
                Member data and payment history are linked to this account.
              </p>
            </div>

            {/* wallet section */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Wallet className="h-4 w-4 text-emerald-600" />
                Settlement Account
              </div>

              {isExist ? (
                <div className="mt-3 grid grid-cols-1 gap-3">
                  <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Account Number
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {wallet?.accountNo || "Not available"}
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Bank
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {wallet?.bank?.name || "Not available"}
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Account Name
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {wallet?.accountName || member?.businessName || member?.fullname || "Not available"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                    Wallet Status
                  </p>
                  <p className="mt-1 text-sm font-medium text-amber-800">
                    Wallet information is not available.
                  </p>
                  <p className="mt-1 text-xs text-amber-700">
                    This member does not have a provisioned wallet account yet.
                  </p>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* pricing and upgrade information */}
      <div className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between md:p-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Pricing</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">Member Pricing</h3>
            <p className="mt-1 text-sm text-slate-600">
              {memberPricing?.length} assigned pricing option(s)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedPricingIds(memberPrices);
                setIsPricingModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              Upgrade
            </button>
            {selectedPricing && (
              <button
                type="button"
                onClick={async () => {
                  if (selectedPricing.id) {
                    setSelectedPricingIds((current) =>
                      current.filter((id) => id !== selectedPricing.id),
                    );
                    handlePricingSubmit("downgrade");
                  }
                  setSelectedPricing(null);
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
              >
                Downgrade
              </button>
            )}
          </div>
        </div>

        {memberPricing && memberPricing.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500">
            No pricing has been assigned to this member.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 md:p-6 xl:grid-cols-3">
            {memberPricing && memberPricing?.length > 0 && memberPricing.map((item) => {
              const isSelected = selectedPricingIds.includes(item.id || "");

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handlePricingSelect(item)}
                  className={`text-left rounded-2xl border p-5 transition-all ${isSelected ? "border-emerald-300 bg-emerald-50 shadow-sm" : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Pricing Title</p>
                      <h4 className="mt-1 text-base font-semibold text-slate-900">
                        {item.title || "Untitled Pricing"}
                      </h4>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {item.type || "—"}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    <div className="flex items-center justify-between gap-3">
                      <span>Category</span>
                      <span className="font-semibold text-slate-800">{item.category || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Price</span>
                      <span className="font-semibold text-slate-800">
                        {item.price ? `₦${Number(item.price).toLocaleString()}` : "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Status</span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.status ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
                        {item.status ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Benefit</p>
                    <p className="mt-1 text-sm text-slate-700">
                      {item.benefit || "No benefit description available."}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* company information */}
      <div className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between md:p-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Company Information</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">Assigned Company</h3>
            <p className="mt-1 text-sm text-slate-600">
              Manage this member&apos;s assigned company
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedCompanyId("");
              setIsCompanyModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            Change Company
          </button>
        </div>

        <div className="p-4 md:p-6">
          {companyLoading ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Loading company information...
            </div>
          ) : currentCompany ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-emerald-700">Current Company</p>
                  <h4 className="mt-1 text-base font-semibold text-slate-900">
                    {currentCompany.name || "Unnamed Company"}
                  </h4>
                  <p className="mt-1 text-sm text-slate-600">{currentCompany.uid || currentCompany.id || "No company id"}</p>
                </div>

                <div className="grid grid-cols-1 gap-2 text-sm text-slate-700">
                  <p>{currentCompany.email || "No email"}</p>
                  <p>{currentCompany.phone || "No phone"}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              No company is currently assigned to this member.
            </div>
          )}
        </div>
      </div>

      {/* agent information */}
      <div className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between md:p-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Agent Information</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">Assigned Agent</h3>
            <p className="mt-1 text-sm text-slate-600">
              Manage this member&apos;s assigned collection agent
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedAgentId("");
              setIsAgentModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            Change Agent
          </button>
        </div>

        <div className="p-4 md:p-6">
          {agentLoading ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Loading agent information...
            </div>
          ) : currentAgent ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-emerald-700">Current Agent</p>
                  <h4 className="mt-1 text-base font-semibold text-slate-900">
                    {currentAgent.fullname || currentAgent.name || "Unnamed Agent"}
                  </h4>
                  <p className="mt-1 text-sm text-slate-600">{currentAgent.uid || currentAgent.id || "No agent id"}</p>
                </div>

                <div className="grid grid-cols-1 gap-2 text-sm text-slate-700">
                  <p>{currentAgent.email || "No email"}</p>
                  <p>{currentAgent.phone || "No phone"}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              No agent is currently assigned to this member.
            </div>
          )}
        </div>
      </div>

      {isCompanyModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/50 p-4 h-screen">
          <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl">
            <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-start md:justify-between md:p-6">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Change Company</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">Select a company</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Click a company card to reveal the assign button.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsCompanyModalOpen(false);
                  setSelectedCompanyId("");
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-4 md:p-6">
              {companies.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  No companies found for this center.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {companies.map((company) => {
                    const companyId = company.uid || company.id || "";
                    const isSelected = selectedCompanyId === companyId;

                    return (
                      <div
                        key={companyId || company.email}
                        className={`rounded-2xl border p-5 transition-all ${isSelected ? "border-emerald-300 bg-emerald-50 shadow-sm" : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40"}`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedCompanyId(companyId)}
                          className="w-full text-left"
                        >
                          <p className="text-xs uppercase tracking-wide text-slate-500">Company</p>
                          <h4 className="mt-1 text-base font-semibold text-slate-900">
                            {company.name || "Unnamed Company"}
                          </h4>
                          <p className="mt-1 text-xs text-slate-600">{companyId || "No company id"}</p>

                          <div className="mt-4 space-y-2 text-sm text-slate-700">
                            <p>{company.email || "No email"}</p>
                            <p>{company.phone || "No phone"}</p>
                            <p>{company.location || "No location"}</p>
                          </div>
                        </button>

                        {isSelected && companyId && (
                          <button
                            type="button"
                            onClick={() => {
                              handleCompanyChange(companyId);
                              setIsCompanyModalOpen(false);
                              setSelectedCompanyId("");
                            }}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                          >
                            Set as Company
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isAgentModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/50 p-4 h-screen">
          <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl">
            <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-start md:justify-between md:p-6">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Change Agent</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">Select an agent</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Click an agent card to show the set button.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsAgentModalOpen(false);
                  setSelectedAgentId("");
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-4 md:p-6">
              {agents.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  No agents found for this center.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {agents.map((agent) => {
                    const agentId = agent.uid || agent.id || "";
                    const isSelected = selectedAgentId === agentId;

                    return (
                      <div
                        key={agentId || agent.email}
                        className={`rounded-2xl border p-5 transition-all ${isSelected ? "border-emerald-300 bg-emerald-50 shadow-sm" : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40"}`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedAgentId(agentId)}
                          className="w-full text-left"
                        >
                          <p className="text-xs uppercase tracking-wide text-slate-500">Agent</p>
                          <h4 className="mt-1 text-base font-semibold text-slate-900">
                            {agent.fullname || agent.name || "Unnamed Agent"}
                          </h4>
                          <p className="mt-1 text-xs text-slate-600">{agentId || "No agent id"}</p>

                          <div className="mt-4 space-y-2 text-sm text-slate-700">
                            <p>{agent.email || "No email"}</p>
                            <p>{agent.phone || "No phone"}</p>
                            <p>{agent.location || "No location"}</p>
                          </div>
                        </button>

                        {isSelected && agentId && (
                          <button
                            type="button"
                            onClick={() => {
                              handleAgentChange(agentId);
                              setIsAgentModalOpen(false);
                              setSelectedAgentId("");
                            }}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                          >
                            Set as Agent
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isPricingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 h-screen">
          <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl">
            <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-start md:justify-between md:p-6">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Upgrade Pricing</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">Select available plans</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Filtered by {memberType}{memberCategory ? ` • ${memberCategory}` : ""}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {selectedPricingIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedPricingIds([])}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsPricingModalOpen(false)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-4 md:p-6">
              {availablePricing.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  No pricing plans match this member&apos;s type and category.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {availablePricing.map((item) => {
                    const checked = selectedPricingIds.includes(item.id || "");

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => togglePricingSelection(item.id || "")}
                        className={`text-left rounded-2xl border p-5 transition-all ${checked ? "border-emerald-300 bg-emerald-50 shadow-sm" : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">Plan</p>
                            <h4 className="mt-1 text-base font-semibold text-slate-900">
                              {item.title || "Untitled Pricing"}
                            </h4>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${checked ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"}`}>
                            {checked ? "Selected" : "Select"}
                          </span>
                        </div>

                        <div className="mt-4 space-y-3 text-sm text-slate-600">
                          <div className="flex items-center justify-between gap-3">
                            <span>Type</span>
                            <span className="font-semibold text-slate-800">{item.type || "—"}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span>Category</span>
                            <span className="font-semibold text-slate-800">{item.category || "—"}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span>Price</span>
                            <span className="font-semibold text-slate-800">
                              {item.price ? `₦${Number(item.price).toLocaleString()}` : "—"}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 border-t border-slate-100 pt-4">
                          <p className="text-xs uppercase tracking-wide text-slate-500">Benefit</p>
                          <p className="mt-1 text-sm text-slate-700">
                            {item.benefit || "No benefit description available."}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-200 p-4 md:p-6">
              <p className="text-sm text-slate-600">
                {Number(selectedPricingIds.length - 1)} plan(s) selected
              </p>
              <button
                type="button"
                onClick={() => handlePricingSubmit("upgrade")}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                Submit Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* payment cards by payment category */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {paymentSummaryCards.length === 0 ? (
          <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-sm md:col-span-2 xl:col-span-3">
            <p className="text-sm font-medium text-slate-600">No payments available yet.</p>
          </div>
        ) : (
          // paymentSummaryCards.map((summary) => (
          //   <div key={summary.label} className="rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-sm">
          //     <p className="text-xs uppercase tracking-wide text-slate-500">Payment Group</p>
          //     <h4 className="mt-1 text-base font-semibold text-slate-900">{summary.label}</h4>

          //     <div className="mt-4 grid grid-cols-2 gap-3">
          //       <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
          //         <p className="text-[11px] uppercase tracking-wide text-emerald-700">Total Paid</p>
          //         <p className="mt-1 text-sm font-bold text-emerald-800">₦{summary.totalPaid.toLocaleString()}</p>
          //       </div>

          //       <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2">
          //         <p className="text-[11px] uppercase tracking-wide text-amber-700">Pending</p>
          //         <p className="mt-1 text-sm font-bold text-amber-800">₦{summary.pending.toLocaleString()}</p>
          //       </div>

          //       <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2">
          //         <p className="text-[11px] uppercase tracking-wide text-rose-700">Owing</p>
          //         <p className="mt-1 text-sm font-bold text-rose-800">₦{summary.owing.toLocaleString()}</p>
          //       </div>

          //       <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          //         <p className="text-[11px] uppercase tracking-wide text-slate-700">Total</p>
          //         <p className="mt-1 text-sm font-bold text-slate-900">₦{summary.total.toLocaleString()}</p>
          //       </div>
          //     </div>
          //   </div>
          // ))
          null
        )}
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Summary cards are grouped by payment frequency or method.</p>
      </div>

      {/* payment records section */}
      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm">
        <div className="flex flex-col gap-4 p-4 md:p-6 border-b border-slate-100 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Transactions</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">
              Payment Records
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              {payments.length} transaction(s)
            </p>
          </div>
          {payments.length > 0 && (
            <button
              onClick={downloadPaymentsCSV}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          )}
        </div>

        {payments.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-500">No payment records found.</p>
          </div>
        ) : (
          <div className="relative block overflow-x-auto">
            <table className="min-w-max w-full text-left">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-700 md:px-6 md:text-sm">
                    Reference
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-700 md:px-6 md:text-sm">
                    Business
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-700 md:px-6 md:text-sm">
                    Type
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-700 md:px-6 md:text-sm">
                    Frequency
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-700 md:px-6 md:text-sm">
                    Date
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-700 md:px-6 md:text-sm">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-700 md:px-6 md:text-sm">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr
                    key={p.id || p.reference}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="px-4 py-4 font-mono text-xs text-slate-600 md:px-6 md:text-sm">
                      <Link
                        href={`/admin/payments/${p.reference}`}
                        className="rounded-lg text-xs font-medium text-slate-600 transition-colors hover:text-emerald-600 md:text-sm"
                      >
                        {p.reference || p.id}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-700 md:px-6 md:text-sm">
                      {p.businessName || "—"}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-700 md:px-6 md:text-sm">
                      {p.businessType || "—"}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-700 md:px-6 md:text-sm">
                      {p.frequency || p.billingFrequency || "—"}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-700 md:px-6 md:text-sm">
                      {p.date
                        ? new Date(p.date).toLocaleDateString()
                        : p.createdAt
                          ? new Date(p.createdAt).toLocaleDateString()
                          : "—"}
                    </td>
                    <td className="px-4 py-4 text-xs font-semibold text-slate-900 md:px-6 md:text-sm">
                      {typeof p.amount === "number"
                        ? `₦${p.amount.toLocaleString()}`
                        : p.amount || "—"}
                    </td>
                    <td className="px-4 py-4 text-xs md:px-6 md:text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${p.status?.toUpperCase() === "COMPLETED" ||
                          p.status?.toUpperCase() === "SUCCESS"
                          ? "bg-emerald-100 text-emerald-700"
                          : p.status?.toUpperCase() === "PENDING"
                            ? "bg-blue-100 text-blue-700"
                            : p.status?.toUpperCase() === "FAILED"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                      >
                        {p.status || "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
