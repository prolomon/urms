"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    ArrowLeft,
    CheckCircle2,
    Loader2,
    Wallet,
} from "lucide-react";
import withAuth from "@/components/withAuth";
import banklist from "@/lib/jsons/banklist.json";
import { verifySecurityCode } from "@/lib/services/admin";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import { useRouter } from "next/navigation";

function WalletPage() {
    const router = useRouter();
    const [transferLoading, setTransferLoading] = useState(false);
    const [transferError, setTransferError] = useState<string | null>(null);
    const { user } = useAuth();
    const { wallet, loading, error, setUid, setCustomerCode, resolveBankAccount, createRecipient, initiateTransfer } = useWallet();
    const [recipientCode, setRecipientCode] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        accountNumber: "",
        bankCode: "",
        name: "",
        amount: "",
        reason: "",
        pin: "",
    });

    const handleCancel = () => {
        setFormData({
            accountNumber: "",
            bankCode: "",
            name: "",
            amount: "",
            reason: "",
            pin: "",
        });

        router.push("/admin/wallet");
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (name === "accountNumber" || name === "bankCode") {
            setRecipientCode(null);
            if (name === "accountNumber") {
                setFormData((prev) => ({ ...prev, name: "", accountNumber: value }));
            }
        }

        setSuccess(false);
        setTransferError(null);
    };

    const fetchBankAccountName = useCallback(async (accountNumber: string, bankCode: string) => {
        const resolve = await resolveBankAccount(accountNumber, bankCode);

        if (resolve.ok) {
            setFormData(prev => ({ ...prev, name: resolve?.data?.account_name || "" }));

            const getRecipient = await createRecipient(resolve.data.account_name, accountNumber, bankCode);

            console.log("Recipient creation response:", getRecipient);

            if (getRecipient.ok) {
                setRecipientCode(getRecipient.data?.recipient_code || null);
            } else {
                setTransferError(getRecipient.message || "Failed to create recipient");
                setRecipientCode(null);
            }

            return;
        }

        setTransferError(resolve.message || "Failed to resolve bank account");

    }, [createRecipient, resolveBankAccount]);

    //Automatically get account name
    useEffect(() => {
        if (formData.accountNumber.length > 10 || formData.accountNumber.length < 10) {
            return;
        }

        if (!formData.bankCode) {
            setTransferError("Select the bank to resolve account name");
            return;
        }

        fetchBankAccountName(formData.accountNumber, formData.bankCode);
    }, [fetchBankAccountName, formData.accountNumber, formData.bankCode]);

    useEffect(() => {
        if (user) {
            setCustomerCode(user.paystackCustomerCode ?? user.customerCode ?? null);
            setUid(user.uid);
        } else {
            setCustomerCode(null);
            setUid(null);
        }
    }, [setCustomerCode, setUid, user]);

    // This is the function to handle transfer, we can connect this to the payout API later
    const handleTransfer = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setTransferError(null);
        setSuccess(false);
        setTransferLoading(true);
        try {
            if (!recipientCode) {
                setTransferError("Recipient code is not available. Please check the account details.");
                return;
            }

            if (!formData.amount || Number(formData.amount) <= 0) {
                setTransferError("Enter a valid amount to transfer");
                return;
            }

            if (formData.pin) {
                const res = await verifySecurityCode(user?.uid || "", formData.pin);

                if (!res.ok) {
                    setTransferError(res.message || "Invalid security code");
                    return;
                }
            }

            console.log(formData, recipientCode);

            // Here you would call the initiateTransfer function from your wallet service, passing the amount, recipientCode, and reason from the formData
            const init = await initiateTransfer(Number(formData.amount), recipientCode, formData.reason);

            if (!init.ok) {
                setTransferError("Failed to initiate transfer. Please try again.");
                return;
            }

            setSuccess(true);
            setFormData((prev) => ({
                ...prev,
                amount: "",
                reason: "",
                pin: "",
            }));

        } catch (e) {
            setTransferError("An error occurred while initiating the transfer. Please try again.");
        } finally {
            setTransferLoading(false);
        }
    };

    return (
        <div className="mx-auto max-w-7xl p-4 md:p-6 space-y-4 md:space-y-5">
            <div className="rounded-2xl bg-linear-to-r from-emerald-50 via-white to-cyan-50 ring-1 ring-emerald-100 p-5 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Transfer Funds</h1>
                        <p className="mt-1 text-sm text-slate-600">
                            Send funds from your wallet to a verified bank account.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => router.push("/admin/wallet")}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Wallet
                        </button>
                        <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 ring-1 ring-slate-200 text-sm text-slate-600">
                            <Wallet className="h-4 w-4 text-emerald-600" />
                            Secure wallet mode
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-sm md:p-6">
                <form onSubmit={handleTransfer} className="space-y-4">
                    {(error || transferError) && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700">{error || transferError}</p>
                        </div>
                    )}

                    {success && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                            <p className="text-sm text-emerald-700">Transfer initiated successfully.</p>
                        </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Account Number
                            </label>
                            <input
                                type="text"
                                name="accountNumber"
                                value={formData.accountNumber}
                                onChange={handleInputChange}
                                placeholder="e.g., 1234567890"
                                required
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 appearance-none"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Bank Name
                            </label>
                            <select
                                name="bankCode"
                                value={formData.bankCode}
                                onChange={handleInputChange}
                                required
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 appearance-none"
                            >
                                <option value="">Select bank</option>
                                {banklist.map((bank) => (
                                    <option key={bank.code} value={bank.code}>
                                        {bank.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Account Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            readOnly
                            placeholder="Will auto-fill after account verification"
                            className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 appearance-none"
                        />
                        {recipientCode && (
                            <p className="mt-1 text-xs text-emerald-700">Recipient verified and ready for transfer.</p>
                        )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Amount
                            </label>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleInputChange}
                                placeholder="300"
                                required
                                min="100"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 appearance-none"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Pin
                            </label>
                            <input
                                type="password"
                                name="pin"
                                value={formData.pin}
                                onChange={handleInputChange}
                                placeholder="Enter security pin"
                                required
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 appearance-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Narration
                        </label>
                        <textarea
                            name="reason"
                            value={formData.reason}
                            onChange={handleInputChange}
                            rows={3}
                            placeholder="Optional transfer note"
                            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 appearance-none"
                        />
                    </div>

                    <div className="flex gap-3 pt-6 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={transferLoading}
                            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors appearance-none"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || transferLoading}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:bg-emerald-400 transition-colors appearance-none"
                        >
                            {transferLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                            {transferLoading ? "Transferring..." : "Transfer Now"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default withAuth(WalletPage);
