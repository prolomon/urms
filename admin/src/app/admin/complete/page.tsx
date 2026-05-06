"use client";

import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import { Lock, ShieldCheck, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSecurityToken } from "@/lib/services/company";

export default function CompleteProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { wallet, createWallet, isExist, setUid } = useWallet();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [bvn, setBvn] = useState("");
  const [securityCode, setSecurityCode] = useState("");
  const [confirmSecurityCode, setConfirmSecurityCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [idType, setIdType] = useState<"BVN" | "NIN">("BVN");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {

    setUid(user?.uid || null);

    if (wallet) {
      router.replace("/admin/wallet");
    }
  }, [router, wallet, setUid, user?.uid])

  const success = (message: string) => {
    setToast({ type: "success", message });
    window.setTimeout(() => setToast(null), 3500);
  };

  const failed = (message: string) => {
    setToast({ type: "error", message });
    window.setTimeout(() => setToast(null), 3500);
  };

  const validationState = useMemo(() => {
    const hasWallet = wallet ? true : false;
    const hasAccountNumber = wallet?.accountNo ? true : false;
    const isActive = wallet?.status ? true : false;
    const isVerified = wallet?.verify ? true : false;

    return {
      hasWallet,
      hasAccountNumber,
      isActive,
      isVerified,
      isValid: hasWallet && hasAccountNumber && isActive && isVerified,
    };
  }, [wallet]);

  const handleValidateWallet = () => {
    if (wallet || isExist) {
      setStep(3);
    } else {
      setStep(2);
    }
  };

  const handleCreateWallet = async () => {

    setLoading(true);

    try {
      const res = await createWallet(
        user.center,
        bvn.trim(),
        "ADMIN",
        user?.uid || "",
      );

      if (res?.ok === false || res?.status === false) {
        failed(res?.message || "Wallet Creation failed");
        return;
      }

      success(res?.message || "Wallet created successfully");
      setStep(3);
    } catch (error: any) {
      failed(error?.message || "Wallet Creation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCode = async () => {
    if (!securityCode || !confirmSecurityCode) {
      failed("Enter and confirm security code");
      return;
    }

    if (securityCode.length < 4) {
      failed("Security code must be at least 4 digits");
      return;
    }

    if (securityCode !== confirmSecurityCode) {
      failed("Security code and confirmation do not match");
      return;
    }

    try {
      setLoading(true);
      const res = await createSecurityToken(user?.uid || "", securityCode, confirmSecurityCode);
      if (!res.ok) {
        failed(res.message || res?.error || "Failed to set security code");
        return;
      }

      success(res.message || "Security code set successfully");
      router.replace("/admin/wallet");
    } catch (e: any) {
      console.log(e);
      failed(e?.message || e?.error || "An error occurred while setting security code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-emerald-50 via-white to-cyan-50 px-4 py-6 text-slate-800 md:px-6 md:py-10">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="rounded-3xl border border-emerald-100 bg-white/90 p-6 shadow-xl backdrop-blur-md md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Complete Profile
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">
                Finish your account setup
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                Complete these steps to activate your account and secure your wallet profile.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">Current Step</p>
              <p className="mt-1">Step {step} of 3</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm md:p-5">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${step === 1 ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700"}`}>
            1
          </div>
          <div className="h-1 flex-1 rounded-full bg-slate-200">
            <div className={`h-1 rounded-full bg-emerald-500 ${step >= 2 ? "w-full" : "w-1/3"}`} />
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${step === 2 ? "bg-emerald-600 text-white" : step > 2 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
            2
          </div>
          <div className="h-1 flex-1 rounded-full bg-slate-200">
            <div className={`h-1 rounded-full bg-emerald-500 ${step === 3 ? "w-full" : "w-1/3"}`} />
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${step === 3 ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"}`}>
            3
          </div>
        </div>

        {toast && (
          <div
            className={`rounded-2xl border p-4 text-sm font-medium shadow-sm ${toast.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}
          >
            {toast.message}
          </div>
        )}

        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl md:p-8">
          {step === 1 ? (
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-600">
                  <Wallet size={22} />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-slate-900">Validate Wallet</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Confirm that the wallet exists, is active, and has been verified.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <StatusRow label="Wallet exists" ok={validationState.hasWallet} />
                <StatusRow label="Account number available" ok={validationState.hasAccountNumber} />
                <StatusRow label="Wallet active" ok={validationState.isActive} />
                <StatusRow label="Wallet verified" ok={validationState.isVerified} />
              </div>

              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                onClick={handleValidateWallet}
              >
                Validate Wallet
              </button>
            </div>
          ) : step === 2 ? (
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-600">
                  <ShieldCheck size={22} />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-slate-900">Verify Wallet Ownership</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Enter BVN to verify with your wallet account details.
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">Identification Type</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setIdType("BVN")}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${idType === "BVN" ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                  >
                    <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${idType === "BVN" ? "border-emerald-600" : "border-slate-300"}`}>
                      {idType === "BVN" ? <span className="h-2 w-2 rounded-full bg-emerald-600" /> : null}
                    </span>
                    <span className="font-semibold">BVN</span>
                  </button>

                  {/* <button
                    type="button"
                    onClick={() => setIdType("NIN")}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${idType === "NIN" ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                  >
                    <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${idType === "NIN" ? "border-emerald-600" : "border-slate-300"}`}>
                      {idType === "NIN" ? <span className="h-2 w-2 rounded-full bg-emerald-600" /> : null}
                    </span>
                    <span className="font-semibold">NIN</span>
                  </button> */}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{idType}</label>
                <div className="flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100">
                  <ShieldCheck size={16} className="mr-3 text-slate-400" />
                  <input
                    type="text"
                    value={bvn}
                    onChange={(e) => setBvn(e.target.value)}
                    inputMode="numeric"
                    maxLength={11}
                    placeholder={`Enter your ${idType}`}
                    className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300 mr-4"
                onClick={handleCreateWallet}
                disabled={loading}
              >
                {loading ? "Creating, Please Wait..." : "Create Wallet"}
              </button>

              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                onClick={() => setStep(1)}
              >
                Back to Wallet Validation
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-600">
                  <Lock size={22} />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-slate-900">Set Security Code</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Create a code for transfer and sensitive actions.
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Security Code</label>
                <div className="flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100">
                  <Lock size={16} className="mr-3 text-slate-400" />
                  <input
                    type="password"
                    value={securityCode}
                    onChange={(e) => setSecurityCode(e.target.value)}
                    inputMode="numeric"
                    maxLength={8}
                    placeholder="Enter code"
                    className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Confirm Security Code</label>
                <div className="flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100">
                  <Lock size={16} className="mr-3 text-slate-400" />
                  <input
                    type="password"
                    value={confirmSecurityCode}
                    onChange={(e) => setConfirmSecurityCode(e.target.value)}
                    inputMode="numeric"
                    maxLength={8}
                    placeholder="Confirm code"
                    className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300 mr-4"
                onClick={handleCreateCode}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Security Code"}
              </button>

              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                onClick={() => (validationState.isVerified ? setStep(1) : setStep(2))}
              >
                Back to Verification
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center border-b border-slate-200 py-3 last:border-b-0 last:pb-0 last:pt-3">
      <span className={`mr-3 h-2 w-2 rounded-full ${ok ? "bg-emerald-500" : "bg-rose-500"}`} />
      <span className="flex-1 text-sm font-medium text-slate-700">{label}</span>
      <span className={`text-xs font-semibold ${ok ? "text-emerald-600" : "text-rose-600"}`}>
        {ok ? "Ready" : "Pending"}
      </span>
    </div>
  );
}
