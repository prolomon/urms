"use client";

import React, { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Edit2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
  Wallet,
} from "lucide-react";
import { getAgent, updateAgent, deleteAgent, Agent } from "@/lib/services/agent";
import { getMembersByAgentId, Member as MemberType } from "@/lib/services/member";
import { getWallet, Wallet as WalletType } from "@/lib/services/wallet";
import { useRouter } from "next/navigation";

export default function AgentDetailPage({ params }) {
  const resolved: any = use(params);
  const id = resolved.agent;
  const router = useRouter();

  const [agent, setAgent] = useState(null);
  const [form, setForm] = useState({
    fullname: "",
    email: "",
    phone: "",
    gender: "",
    location: "",
    batchNo: "",
  });
  const [members, setMembers] = useState<MemberType[]>([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [isWalletExist, setIsWalletExist] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [countdown, setCountdown] = useState(20);
  const [deleting, setDeleting] = useState(false);
  const timerRef = useRef<number | null>(null);
  const [memberPage, setMemberPage] = useState(1);
  const [memberMeta, setMemberMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const addToast = (type: string, message: string, ttl = 4000) => {
    const toastId = Date.now().toString();
    setToasts((s) => [...s, { id: toastId, type, message }]);
    setTimeout(() => setToasts((s) => s.filter((t) => t.id !== toastId)), ttl);
  };

  const loadAgentData = useCallback(async () => {
    setLoading(true);
    try {
      const agentRes = await getAgent(id || "");

      const foundAgent = agentRes?.agent || null;

      setAgent(foundAgent);
    } catch (e) {
      console.error(e);
      addToast("error", "Failed to load agent details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadMembers = useCallback(async () => {
    setMembersLoading(true);
    try {
      const memberRes = await getMembersByAgentId(memberPage, memberMeta.limit, id || "");

      setMembers(memberRes?.data || []);
      if (memberRes?.meta) {
        setMemberMeta(memberRes.meta);
      }
    } catch (e) {
      console.error(e);
      addToast("error", "Failed to load agent members");
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }, [id, memberPage, memberMeta.limit]);

  useEffect(() => {
    loadAgentData();
  }, [loadAgentData]);

  useEffect(() => {
    setMemberPage(1);
  }, [id]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    if (!agent) return;
    setForm({
      fullname: agent.fullname || agent.name || "",
      email: agent.email || "",
      phone: agent.phone || "",
      gender: agent.gender || "",
      location: agent.location || "",
      batchNo: agent.batchNo || 0,
    });
  }, [agent]);

  const walletOwnerId = agent?.uid || agent?.id || id;

  const fetchWalletData = useCallback(async () => {
    try {
      if (!walletOwnerId) {
        setWallet(null);
        setIsWalletExist(false);
        return;
      }

      const walletData = await getWallet(walletOwnerId, "AGENT");
      
      setIsWalletExist(Boolean(walletData?.isExist));
      if (walletData?.ok) {
        setWallet(walletData?.wallet || null);
      } else {
        setWallet(null);
      }
    } catch (error) {
      console.error(error);
      setWallet(null);
      setIsWalletExist(false);
    }
  }, [walletOwnerId]);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  const handleChange = (key: string, value: string) => setForm((s) => ({ ...s, [key]: value }));

  const handleSave = async () => {
    if (!agent) return;
    setSaving(true);
    try {
      const payload = {
        fullname: form.fullname,
        email: form.email,
        phone: form.phone,
        location: form.location,
        gender: form.gender,
        batchNo: form.batchNo,
      };
      const res = await updateAgent(agent.uid || id, payload);
      const updated = res?.agent || null;
      setAgent((prev) => ({ ...(prev || {}), ...(updated || {}) }));
      addToast("success", "Agent updated");
      setEditing(false);
      await loadAgentData();
    } catch (e) {
      console.error(e);
      addToast("error", e?.message || "Failed to update agent");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setForm({
      fullname: agent?.fullname || agent?.name || "",
      email: agent?.email || "",
      phone: agent?.phone || "",
      gender: agent?.gender || "",
      location: agent?.location || "",
      batchNo: agent?.batchNo || 0,
    });
  };

  const openDeleteModal = () => {
    setCountdown(20);
    setShowDeleteModal(true);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    timerRef.current = window.setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setCountdown(20);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const handleConfirmDelete = async () => {
    if (!agent) return;
    if (countdown > 0) return;
    setDeleting(true);
    try {
      await deleteAgent(agent.uid || id);
      addToast("success", "Agent deleted");
      router.back();
    } catch (e) {
      console.error(e);
      addToast("error", e?.message || "Failed to delete agent");
    } finally {
      setDeleting(false);
      closeDeleteModal();
    }
  };

  const escapeCSV = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };

  const downloadCSV = () => {
    if (!members.length) return;
    const headers = [
      "id",
      "uid",
      "fullname",
      "businessName",
      "Type",
      "Category",
      "email",
      "phone",
      "billingFrequency",
      "location",
      "joined",
    ];

    const rows = members.map((m) => [
      m.id || "",
      m.uid || "",
      m.fullname || "",
      m.businessName || "",
      m.type || "",
      m.category || "",
      m.email || "",
      m.phone || "",
      m.billingFrequency || "",
      m.location || "",
      m.createdAt || "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map(escapeCSV).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `agent-${id}-members-${date}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const avgCollection = 3
  // useMemo(() => {
  //   if (!members.length) return 0;
  //   const total = members.reduce(
  //     (sum, m) => sum + Number(m?.collections || 0),
  //     0,
  //   );
  //   return Math.round(total / members.length);
  // }, [members]);

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="fixed right-6 top-6 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`min-w-64 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${t.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
              }`}
          >
            {t.message}
          </div>
        ))}
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeDeleteModal} />
          <div className="relative z-50 w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-900">Confirm Delete</h3>
            <p className="mt-2 text-sm text-slate-600">Are you sure you want to delete this agent? This action cannot be undone.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={closeDeleteModal}
                disabled={deleting}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={countdown > 0 || deleting}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-600 disabled:opacity-100"
              >
                {deleting ? (
                  "Deleting..."
                ) : countdown > 0 ? (
                  `Yes, Delete (${countdown}s)`
                ) : (
                  "Yes, Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-linear-to-r from-emerald-50 via-white to-cyan-50 p-5 md:p-6 ring-1 ring-emerald-100">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-700"
            >
              <ArrowLeft size={16} />
              Back to Agents
            </button>
            <h1 className="mt-3 text-2xl font-bold text-slate-900 md:text-3xl">
              {agent?.fullname || agent?.name || "Agent Details"}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Agent ID: {agent?.uid || agent?.id || id}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 flex-col">
            <button
              onClick={downloadCSV}
              disabled={loading || members.length === 0}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${loading || members.length === 0
                ? "cursor-not-allowed bg-slate-200 text-slate-500"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
            >
              <Download className="h-4 w-4" />
              Download CSV
            </button>
            <button
              onClick={openDeleteModal}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
            >
              <Download className="h-4 w-4" />
              Delete Agent
            </button>
          </div>

        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Assigned Entities
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {members?.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Total linked businesses</p>
        </div>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Achievement
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">
            {Number(agent?.achievement || 0)}%
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Current target performance
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Collections
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            ₦{Number(agent?.collections || 0)}K
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Total recorded collections
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Average per Entity
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-600">
            ₦{avgCollection}K
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Estimated distribution rate
          </p>
        </div>
      </div>

      {/* agent information and wallet */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 md:p-6 ring-1 ring-slate-100 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Agent Profile
              </p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">
                Personal and contact details
              </h3>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Active profile
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Full Name
              </label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={form.fullname}
                  onChange={(e) => handleChange("fullname", e.target.value)}
                  readOnly={!editing}
                  className={`w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none transition ${editing
                    ? "border-slate-400 bg-transparent text-slate-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    : "border-slate-200 bg-slate-50 text-slate-700"
                    } appearance-none`}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  readOnly={!editing}
                  className={`w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none transition ${editing
                    ? "border-slate-400 bg-transparent text-slate-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    : "border-slate-200 bg-slate-50 text-slate-700"
                    } appearance-none`}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Phone
              </label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  readOnly={!editing}
                  className={`w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none transition ${editing
                    ? "border-slate-400 bg-transparent text-slate-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    : "border-slate-200 bg-slate-50 text-slate-700"
                    } appearance-none`}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Gender
              </label>
              <select
                value={form.gender}
                onChange={(e) => handleChange("gender", e.target.value)}
                disabled={!editing}
                className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${editing
                  ? "border-slate-400 bg-transparent text-slate-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  : "border-slate-200 bg-slate-50 text-slate-700"
                  } appearance-none`}
              >
                <option value="">Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Location
              </label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={form.location || ""}
                  onChange={(e) => handleChange("location", e.target.value)}
                  readOnly={!editing}
                  className={`w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none transition ${editing
                    ? "border-slate-400 bg-transparent text-slate-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    : "border-slate-200 bg-slate-50 text-slate-700"
                    } appearance-none`}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Batch Number
              </label>
              <input
                value={form.batchNo}
                onChange={(e) => handleChange("batchNo", e.target.value)}
                readOnly={!editing}
                className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${editing
                  ? "border-slate-400 bg-transparent text-slate-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  : "border-slate-200 bg-slate-50 text-slate-700"
                  } appearance-none`}
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                <Edit2 className="h-4 w-4" />
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 md:p-6 ring-1 ring-slate-100 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Wallet className="h-4 w-4 text-emerald-600" />
            Settlement Account
          </div>

          {isWalletExist ? (
            <div className="mt-4 grid grid-cols-1 gap-3">
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
                  {wallet?.accountName || agent?.fullname || "Not available"}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                Wallet Status
              </p>
              <p className="mt-1 text-sm font-medium text-amber-800">
                Wallet information is not available.
              </p>
              <p className="mt-1 text-xs text-amber-700">
                This agent does not have a provisioned wallet account yet.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* members list */}
      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between md:p-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Entities
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">
              Assigned Entities
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              {members.length} member(s) assigned to this agent
            </p>
          </div>
          <button
            onClick={downloadCSV}
            disabled={membersLoading || members.length === 0}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${membersLoading || members.length === 0
              ? "cursor-not-allowed bg-slate-200 text-slate-500"
              : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-max w-full text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-slate-700 md:px-6 md:text-sm">
                  UID
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-700 md:px-6 md:text-sm">
                  Name
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-700 md:px-6 md:text-sm">
                  Business
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-700 md:px-6 md:text-sm">
                  Type
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-700 md:px-6 md:text-sm">
                  Phone
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-700 md:px-6 md:text-sm">
                  Frequency
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {membersLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-sm text-slate-500 md:px-6"
                  >
                    Loading members...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-slate-500 md:px-6"
                  >
                    No members assigned to this agent yet.
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr
                    key={m.id || m.uid}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 text-xs font-medium text-slate-700 md:px-6 md:text-sm">
                      <Link
                        href={`/admin/entities/${m.uid}`}
                        className="rounded-lg text-slate-600 transition-colors hover:text-emerald-600"
                      >
                        {m.uid || "-"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700 md:px-6 md:text-sm">
                      {m.fullname || "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700 md:px-6 md:text-sm">
                      {m.businessName || "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700 md:px-6 md:text-sm">
                      {m.type || "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700 md:px-6 md:text-sm">
                      {m.phone || "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700 md:px-6 md:text-sm">
                      {m.billingFrequency || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <p className="text-sm text-slate-600">
            Page {memberMeta.page} of {memberMeta.totalPages} · {memberMeta.total} total members
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMemberPage((page) => Math.max(1, page - 1))}
              disabled={memberPage <= 1 || membersLoading}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setMemberPage((page) => Math.min(memberMeta.totalPages, page + 1))}
              disabled={memberPage >= memberMeta.totalPages || membersLoading}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
