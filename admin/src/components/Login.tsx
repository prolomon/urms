"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { usePartner } from "@/context/PartnerContext";
import { usePathname } from "next/navigation";

export default function Login() {
    const pathname = usePathname();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const { login, loading, isAuthenticated } = useAuth();
    const { login: PartnerLogin, loading: partnerLoading } = usePartner()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setShowPassword(false);

        if (pathname !== "/auth/partner") {

            try {
                await login(email, password);
            } catch (error) {
                setError(error.message);
            }

        } else {

            try {
                await PartnerLogin(email, password);
            } catch (error) {
                setError(error.message);
            }

        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center bg-linear-to-br from-emerald-50 via-white to-indigo-100 overflow-hidden">
            {/* Decorative blurred background circles */}
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-200 rounded-full filter blur-3xl opacity-30 z-0" />
            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-200 rounded-full filter blur-3xl opacity-30 z-0" />

            <div className="relative z-10 w-full max-w-md p-8 sm:p-10 bg-white/90 rounded-2xl shadow-2xl border border-slate-100 backdrop-blur-md">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-20 h-20 bg-transparent rounded-full flex items-center justify-center mb-3 shadow-lg border border-emerald-500">
                        <Image src="/icon.png" alt="Unified Portal Logo" width={70} height={70} />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">Unified Portal</h1>
                    <p className="text-sm text-gray-500 font-medium">Revenue Management System</p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">Email address</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            disabled={loading || partnerLoading}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full px-4 py-2 mt-1 placeholder-gray-400 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 bg-slate-50 text-slate-800 transition"
                            placeholder="you@email.com"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                        <div className="relative">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading || partnerLoading}
                                className="block w-full px-4 py-2 mt-1 placeholder-gray-400 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 bg-slate-50 text-slate-800 transition pr-12"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                tabIndex={-1}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-emerald-500 focus:outline-none"
                                disabled={loading || partnerLoading}
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4.03-9-7 0-1.306.835-2.417 2.078-3.197m3.197-1.197A9.956 9.956 0 0112 5c5 0 9 4.03 9 7 0 1.306-.835 2.417-2.078 3.197M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm animate-shake">
                            {error}
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={loading || partnerLoading}
                        className="w-full flex justify-center items-center gap-2 px-4 py-2.5 text-base font-semibold text-white bg-emerald-500 rounded-lg shadow-md hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 transition disabled:bg-emerald-300 disabled:cursor-not-allowed"
                    >
                        {(loading || partnerLoading) && (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                        )}
                        {(loading || partnerLoading) ? "Logging in..." : "Login"}
                    </button>
                </form>

                <div className="mt-6 text-center text-xs text-slate-400">&copy; {new Date().getFullYear()} TR3G. All rights reserved.</div>
            </div>
        </div>
    );
}
