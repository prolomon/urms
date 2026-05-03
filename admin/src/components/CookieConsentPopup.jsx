"use client";

import { useCookieConsent } from "@/context/useCookie";

export const CookieConsentPopup = () => {
  const { isVisible, acceptCookies, declineCookies } = useCookieConsent();

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-4 z-100 px-4">
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur-md">
        <div className="p-5 sm:p-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-flex h-7 items-center rounded-full bg-emerald-100 px-3 text-xs font-semibold text-emerald-700">
              Cookie preferences
            </span>
          </div>

          <h3 className="mb-2 text-lg font-bold text-slate-900">
            Help us improve your experience
          </h3>

          <p className="text-sm leading-6 text-slate-600">
            We use cookies to remember your preferences and improve dashboard
            performance. Do you want to accept cookies?
          </p>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={declineCookies}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Decline
            </button>
            <button
              type="button"
              onClick={acceptCookies}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
            >
              Accept cookies
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
