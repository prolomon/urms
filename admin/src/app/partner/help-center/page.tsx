import { BookOpenText, CircleHelp, LifeBuoy, Mail, MessageSquare, PhoneCall, ShieldCheck, Wrench } from "lucide-react";

const faqs = [
	{
		question: "How do I update member details?",
		answer:
			"Open the member profile from the Entities section, click Edit, update the fields, and save changes. Ensure required fields like type, category, and contact details are valid before submitting.",
	},
	{
		question: "Why is a wallet not showing for a member?",
		answer:
			"Wallet data may not appear if the member profile has not been fully provisioned yet. Refresh the page and verify the member UID is valid. If the issue persists, contact support.",
	},
	{
		question: "How can I reset my password or security code?",
		answer:
			"Go to Security in the admin panel. You can update your password and security code directly, or use the Forgot Password and Forgot Secure Code actions for assisted reset.",
	},
	{
		question: "Can I export recruitment or payment data?",
		answer:
			"Yes. Use the Download CSV action on supported pages like Recruitment and payment record views to export current records for reporting.",
	},
	{
		question: "What should I do if a page keeps failing to load?",
		answer:
			"Use the retry action on the page first. If the error remains, check your internet connection and then contact technical support with a short description of the issue.",
	},
];

export default function HelpCenterPage() {
	return (
		<div className="space-y-4 p-4 md:p-6">
			<div className="rounded-2xl bg-linear-to-r from-emerald-50 via-white to-cyan-50 p-5 md:p-6 ring-1 ring-emerald-100">
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div>
						<h1 className="text-2xl md:text-3xl font-bold text-slate-800">Help Center</h1>
						<p className="mt-1 text-sm text-slate-600 md:text-base">
							Find guidance, common answers, and support channels for daily admin operations.
						</p>
					</div>
					<div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-slate-600 ring-1 ring-slate-200">
						<ShieldCheck className="h-4 w-4 text-emerald-600" />
						Support and troubleshooting
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
				<div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
					<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
						<BookOpenText className="h-5 w-5" />
					</div>
					<h3 className="mt-3 text-base font-semibold text-slate-900">Guides</h3>
					<p className="mt-1 text-sm text-slate-600">Step-by-step support for members, payments, and account setup.</p>
				</div>

				<div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
					<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
						<CircleHelp className="h-5 w-5" />
					</div>
					<h3 className="mt-3 text-base font-semibold text-slate-900">FAQs</h3>
					<p className="mt-1 text-sm text-slate-600">Quick answers to frequently asked admin questions.</p>
				</div>

				<div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
					<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
						<Wrench className="h-5 w-5" />
					</div>
					<h3 className="mt-3 text-base font-semibold text-slate-900">Troubleshooting</h3>
					<p className="mt-1 text-sm text-slate-600">Actionable checks for wallet, security, and page errors.</p>
				</div>

				<div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
					<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
						<LifeBuoy className="h-5 w-5" />
					</div>
					<h3 className="mt-3 text-base font-semibold text-slate-900">Support</h3>
					<p className="mt-1 text-sm text-slate-600">Reach out to the team when you need direct assistance.</p>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
				<div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-2">
					<div className="flex items-center gap-2">
						<MessageSquare className="h-5 w-5 text-emerald-600" />
						<h2 className="text-lg font-semibold text-slate-900">Frequently Asked Questions</h2>
					</div>

					<div className="mt-4 space-y-3">
						{faqs.map((faq) => (
							<details key={faq.question} className="group rounded-xl border border-slate-200 bg-slate-50/70 p-4">
								<summary className="cursor-pointer list-none text-sm font-semibold text-slate-800">
									{faq.question}
								</summary>
								<p className="mt-2 text-sm leading-6 text-slate-600">{faq.answer}</p>
							</details>
						))}
					</div>
				</div>

				<div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
					<h2 className="text-lg font-semibold text-slate-900">Contact Support</h2>
					<p className="mt-1 text-sm text-slate-600">
						If you need technical help, contact support through any channel below.
					</p>

					<div className="mt-4 space-y-3">
						<a
							href="mailto:support@krms.ng"
							className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
						>
							<Mail className="h-4 w-4 text-emerald-600" />
							support@krms.ng
						</a>

						<a
							href="tel:+2348000000000"
							className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
						>
							<PhoneCall className="h-4 w-4 text-emerald-600" />
							+234 800 000 0000
						</a>
					</div>

					<div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
						<p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Support Hours</p>
						<p className="mt-1 text-sm text-slate-700">Monday - Friday</p>
						<p className="text-sm text-slate-700">8:00 AM - 6:00 PM</p>
					</div>
				</div>
			</div>
		</div>
	);
}
