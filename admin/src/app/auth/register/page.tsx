"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createAdmin } from "@/lib/services/admin";
import type { Admin, AdminLocation, CreateAdminInput } from "@/lib/services/admin";
import stateAndLgasData from "@/lib/jsons/state_and_lgas.json";

type StateLgaMap = Record<string, string[]>;

const stateLgaMap = stateAndLgasData as StateLgaMap;

type RegisterForm = {
	center: string;
	email: string;
	password: string;
	phone: string;
	adminName: string;
	adminEmail: string;
	adminPhone: string;
	adminLocation: string;
	location: AdminLocation | null;
	state: string;
	address: string;
	lga: string;
	country: string;
};

const initialForm: RegisterForm = {
	center: "",
	email: "",
	password: "",
	phone: "",
	adminName: "",
	adminEmail: "",
	adminPhone: "",
	adminLocation: "",
	location: null,
	state: "",
	address: "",
	lga: "",
	country: "Nigeria",
};

import { getLocation } from "@/lib/services/location";

export default function RegisterPage() {
	const router = useRouter();
	const [form, setForm] = useState<RegisterForm>(initialForm);
	const [submitting, setSubmitting] = useState(false);
	const [locating, setLocating] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const states = useMemo(
		() => Object.keys(stateLgaMap).sort((a, b) => a.localeCompare(b)),
		[],
	);
	const [suggestions, setSuggestions] = useState([]);
	const [adminSuggestions, setAdminSuggestions] = useState([]);

	const lgas = useMemo(
		() => (form.state ? stateLgaMap[form.state] ?? [] : []),
		[form.state],
	);

	type StringField = Exclude<keyof RegisterForm, "location">;

	const updateField = (
		field: StringField,
		value: string,
	) => {
		setForm((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleStateChange = (value: string) => {
		setForm((prev) => ({
			...prev,
			state: value,
			lga: "",
		}));
	};

	const updateLocation = (location: AdminLocation | null) => {
		setForm((prev) => ({
			...prev,
			location,
		}));
	};

	const getCurrentLocation = () => {
		setError("");

		if (typeof navigator === "undefined" || !navigator.geolocation) {
			setError("Geolocation is not supported on this browser.");
			return;
		}

		setLocating(true);

		navigator.geolocation.getCurrentPosition(
			(position) => {
				const location: AdminLocation = {
					latitude: Number(position.coords.latitude.toFixed(6)),
					longitude: Number(position.coords.longitude.toFixed(6)),
					accuracy: Number(position.coords.accuracy.toFixed(2)),
				};
				updateLocation(location);
				setLocating(false);
			},
			(geoError) => {
				let message = "Unable to get your location.";
				if (geoError.code === geoError.PERMISSION_DENIED) {
					message = "Location permission denied. Please allow location access and try again.";
				} else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
					message = "Location information is unavailable.";
				} else if (geoError.code === geoError.TIMEOUT) {
					message = "Location request timed out. Try again.";
				}
				setError(message);
				setLocating(false);
			},
			{
				enableHighAccuracy: true,
				timeout: 10000,
				maximumAge: 0,
			},
		);
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError("");
		setSuccess("");

		if (!form.location) {
			setError("Location is required. Click 'Use current location' before submitting.");
			return;
		}

		const payload: Admin = {
			center: form.center.trim(),
			email: form.email.trim(),
			location: form.location,
			state: form.state,
			address: form.address.trim(),
			lga: form.lga,
			country: form.country,
			phone: form.phone.trim(),
			adminName: form.adminName.trim(),
			adminEmail: form.adminEmail.trim(),
			adminPhone: form.adminPhone.trim(),
			adminLocation: form.adminLocation.trim(),

		};

		setSubmitting(true);

		try {
			await createAdmin(payload);
			setSuccess("Admin account created successfully.");
			setForm(initialForm);
			setTimeout(() => {
				router.push("/");
			}, 900);
		} catch (submissionError) {
			const message =
				submissionError instanceof Error
					? submissionError.message
					: "Failed to create admin account";
			setError(message);
		} finally {
			setSubmitting(false);
		}
	};

	const handleLocationChange = async (value: string) => {
		updateField("address", value);

		if (!value?.trim()) {
			setSuggestions([]);
			return;
		}

		try {
			const res = await getLocation({ query: value, limit: 30 });
			setSuggestions(res || []);
		} catch (e) {
			console.error("Failed to fetch locations", e);
			setSuggestions([]);
		}
	};

	const handleAdminLocationChange = async (value: string) => {
		updateField("adminLocation", value);

		if (!value?.trim()) {
			setAdminSuggestions([]);
			return;
		}

		try {
			const res = await getLocation({ query: value, limit: 30 });
			setAdminSuggestions(res || []);
		} catch (e) {
			console.error("Failed to fetch locations", e);
			setAdminSuggestions([]);
		}
	};

	return (
		<div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-emerald-50 py-10 px-4 sm:px-8">
			<div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-xl sm:p-10">
				<div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<h1 className="text-3xl font-bold tracking-tight text-slate-900">
							Create Admin Account
						</h1>
						<p className="mt-1 text-sm text-slate-500">
							Fill the form with your registration details.
						</p>
					</div>
					<Link
						href="/"
						className="text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
					>
						Back to login
					</Link>
				</div>

				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div className="sm:col-span-2">
							<label htmlFor="center" className="mb-1 block text-sm font-medium text-slate-700">
								Center Name
							</label>
							<input
								id="center"
								name="center"
								type="text"
								required
								value={form.center}
								onChange={(event) => updateField("center", event.target.value)}
								className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 appearance-none"
								placeholder="Main Office"
							/>
						</div>

						<div>
							<label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
								Center Email
							</label>
							<input
								id="email"
								name="email"
								type="email"
								required
								value={form.email}
								onChange={(event) => updateField("email", event.target.value)}
								className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 appearance-none"
								placeholder="admin@company.com"
							/>
						</div>

						<div>
							<label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
								Center phone Number
							</label>
							<input
								id="phone"
								name="phone"
								type="tel"
								required
								value={form.phone}
								onChange={(event) => updateField("phone", event.target.value)}
								className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-12 text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 appearance-none"
								placeholder="Enter center phone number"
							/>
						</div>

						<div>
							<label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
								Admin Name
							</label>
							<input
								id="adminName"
								name="adminName"
								type="text"
								required
								value={form.adminName}
								onChange={(event) => updateField("adminName", event.target.value)}
								className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-12 text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 appearance-none"
								placeholder="Enter admin name"
							/>
						</div>

						<div>
							<label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
								Admin Email
							</label>
							<input
								id="adminEmail"
								name="adminEmail"
								type="email"
								required
								value={form.adminEmail}
								onChange={(event) => updateField("adminEmail", event.target.value)}
								className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-12 text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 appearance-none"
								placeholder="Enter admin email"
							/>
						</div>

						<div>
							<label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
								Admin phone Number
							</label>
							<input
								id="adminPhone"
								name="adminPhone"
								type="tel"
								required
								value={form.adminPhone}
								onChange={(event) => updateField("adminPhone", event.target.value)}
								className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-12 text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 appearance-none"
								placeholder="Enter admin phone number"
							/>
						</div>

						<div className="relative">
							<label htmlFor="address" className="mb-1 block text-sm font-medium text-slate-700">
								Admin Address
							</label>
							<input
								id="adminLocation"
								name="adminLocation"
								type="text"
								required
								value={form.adminLocation}
								onChange={(event) => handleAdminLocationChange(event.target.value)}
								className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 appearance-none"
							/>

							<div className="absolute top-full left-0 right-0 z-10">
								{adminSuggestions.length > 0 && (
									<div className="border border-emerald-500 rounded-lg mt-1 max-h-40 overflow-y-auto bg-white p-2">
										{adminSuggestions.map((suggestion) => (
											<div
												key={suggestion.id}
												className="px-4 py-2 hover:bg-emerald-500 hover:text-white cursor-pointer text-slate-700 rounded-lg"
												onClick={() => {
													updateField("adminLocation", suggestion.name);
													setAdminSuggestions([]);
												}}
											>
												{suggestion.name}
											</div>
										))}
									</div>
								)}
							</div>
						</div>

						<div className="sm:col-span-2">
							<div className="mb-1 flex items-center justify-between">
								<label htmlFor="latitude" className="block text-sm font-medium text-slate-700">
									Location (Geolocation)
								</label>
								<div className="flex items-center gap-2">
									<button
										type="button"
										onClick={getCurrentLocation}
										disabled={locating}
										className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
									>
										{locating ? "Getting location..." : "Use current location"}
									</button>
									{form.location && (
										<button
											type="button"
											onClick={() => updateLocation(null)}
											className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
										>
											Clear
										</button>
									)}
								</div>
							</div>

							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div>
									<input
										id="latitude"
										name="latitude"
										type="text"
										required
										readOnly
										value={form.location ? String(form.location.latitude) : ""}
										className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-slate-900 outline-none appearance-none"
										placeholder="Latitude"
									/>
								</div>
								<div>
									<input
										id="longitude"
										name="longitude"
										type="text"
										required
										readOnly
										value={form.location ? String(form.location.longitude) : ""}
										className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-slate-900 outline-none appearance-none"
										placeholder="Longitude"
									/>
								</div>
							</div>

							<p className="mt-2 text-xs text-slate-500">
								Tap &apos;Use current location&apos; to populate latitude and longitude.
							</p>
						</div>

						<div>
							<label htmlFor="state" className="mb-1 block text-sm font-medium text-slate-700">
								State
							</label>
							<select
								id="state"
								name="state"
								required
								value={form.state}
								onChange={(event) => handleStateChange(event.target.value)}
								className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 appearance-none"
							>
								<option value="">Select state</option>
								{states.map((stateName) => (
									<option key={stateName} value={stateName}>
										{stateName}
									</option>
								))}
							</select>
						</div>

						<div>
							<label htmlFor="lga" className="mb-1 block text-sm font-medium text-slate-700">
								LGA
							</label>
							<select
								id="lga"
								name="lga"
								required
								disabled={!form.state}
								value={form.lga}
								onChange={(event) => updateField("lga", event.target.value)}
								className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 appearance-none"
							>
								<option value="">{form.state ? "Select LGA" : "Select state first"}</option>
								{lgas.map((lgaName) => (
									<option key={lgaName} value={lgaName}>
										{lgaName}
									</option>
								))}
							</select>
						</div>

						<div className="sm:col-span-2 relative">
							<label htmlFor="address" className="mb-1 block text-sm font-medium text-slate-700">
								Address
							</label>
							<input
								id="address"
								name="address"
								type="text"
								required
								value={form.address}
								onChange={(event) => handleLocationChange(event.target.value)}
								className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 appearance-none"
							/>
							<div className="absolute top-full left-0 right-0 z-10">
								{suggestions.length > 0 && (
									<div className="border border-emerald-500 rounded-lg mt-1 max-h-40 overflow-y-auto bg-white p-2">
										{suggestions.map((suggestion) => (
											<div
												key={suggestion.id}
												className="px-4 py-2 hover:bg-emerald-500 hover:text-white cursor-pointer text-slate-700 rounded-lg"
												onClick={() => {
													updateField("address", suggestion.name);
													setSuggestions([]);
												}}
											>
												{suggestion.name}
											</div>
										))}
									</div>
								)}
							</div>
						</div>

						<div className="sm:col-span-2">
							<label htmlFor="country" className="mb-1 block text-sm font-medium text-slate-700">
								Country
							</label>
							<select
								id="country"
								name="country"
								required
								value={form.country}
								onChange={(event) => updateField("country", event.target.value)}
								className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 appearance-none"
							>
								<option value="Nigeria">Nigeria</option>
							</select>
						</div>
					</div>

					{error && (
						<div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
							{error}
						</div>
					)}

					{success && (
						<div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
							{success}
						</div>
					)}

					<button
						type="submit"
						disabled={submitting}
						className="w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
					>
						{submitting ? "Creating account..." : "Create account"}
					</button>
				</form>
			</div>
		</div>
	);
}
