"use client";
import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Download,
  FileUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { getStaffs, Staff } from "@/lib/services/staff";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function StaffsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [staffs, setStaffs] = useState<Staff[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 1,
  });
  const [toasts, setToasts] = useState<
    { id: number; type: string; message: string }[]
  >([]);
  const centerId = user?.uid || "";

  const addToast = (type: "success" | "error", message: string, ttl = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((s) => [...s, { id, type, message }]);
    setTimeout(() => setToasts((s) => s.filter((t) => t.id !== id)), ttl);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!centerId) return;
      setLoading(true);
      try {
        const data = await getStaffs(centerId);
        const staffList = Array.isArray(data?.data) ? data.data : [];
        setStaffs(staffList);
        setMeta(
          data?.meta || { page: 1, limit: 100, total: staffList.length, totalPages: 1 },
        );
      } catch (error) {
        console.error("Failed to fetch staffs", error);
        addToast("error", "Failed to fetch staffs");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [centerId]);

  // reset to page 1 when search changes (deferred to avoid cascading renders)
  useEffect(() => {
    const id = setTimeout(() => setPage(1), 0);
    return () => clearTimeout(id);
  }, [searchTerm]);

  const staffList = Array.isArray(staffs) ? staffs : [];
  const filteredStaffs = staffList.filter((s) => {
    const q = searchTerm.trim().toLowerCase();
    return (
      !q ||
      [s.uid, s.fullname, s.email, s.phone]
        .filter(Boolean)
        .some((v) => v?.toLowerCase().includes(q))
    );
  });

  // CSV helpers
  const escapeCSV = (val: string | number | Date | null | undefined) => {
    if (val === null || val === undefined) return "";
    let s = "";
    if (val instanceof Date) {
      s = val.toISOString();
    } else {
      s = typeof val === "string" ? val : String(val);
    }
    return `"${s.replace(/"/g, '""')}"`;
  };

  const buildCSV = (rows: Staff[]) => {
    const headers = [
      "id",
      "Staff ID",
      "Fullname",
      "Email",
      "Phone",
      "Gender",
      "Status",
      "Role",
      "Created At",
      "Updated At",
    ];

    const lines = [headers.join(",")];

    rows.forEach((r) => {
      const line = [
        escapeCSV(r.id),
        escapeCSV(r.uid),
        escapeCSV(r.fullname),
        escapeCSV(r.email),
        escapeCSV(r.phone),
        escapeCSV(r.gender),
        escapeCSV(r.status ? "Active" : "Inactive"),
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
      const rows = filteredStaffs.length ? filteredStaffs : staffList;
      const csv = buildCSV(rows);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const date = new Date().toISOString().slice(0, 10);
      const filename = `STAFFS ${date}.csv`;

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

  const statusBadgeClass = (status?: boolean) => {
    if (status) {
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }
    return "border-red-200 bg-red-50 text-red-700";
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 md:p-6">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-lg px-4 py-3 text-sm font-medium ${
              toast.type === "success"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-linear-to-r from-emerald-50 via-white to-cyan-50 p-5 md:p-6 ring-1 ring-emerald-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800">
              Staff Management
            </h2>
            <p className="mt-1 text-sm text-slate-600 md:text-base">
              {meta.total} staffs • Manage your team members
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 md:px-4"
              onClick={() => {
                router.push("/admin/staffs/add");
              }}
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Add Staff</span>
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
          <div className="relative w-full">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by Staff ID, name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-transparent py-2.5 pl-10 pr-4 text-sm text-slate-600 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 appearance-none"
            />
          </div>

          <div className="overflow-x-auto block">
            <table className="min-w-max w-full text-left">
              <thead className="border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:px-6 md:text-sm">
                    Staff ID
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:px-6 md:text-sm">
                    Full Name
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:px-6 md:text-sm">
                    Email
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:px-6 md:text-sm">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:px-6 md:text-sm">
                    Gender
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:px-6 md:text-sm">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:px-6 md:text-sm">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center md:px-6">
                      <p className="text-slate-500 text-sm">Loading...</p>
                    </td>
                  </tr>
                ) : filteredStaffs.length > 0 ? (
                  filteredStaffs.map((staff) => (
                    <tr
                      key={staff.uid}
                      className="transition-colors hover:bg-slate-50"
                    >
                      <td className="px-4 py-4 font-mono text-xs md:px-6 md:text-sm">
                        <Link
                          href={`/admin/staffs/${staff.uid}`}
                          className="rounded-lg text-xs font-medium text-slate-600 transition-colors hover:text-emerald-600 md:text-sm"
                        >
                          {staff.uid}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-xs font-medium text-slate-900 md:px-6 md:text-sm truncate">
                        {staff.fullname}
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-600 md:px-6 md:text-sm">
                        {staff.email || "—"}
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-600 md:px-6 md:text-sm">
                        {staff.phone || "—"}
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-600 md:px-6 md:text-sm capitalize">
                        {staff.gender || "—"}
                      </td>
                      <td className="px-4 py-4 md:px-6">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusBadgeClass(
                            staff.status,
                          )}`}
                        >
                          {staff.status ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-4 md:px-6">
                        <Link
                          href={`/admin/staffs/${staff.uid}`}
                          className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center md:px-6">
                      <p className="text-slate-500 text-sm">
                        No staffs found
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
                staffs
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, meta.page - 1))}
                  disabled={meta.page <= 1}
                  className={`rounded-lg p-2 transition-colors ${
                    meta.page <= 1
                      ? "cursor-not-allowed bg-slate-50 text-slate-300"
                      : "text-emerald-600 hover:bg-emerald-50"
                  }`}
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="hidden md:flex items-center gap-1">
                  {pages.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                        p === meta.page
                          ? "bg-emerald-600 text-white"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
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
                  className={`rounded-lg p-2 transition-colors ${
                    meta.page >= meta.totalPages
                      ? "cursor-not-allowed bg-slate-50 text-slate-300"
                      : "text-emerald-600 hover:bg-emerald-50"
                  }`}
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
