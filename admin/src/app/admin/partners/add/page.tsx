"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { createCompany, Company } from "@/lib/services/company";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getBanks } from "@/lib/services/wallet";
import { useWallet } from "@/context/WalletContext";

export default function AddPartnerPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toasts, setToasts] = useState<
    { id: number; type: string; message: string }[]
  >([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bank, setBank] = useState<{ bankName: string; accountNumber: string; bankCode: string; accountName: string }>({
    bankName: "",
    accountNumber: "",
    bankCode: "",
    accountName: "",
  })
  const { resolveBankAccount } = useWallet();

  const [bankList, setBankList] = useState<{ code: string, logo: string, name: string, nipCode: null }[]>([]);

  const fetchBanks = useCallback(async () => {
    try {
      const data = await getBanks();

      if (data.ok && data.banks) {
        setBankList(data.banks?.data);
      }

    } catch (e) {
      console.log(e?.error || e?.message || "Failed to fetch banks");
    }
  }, []);

  useEffect(() => {
    fetchBanks();
  }, [fetchBanks]);

  const fetchBankAccountName = useCallback(async (accountNumber: string, bankCode: string) => {
    try {
      const resolve = await resolveBankAccount(accountNumber, bankCode);

      if (resolve?.ok === false) {
        setError(resolve?.message || "Failed to resolve bank account");
        return;
      }

      // Handle both response formats: { data: { accountName } } and direct { accountName }
      const accountName = resolve?.data?.accountName || resolve?.accountName || "";
      if (accountName) {
        setBank(prev => ({ ...prev, accountName: accountName }));
        setError(null);
      } else {
        addToast("error", "Account name not found. Please verify the account details.");
        setError("Account name not found. Please verify the account details.");
      }
    } catch (err) {
      addToast("error", "Account name not found. Please verify the account details.");
      console.log("Error fetching account name:", err);
      setError("Failed to resolve bank account. Please try again.");
    }

  }, [resolveBankAccount]);

  //Automatically get account name
  useEffect(() => {
    if (bank.accountNumber.length > 10 || bank.accountNumber.length < 10 && !bank.bankCode) {
      return;
    }

    fetchBankAccountName(bank.accountNumber, bank.bankCode);

  }, [fetchBankAccountName, bank.accountNumber, bank.bankCode]);

  const [formData, setFormData] = useState<Omit<Company, "id" | "uid" | "role">>({
    name: "",
    email: "",
    phone: "",
    location: "",
    category: "",
  });

  const addToast = (type: "success" | "error", message: string, ttl = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((s) => [...s, { id, type, message }]);
    setTimeout(() => setToasts((s) => s.filter((t) => t.id !== id)), ttl);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setAvatarFile(file);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!formData.name || !formData.email || !formData.phone) {
        addToast("error", "Please fill in all required fields");
        setLoading(false);
        return;
      }

      const payload = {
        ...formData,
        center: user?.uid,
      };

      await createCompany(payload, bank);

      addToast("success", "Partner created successfully");
      setTimeout(() => router.push("/admin/partners"), 1500);
    } catch (err: any) {
      setError(err.message || "An error occurred");
      addToast("error", err.message || "Failed to create partner");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto space-y-4 p-4 md:space-y-5 md:p-6">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-lg px-4 py-3 text-sm font-medium ${toast.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200"
              }`}
          >
            {toast.message}
          </div>
        ))}
      </div>

      <div className="w-full overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-xl font-bold text-slate-900">Add New Partner</h2>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div className="grid gap-4 md:grid-cols-2">

            {/* Partner Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Partner Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Acme Corporation"
                required
                className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="e.g., info@acme.com"
                required
                className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="e.g., +234 800 000 0000"
                required
                className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., Lagos, Nigeria"
                className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
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

            {/* Avatar */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Partner Logo/Avatar
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
              <p className="mt-2 text-xs text-slate-500">
                {avatarFile ? `Selected: ${avatarFile.name}` : "No file selected"}
              </p>
            </div>

            {/* account number */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Account Number
              </label>
              <input
                type="text"
                name="accountNumber"
                value={bank.accountNumber}
                onChange={(e) => setBank(prev => ({ ...prev, accountNumber: e.target.value }))}
                placeholder="e.g., 1234567890"
                required
                className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            {/* bank name */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Bank Name
              </label>
              <select
                name="bankCode"
                value={bank.bankCode}
                onChange={(e) => {
                  const selectedCode = e.target.value;
                  const selectedBank = bankList.find((b) => b.code === selectedCode);
                  setBank(prev => ({
                    ...prev,
                    bankCode: selectedCode,
                    bankName: selectedBank?.name || ""
                  }));
                }}
                required
                className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="">Select bank</option>
                {bankList.map((bank) => (
                  <option key={bank.code} value={bank.code}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </div>

            {/* account name (auto-filled after verification) */}
            <div className="col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Account Name</label>
              <input
                type="text"
                name="name"
                value={bank.accountName}
                readOnly
                placeholder="Will auto-fill after account verification"
                className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
              {bank.accountName && (
                <p className="mt-1 text-xs text-emerald-700">Recipient verified and ready for transfer.</p>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="border-t border-slate-200 pt-5 flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Partner"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
