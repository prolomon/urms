"use client";

import { useEffect, useState } from "react";

const COOKIE_CONSENT_KEY = "urms_cookie_consent";
const CONSENT_STATUS = {
	ACCEPTED: "accepted",
	DECLINED: "declined",
};

export function useCookieConsent() {
	const [consent, setConsent] = useState(null);
	const [isReady, setIsReady] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") return;

		try {
			const savedConsent = window.localStorage.getItem(COOKIE_CONSENT_KEY);
			if (
				savedConsent === CONSENT_STATUS.ACCEPTED ||
				savedConsent === CONSENT_STATUS.DECLINED
			) {
				setConsent(savedConsent);
			}
		} catch (error) {
			console.warn("Unable to read cookie consent from localStorage", error);
		} finally {
			setIsReady(true);
		}
	}, []);

	const persistConsent = (value) => {
		setConsent(value);

		if (typeof window === "undefined") return;

		try {
			window.localStorage.setItem(COOKIE_CONSENT_KEY, value);
		} catch (error) {
			console.warn("Unable to save cookie consent to localStorage", error);
		}
	};

	const resetCookieConsent = () => {
		setConsent(null);

		if (typeof window === "undefined") return;

		try {
			window.localStorage.removeItem(COOKIE_CONSENT_KEY);
		} catch (error) {
			console.warn("Unable to reset cookie consent in localStorage", error);
		}
	};

	return {
		consent,
		isReady,
		isVisible: isReady && consent === null,
		hasAccepted: consent === CONSENT_STATUS.ACCEPTED,
		hasDeclined: consent === CONSENT_STATUS.DECLINED,
		acceptCookies: () => persistConsent(CONSENT_STATUS.ACCEPTED),
		declineCookies: () => persistConsent(CONSENT_STATUS.DECLINED),
		resetCookieConsent,
	};
}
