"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createRecruitment, FormState } from "@/lib/services/recruitment";
import bankList from "@/lib/jsons/banklist.json";

type NigeriaState = {
    state: string;
    alias: string;
    lgas: string[];
};

type BankOption = {
    id: number;
    name: string;
    code: string;
    active: boolean;
    is_deleted: boolean;
};

export default function RecruitmentPortalPage() {
    const [states, setStates] = useState<NigeriaState[]>([]);
    const [loadingStates, setLoadingStates] = useState(true);
    const [form, setForm] = useState<FormState>({
        fullname: "",
        email: "",
        phone: "",
        gender: "",
        state: "",
        lga: "",
        address: "",
        isCopper: "",
        accountNumber: "",
        bank: "",
        accountName: "",
        dob: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    useEffect(() => {
        const loadStates = async () => {
            try {
                const response = await fetch("/Json/nigeria-state-and-lgas.json");
                const data = await response.json();
                setStates(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Failed to load Nigeria states", error);
                setStates([]);
            } finally {
                setLoadingStates(false);
            }
        };

        loadStates();
    }, []);

    const selectedState = useMemo(
        () => states.find((item) => item.state === form.state) || null,
        [form.state, states],
    );

    const lgaOptions = useMemo(() => selectedState?.lgas || [], [selectedState]);

    const bankOptions = useMemo(
        () =>
            (bankList as BankOption[])
                .filter((bank) => bank.active && !bank.is_deleted)
                .sort((a, b) => a.name.localeCompare(b.name)),
        [],
    );

    useEffect(() => {
        setForm((current) =>
            current.lga && !lgaOptions.includes(current.lga)
                ? { ...current, lga: "" }
                : current,
        );
    }, [lgaOptions]);

    const handleChange = (
        key: keyof FormState,
        value: string,
    ) => {
        setForm((current) => ({ ...current, [key]: value }));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setSubmitError("");
        setSubmitting(true);

        try {
            await createRecruitment({
                fullname: form.fullname,
                email: form.email,
                phone: form.phone,
                gender: form.gender,
                state: form.state,
                lga: form.lga,
                address: form.address,
                isCopper: form.isCopper,
                accountNumber: form.accountNumber,
                bank: form.bank,
                accountName: form.accountName,
                dob: form.dob,
            });

            setShowSuccessModal(true);
            setForm({
                fullname: "",
                email: "",
                phone: "",
                gender: "",
                state: "",
                lga: "",
                address: "",
                isCopper: "",
                accountNumber: "",
                bank: "",
                accountName: "",
                dob: "",
            });
        } catch (error: any) {
            setSubmitError(error?.message || "Failed to submit application. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-emerald-50 via-white to-cyan-50 text-slate-800">
            <header className="border-b border-emerald-100 bg-white/90 backdrop-blur-md">
                <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 md:px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-200 bg-white shadow-sm">
                            <Image src="/icon.png" alt="Unified Revenue logo" width={28} height={28} />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-slate-900 md:text-xl">Recruitment Portal</p>
                            <p className="text-sm text-slate-500">Unified Revenue Management System</p>
                        </div>
                    </div>

                    <Link
                        href="/"
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                        Back Home
                    </Link>
                </div>
            </header>

            <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-14">
                <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-xl md:p-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                        Apply Now
                    </p>
                    <h1 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">
                        Recruitment form for field operations
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                        Complete your application below to be considered for the Unified Revenue Management System recruitment program.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
                        <div className="grid gap-5 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="fullname">
                                    Full Name
                                </label>
                                <input
                                    id="fullname"
                                    type="text"
                                    value={form.fullname}
                                    onChange={(event) => handleChange("fullname", event.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none appearance-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                                    placeholder="Enter full name"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="email">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={form.email}
                                    onChange={(event) => handleChange("email", event.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none appearance-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                                    placeholder="you@example.com"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="phone">
                                    Phone Number
                                </label>
                                <input
                                    id="phone"
                                    type="tel"
                                    value={form.phone}
                                    onChange={(event) => handleChange("phone", event.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none appearance-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                                    placeholder="08012345678"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="gender">
                                    Gender
                                </label>
                                <select
                                    id="gender"
                                    value={form.gender}
                                    onChange={(event) => handleChange("gender", event.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none appearance-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                                >
                                    <option value="" hidden>Select gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="state">
                                    State of Residence
                                </label>
                                <select
                                    id="state"
                                    value={form.state}
                                    onChange={(event) => handleChange("state", event.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none appearance-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                                    disabled={loadingStates}
                                >
                                    <option value="" hidden>{loadingStates ? "Loading states..." : "Select state"}</option>
                                    {states.map((item) => (
                                        <option key={item.alias} value={item.state}>
                                            {item.state}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="lga">
                                    LGA of Residence
                                </label>
                                <select
                                    id="lga"
                                    value={form.lga}
                                    onChange={(event) => handleChange("lga", event.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none appearance-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                                    disabled={!form.state}
                                >
                                    <option value="" hidden>{form.state ? "Select LGA" : "Select state first"}</option>
                                    {lgaOptions.map((lga) => (
                                        <option key={lga} value={lga}>
                                            {lga}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="address">
                                    Address
                                </label>
                                <input
                                    id="address"
                                    value={form.address}
                                    onChange={(event) => handleChange("address", event.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none appearance-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                                    placeholder="Enter residential address"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="isCopper">
                                    Are you a copper?
                                </label>
                                <select
                                    id="isCopper"
                                    value={form.isCopper}
                                    onChange={(event) => handleChange("isCopper", event.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none appearance-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                                >
                                    <option value="" hidden>Select an option</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="bank">
                                    Bank Name
                                </label>
                                <select
                                    id="bank"
                                    value={form.bank}
                                    onChange={(event) => handleChange("bank", event.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none appearance-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                                >
                                    <option value="" hidden>Select bank</option>
                                    {bankOptions.map((bank) => (
                                        <option key={`${bank.id}-${bank.code}`} value={bank.name}>
                                            {bank.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="accountNumber">
                                    Account Number
                                </label>
                                <input
                                    id="accountNumber"
                                    type="text"
                                    value={form.accountNumber}
                                    onChange={(event) => handleChange("accountNumber", event.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none appearance-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                                    placeholder="Enter account number"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="accountName">
                                    Account Name
                                </label>
                                <input
                                    id="accountName"
                                    type="text"
                                    value={form.accountName}
                                    onChange={(event) => handleChange("accountName", event.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none appearance-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                                    placeholder="Enter account name"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="dob">
                                    Date of Birth
                                </label>
                                <input
                                    id="dob"
                                    type="date"
                                    value={form.dob}
                                    onChange={(event) => handleChange("dob", event.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none appearance-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 uppercase"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                            >
                                {submitting ? "Submitting..." : "Submit Application"}
                            </button>
                            <p className="text-sm text-slate-500">
                                All fields are required before submission.
                            </p>
                        </div>

                        {submitError && (
                            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                                {submitError}
                            </div>
                        )}
                    </form>
                </div>
            </main>

            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
                    <div className="w-full max-w-md rounded-2xl border border-emerald-100 bg-white p-6 shadow-2xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                            Successful Sign Up
                        </p>
                        <h2 className="mt-2 text-2xl font-bold text-slate-900">
                            Welcome onboard
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                            You have successfully signed up for the Amac Revenue Management System (ARMS).
                        </p>

                        <div className="mt-6 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setShowSuccessModal(false)}
                                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
