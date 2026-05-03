"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

const navLinks = [
  { label: "Overview", href: "#overview" },
  { label: "Wallet", href: "#wallet" },
  { label: "Recruitment", href: "#recruitment" },
  { label: "Features", href: "#features" },
  { label: "Contact", href: "#contact" },
];

export default function LandingPage() {

  return (
    <div className="min-h-screen bg-linear-to-b from-emerald-50 via-white to-cyan-50 text-slate-800">
      <header className="sticky top-0 z-40 border-b border-emerald-100/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <a href="#overview" className="flex items-center gap-2.5">
            <div className="rounded-xl border border-emerald-300 bg-white p-1 shadow-sm">
              <Image src="/icon.png" alt="Karu Revenue Logo" width={34} height={34} />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight text-slate-900">Karu Revenue</p>
              <p className="text-xs text-slate-500">Management System</p>
            </div>
          </a>

          <nav className="hidden items-center gap-5 md:flex">
            {navLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-slate-600 transition-colors hover:text-emerald-700"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="recruitment-portal"
              className="hidden rounded-xl border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 sm:inline-flex"
            >
              Recruitment
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section id="overview" className="relative overflow-hidden">
          <div className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-emerald-300/30 blur-3xl" />
          <div className="absolute -right-20 bottom-4 h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl" />

          <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 md:grid-cols-2 md:items-center md:px-6 md:py-20">
            <div>
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Karu Revenue Management
              </span>
              <h1 className="mt-4 text-3xl font-bold leading-tight text-slate-900 md:text-5xl">
                Collect, monitor, and grow revenue from one connected dashboard.
              </h1>
              <p className="mt-4 text-base text-slate-600 md:text-lg">
                Manage entities, agents, wallets, and payment operations with a clear workflow built for daily execution.
              </p>
              <p className="mt-3 text-sm font-medium text-slate-700">
                The platform uses encrypted data transmission and secure access controls for operations.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/auth/login"
                  className="inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                >
                  Login to Dashboard
                </Link>
                <a
                  href="#recruitment"
                  className="inline-flex rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Join Recruitment
                </a>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Active Centers</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">24</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Agents</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">180+</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm col-span-2 sm:col-span-1">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Daily Collections</p>
                  <p className="mt-1 text-lg font-bold text-emerald-700">₦8.4M</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-emerald-100 bg-white/80 p-3 shadow-xl backdrop-blur-sm">
              <Image
                src="/revenue-hero.svg"
                alt="Revenue dashboard illustration"
                width={1200}
                height={900}
                className="h-auto w-full rounded-2xl"
                priority
              />
            </div>
          </div>
        </section>

        <section id="wallet" className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6 md:py-14">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">Wallet Balance Tracking</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">Real-time account visibility</h3>
              <p className="mt-2 text-sm text-slate-600">
                Monitor each member wallet profile and settlement flow in one place.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">Payment Operations</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">Actionable payment records</h3>
              <p className="mt-2 text-sm text-slate-600">
                Track pending, completed, and failed transactions with faster follow-up.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-emerald-700">Revenue Assurance</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">Less leakage, better reporting</h3>
              <p className="mt-2 text-sm text-slate-700">
                Built-in checks keep collection activity clean and transparent from field to office.
              </p>
            </div>
          </div>
        </section>

        <section id="recruitment" className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-10">
          <div className="rounded-3xl border border-cyan-100 bg-linear-to-r from-white via-emerald-50 to-cyan-50 p-6 shadow-sm md:p-8">
            <p className="text-xs uppercase tracking-wide text-slate-500">Recruitment</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">
              Join our field operations team
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-slate-600 md:text-base">
              We are onboarding new agents and operations support personnel across multiple locations.
            </p>
            <div className="mt-5">
              <Link
                href="/recruitment-portal"
                className="inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                Apply for Recruitment
              </Link>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6 md:py-14">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-wide text-slate-500">Features</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">Everything needed for daily revenue operations</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">Member Management</h3>
              <p className="mt-2 text-sm text-slate-600">Maintain complete entity profiles with location, category, and pricing setup.</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">Agent Allocation</h3>
              <p className="mt-2 text-sm text-slate-600">Assign and track responsible agents for each member account.</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">Pricing Control</h3>
              <p className="mt-2 text-sm text-slate-600">Upgrade and adjust pricing plans with clear billing visibility.</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">Export and Insights</h3>
              <p className="mt-2 text-sm text-slate-600">Generate payment reports and monitor trend performance across categories.</p>
            </div>
          </div>
        </section>

        <section id="contact" className="mx-auto w-full max-w-7xl px-4 pb-14 md:px-6 md:pb-20">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <p className="text-xs uppercase tracking-wide text-slate-500">Need help?</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">Talk to the Karu Revenue team</h2>
            <p className="mt-3 text-sm text-slate-600 md:text-base">Send inquiries on onboarding, operations, and system access.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href="mailto:support@afriverge.com" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
                support@afriverge.com
              </a>
              <a href="tel:+2348000000000" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
                +234 800 000 0000
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6 md:py-14">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-lg font-bold text-slate-900">Karu Revenue Management</p>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
                A connected platform for modern field operations, wallet oversight, and revenue assurance.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Quick Links</p>
              <div className="mt-4 grid gap-2 text-sm">
                <a href="#overview" className="text-slate-700 transition-colors hover:text-emerald-700">Overview</a>
                <a href="#wallet" className="text-slate-700 transition-colors hover:text-emerald-700">Wallet</a>
                <a href="#recruitment" className="text-slate-700 transition-colors hover:text-emerald-700">Recruitment</a>
                <a href="#features" className="text-slate-700 transition-colors hover:text-emerald-700">Features</a>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Support</p>
              <div className="mt-4 grid gap-2 text-sm">
                <a href="#contact" className="text-slate-700 transition-colors hover:text-emerald-700">Contact Team</a>
                <a href="mailto:support@afriverge.com" className="text-slate-700 transition-colors hover:text-emerald-700">support@afriverge.com</a>
                <a href="tel:+2348000000000" className="text-slate-700 transition-colors hover:text-emerald-700">+234 800 000 0000</a>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Portal Access</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/auth/login"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                >
                  Login
                </Link>
                <Link
                  href="/recruitment-portal"
                  className="rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
                >
                  Recruitment
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 Tr-3G. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-4">
              <a href="#" className="transition-colors hover:text-slate-700">Privacy Policy</a>
              <a href="#" className="transition-colors hover:text-slate-700">Terms of Use</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
