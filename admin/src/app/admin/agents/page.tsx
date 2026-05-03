"use client";
import React, { useEffect, useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Plus,
  X,
  Users,
  Trophy,
  Gauge,
  UserRound,
  MapPin,
  Mail,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { getAgents, createAgent, Agent as AgentType } from "@/lib/services/agent";
import { useRouter } from "next/navigation";
import { getMembers, Member as MemberType } from "@/lib/services/member";

const performanceData = [
  { name: "A. Musa", value: 675 },
  { name: "B. Okafor", value: 520 },
  { name: "C. Adamu", value: 390 },
  { name: "D. Ibrahim", value: 445 },
  { name: "E. Okonkwo", value: 380 },
];

import { getLocation } from "@/lib/services/location";
import { useAuth } from "@/context/AuthContext";

export default function Agents() {
  const router = useRouter();
  const { uid, user } = useAuth();
  const [agents, setAgents] = useState<AgentType[]>([]);
  const [members, setMembers] = useState<MemberType[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    fullname: "",
    email: "",
    phone: "",
    location: "",
    gender: "",
    batchNo: "",
  });
  const [suggestions, setSuggestions] = useState<Array<{ id: string | number; name: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "" | "success" | "error"; msg: string }>({ type: "", msg: "" });

  const loadAgents = useCallback(async () => {
    setLoading(true);
    try {
      // console.log(user?.uid, uid)
      const agentsRes = await getAgents(user?.uid || uid || "");
      const memberRes = await getMembers(1, 1000, user?.uid || uid || "");

      const agentsList = agentsRes?.data || [];
      setAgents(agentsList);
      setMembers(memberRes?.data || null);
    } catch (e) {
      console.error("Failed to load data", e);
    } finally {
      setLoading(false);
    }
  }, [setAgents, uid, user?.uid]);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const handleChange = (k: keyof typeof form, v: string) =>
    setForm((s) => ({ ...s, [k]: v }));

  const handleLocationChange = async (value: string) => {
    handleChange("location", value);

    if (!value?.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await getLocation({ query: value, limit: 30 });
      setSuggestions(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error("Failed to fetch locations", e);
      setSuggestions([]);
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const payload = {
        fullname: form.fullname,
        email: form.email,
        phone: form.phone,
        gender: form.gender,
        location: form.location,
        batchNo: form.batchNo,
        center: uid || user?.uid || "",
      };

      const res = await createAgent(payload);

      if (!res) {
        throw new Error(res?.message || "Failed to create agent");
      }
      const created = res?.agent;
      if (created) {
        setAgents((s) => [created, ...s]);
      }
      setModalOpen(false);
      setForm({
        fullname: "",
        email: "",
        phone: "",
        location: "",
        gender: "",
        batchNo: "",
      });
      setStatus({ type: "success", msg: "Agent created successfully" });
      if (res?.agent?.uid) {
        router.push(`/admin/agents/${res.agent.uid}`);
      }
    } catch (e) {
      console.error(e);
      setStatus({
        type: "error",
        msg: e instanceof Error ? e.message : "Failed to create agent",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="rounded-2xl bg-linear-to-r from-emerald-50 via-white to-cyan-50 p-5 md:p-6 ring-1 ring-emerald-100">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
              Agent Management
            </h1>
            <p className="mt-1 text-sm text-slate-600 md:text-base">
              Monitor agent performance, productivity, and collections in one
              place.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            <Plus size={18} />
            Add Agent
          </button>
        </div>
      </div>

      {status.msg && (
        <div
          className={`rounded-2xl border p-4 text-sm font-medium ${status.type === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
        >
          {status.msg}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Total Agents
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {agents.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Registered field agents</p>
        </div>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Average Achievement
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">
            {agents.length
              ? `${(
                agents.reduce(
                  (sum, item) => sum + Number(0),
                  0,
                ) / agents.length
              ).toFixed(1)}%`
              : "0.0%"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Across all active agents
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Total Collections
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            ₦
            {agents.reduce(
              (sum, item) => sum + Number(0),
              0,
            )}
            K
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Combined collection volume
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Top Performer
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-600">
            {agents.length
              ? `${Math.max(...agents.map((item) => Number(0))).toFixed(0)}%`
              : "0%"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Highest target achievement
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 md:p-6 ring-1 ring-slate-100 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">
              Top Performing Agents
            </h3>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <Trophy className="h-3.5 w-3.5" />
              Performance
            </span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  dx={-10}
                  tickFormatter={(val) => `₦${val}K`}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {performanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#10b981" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 md:p-6 ring-1 ring-slate-100 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">
              Agent(s) Overview
            </h3>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
              <Users className="h-3.5 w-3.5" />
              Team
            </span>
          </div>

          <div className="space-y-3 md:space-y-4 max-h-96 overflow-y-auto pr-1">
            {loading ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Loading agents...
              </div>
            ) : agents.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
                <UserRound className="mx-auto h-9 w-9 text-slate-300" />
                <h4 className="mt-2 font-semibold text-slate-800">
                  No agents available
                </h4>
                <p className="mt-1 text-sm text-slate-500">
                  Add your first field agent to begin assignment and tracking.
                </p>
                <button
                  onClick={() => setModalOpen(true)}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  <Plus size={16} />
                  Add Agent
                </button>
              </div>
            ) : (
              agents.map((agent) => {
                const agentId = agent.uid;
                const entityCount = members.filter(
                  (m) => m.agent === agentId,
                ).length;
                const achievement = Number(0);
                return (
                  <div
                    key={agent.id || agent.uid}
                    className="rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-emerald-200"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-base font-semibold text-slate-900">
                          <Link
                            href={`/admin/agents/${agent.uid || agent.id}`}
                            className="text-slate-900 transition-colors hover:text-emerald-600"
                          >
                            {agent.fullname || agent.name}
                          </Link>
                        </h4>
                        <p className="mt-1 text-xs text-slate-500">
                          ID: {agent.uid || agent.id}{" "}
                          {agent.zone ? `| Zone: ${agent.zone}` : ""}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        <Gauge className="h-3.5 w-3.5" />
                        {achievement}%
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                      <span>
                        Entities:{" "}
                        <span className="font-semibold text-slate-900">
                          {entityCount}
                        </span>
                      </span>
                      <span>
                        Collections:{" "}
                        <span className="font-semibold text-emerald-700">
                          ₦{0}K
                        </span>
                      </span>
                    </div>

                    <div className="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-700"
                        style={{
                          width: `${Math.min(100, Math.max(0, achievement))}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <h3 className="text-xl font-bold text-slate-900">
                Add New Agent
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close modal"
              >
                <X size={24} className="text-slate-500" />
              </button>
            </div>

            <div>
              <div className="block h-[68vh] space-y-3 overflow-y-auto px-6 py-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      placeholder="e.g., John Doe"
                      value={form.fullname}
                      onChange={(e) => handleChange("fullname", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      placeholder="e.g., john@company.com"
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Phone *
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="e.g., 08012345678"
                      value={form.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Batch No *
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 00000000"
                    value={form.batchNo}
                    onChange={(e) => handleChange("batchNo", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g., Wuse Zone 2"
                      value={form.location}
                      onChange={(e) => handleLocationChange(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </div>

                <div>
                  {suggestions.length > 0 && (
                    <div className="mt-1 max-h-40 overflow-y-auto rounded-xl border border-emerald-300 bg-white p-2">
                      {suggestions.map((suggestion) => (
                        <div
                          key={suggestion.id}
                          className="cursor-pointer rounded-lg px-4 py-2 text-sm text-slate-700 hover:bg-emerald-500 hover:text-white"
                          onClick={() => {
                            handleChange("location", suggestion.name);
                            setSuggestions([]);
                          }}
                        >
                          {suggestion.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Gender
                  </label>
                  <select
                    value={form.gender}
                    onChange={(e) => handleChange("gender", e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option hidden>Select gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>

                {status.type === "error" && (
                  <div
                    className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700"
                  >
                    <p className="text-sm font-semibold">{status.msg}</p>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 px-6 pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={saving}
                    className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:bg-emerald-400"
                  >
                    {saving ? "Saving..." : "Create Agent"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
