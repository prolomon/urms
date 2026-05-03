"use client";

import Link from "next/link";

type ErrorPageProps = {
	error: Error & { digest?: string };
	reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
	return (
		<div className="min-h-screen bg-linear-to-br from-emerald-50 via-white to-cyan-50 px-4 py-10">
			<div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-3xl items-center justify-center">
				<div className="w-full rounded-3xl border border-emerald-100 bg-white p-6 shadow-2xl md:p-10">
					<div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
						<div className="max-w-xl">
							<p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
								Something went wrong
							</p>
							<h1 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">
								We could not load this page.
							</h1>
							<p className="mt-4 text-base leading-7 text-slate-600 md:text-lg">
								The application ran into an unexpected problem. You can try again now or return to the home page and continue from there.
							</p>

							<div className="mt-6 flex flex-wrap gap-3">
								<button
									onClick={reset}
									className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
								>
									Try again
								</button>
								<Link
									href="/"
									className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
								>
									Go to home
								</Link>
							</div>

							{process.env.NODE_ENV === "development" && (
								<div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4">
									<p className="text-xs font-semibold uppercase tracking-wide text-rose-700">
										Debug details
									</p>
									  <p className="mt-2 wrap-break-word text-sm text-rose-800">
										{error.message}
									</p>
								</div>
							)}
						</div>

						<div className="flex shrink-0 items-center justify-center rounded-3xl bg-linear-to-br from-emerald-500 to-cyan-500 p-6 text-white shadow-lg md:min-h-55 md:w-64">
							<div className="text-center">
								<div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/10 text-3xl font-black">
									!
								</div>
								<p className="mt-4 text-lg font-semibold">Oops</p>
								<p className="mt-1 text-sm text-white/85">
									Please retry or return to the dashboard.
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
