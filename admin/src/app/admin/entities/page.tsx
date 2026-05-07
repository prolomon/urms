"use client";
import  { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Download,
  FileUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { getMembers, Member } from "@/lib/services/member";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function EntitiesPage() {
  const router = useRouter();
  const { uid, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [members, setMembers] = useState<Member[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 1,
  });
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("All");
  const centerId = user?.uid || "";

  const fetchData = useCallback(async () => {
      setLoading(true);
      try {
        const companyId = centerId || uid;
        const memberData = await getMembers(page, 100, companyId);

        setMembers(memberData?.data || []);
        setMeta(
          memberData?.meta || { page, limit: 100, total: 0, totalPages: 1 },
        );

      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
  }, [page, centerId, uid]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // reset to page 1 when search or filters change (deferred to avoid cascading renders)
  useEffect(() => {
    const id = setTimeout(() => setPage(1), 0);
    return () => clearTimeout(id);
  }, [searchTerm, statusFilter, typeFilter]);

  const memberList = Array.isArray(members) ? members : [];
  const filteredMembers = memberList.filter((m) => {
    const q = searchTerm.trim().toLowerCase();

    // search across uid, fullname, businessName, email, phone
    const matchesQuery =
      !q ||
      [m.uid, m.fullname, m.businessName, m.email, m.phone]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Active" ? Boolean(m.status) : !Boolean(m.status));

    const matchesType =
      typeFilter === "All Types" || (m.type && m.type === typeFilter);

    return matchesQuery && matchesStatus && matchesType;
  });

  // CSV helpers — include fields that are not shown in the table
  const escapeCSV = (val: string | number | null | undefined) => {
    if (val === null || val === undefined) return "";
    const s = typeof val === "string" ? val : String(val);
    return `"${s.replace(/"/g, '""')}"`;
  };

  const buildCSV = (rows: any[]) => {
    const headers = [
      "id",
      "Entity ID",
      "Fullname",
      "Type",
      "Business Name",
      "Category",
      "Email",
      "Phone",
      "Billing Frequency",
      // "City",
      // "State",
      // "Address",
      // "Country",
      "Role",
      "createdAt",
      "updatedAt",
    ];

    const lines = [headers.join(",")];

    rows.forEach((r: any) => {
      const line = [
        escapeCSV(r.id),
        escapeCSV(r.uid),
        escapeCSV(r.fullname),
        escapeCSV(r.type),
        escapeCSV(r.businessName),
        escapeCSV(r.category),
        escapeCSV(r.email),
        escapeCSV(r.phone),
        escapeCSV(r.billingFrequency),
        // escapeCSV(r.location?.city),
        // escapeCSV(r.location?.state),
        // escapeCSV(r.location?.address),
        // escapeCSV(r.location?.country),
        escapeCSV(r.role),
        escapeCSV(r.createdAt),
        escapeCSV(r.updatedAt),
      ].join(",");
      lines.push(line);
    });

    return lines.join("\n");
  };

  const handleDownload = () => {
    try {
      const rows = filteredMembers.length ? filteredMembers : members;
      const csv = buildCSV(rows);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const date = new Date().toISOString().slice(0, 10);
      const filename = `AMAC ENTITY ${date}.csv`;

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed", e);
    }
  };

  const start = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const end = Math.min(meta.page * meta.limit, meta.total);
  const pages = Array.from(
    { length: Math.max(1, meta.totalPages) },
    (_, i) => i + 1,
  );

  const categoryBadgeClass = (businessType = "") => {
    const type = businessType.toUpperCase();

    if (type === "SMALL") {
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }

    if (type === "MEDIUM") {
      return "border-blue-200 bg-blue-50 text-blue-700";
    }

    if (type === "LARGE") {
      return "border-violet-200 bg-violet-50 text-violet-700";
    }

    return "border-slate-200 bg-slate-50 text-slate-700";
  };

  const typeBadgeClass = (type = "") => {
    const t = type.toUpperCase();

    if (t === "INDIVIDUAL") {
      return "border-purple-200 bg-purple-50 text-purple-700";
    }

    return "border-blue-200 bg-blue-50 text-blue-700";
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 md:p-6">
      <div className="rounded-2xl bg-linear-to-r from-emerald-50 via-white to-cyan-50 p-5 md:p-6 ring-1 ring-emerald-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800">
              Entity Management
            </h2>
            <p className="mt-1 text-sm text-slate-600 md:text-base">
              {meta.total} entities • Manage businesses and tax-paying entities
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <button className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 md:px-4" onClick={() => {
              router.push("/admin/entities/add");
            }}>
              <Plus size={18} />
              <span className="hidden sm:inline">Add Entity</span>
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 md:px-4">
              <FileUp size={18} />
              <span className="hidden sm:inline">Import</span>
            </button>
            <button
              onClick={() => handleDownload()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 md:px-4"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 md:p-5 ring-1 ring-slate-100 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="relative w-full">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search by Entity ID, business name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-transparent py-2.5 pl-10 pr-4 text-sm text-slate-600 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 appearance-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 rounded-xl border border-slate-300 bg-transparent px-4 py-2.5 text-sm text-slate-600 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 appearance-none"
            >
              <option>All Status</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="flex-1 rounded-xl border border-slate-300 bg-transparent px-4 py-2.5 text-sm text-slate-600 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 appearance-none"
            >
              <option>All Types</option>
              <option>BUSINESS</option>
              <option>INDIVIDUAL</option>
            </select>
          </div>

          <div className="overflow-x-auto block">
            <table className="min-w-max w-full text-left">
              <thead className="border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:px-6 md:text-sm">
                    Entity ID
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:px-6 md:text-sm">
                    Business Name
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:px-6 md:text-sm">
                    Category
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:px-6 md:text-sm">
                    Type
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:px-6 md:text-sm">
                    Email
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((entity) => (
                    <tr
                      key={entity.uid}
                      className="transition-colors hover:bg-slate-50"
                    >
                      <td className="px-4 py-4 font-mono text-xs md:px-6 md:text-sm">
                        <Link
                          href={`/admin/entities/${entity.uid}`}
                          className="rounded-lg text-xs font-medium text-slate-600 transition-colors hover:text-emerald-600 md:text-sm"
                        >
                          {entity.uid}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-xs font-medium text-slate-900 md:px-6 md:text-sm truncate capitalize">
                        {entity.businessName || entity.fullname}
                      </td>
                      <td className="px-4 py-4 md:px-6">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${categoryBadgeClass(
                            entity.category || "",
                          )}`}
                        >
                          {entity.category || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-4 md:px-6">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${typeBadgeClass(
                            entity.type || "",
                          )}`}
                        >
                          {entity.type || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-600 md:px-6 md:text-sm">
                        {entity.email || "—"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center md:px-6">
                      <p className="text-slate-500 text-sm">
                        No entities found
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <p className="text-xs md:text-sm text-slate-600">
                Showing{" "}
                <span className="font-semibold text-slate-900">
                  {start}-{end}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-900">
                  {meta.total}
                </span>{" "}
                entities
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, meta.page - 1))}
                  disabled={meta.page <= 1}
                  className={`rounded-lg p-2 transition-colors ${meta.page <= 1 ? "cursor-not-allowed bg-slate-50 text-slate-300" : "text-emerald-600 hover:bg-emerald-50"}`}
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="hidden md:flex items-center gap-1">
                  {pages.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${p === meta.page ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div className="md:hidden">
                  <span className="text-sm font-medium text-slate-600">
                    Page {meta.page} of {meta.totalPages}
                  </span>
                </div>
                <button
                  onClick={() =>
                    setPage(Math.min(meta.totalPages, meta.page + 1))
                  }
                  disabled={meta.page >= meta.totalPages}
                  className={`rounded-lg p-2 transition-colors ${meta.page >= meta.totalPages ? "cursor-not-allowed bg-slate-50 text-slate-300" : "text-emerald-600 hover:bg-emerald-50"}`}
                >
                  <ChevronRight size={18} />
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );  
}
