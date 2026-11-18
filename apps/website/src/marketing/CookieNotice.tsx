"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n";

/**
 * Cookie notice — information, not a consent gate.
 *
 * ## Why this is a notice and not an Accept / Reject banner
 *
 * The site sets exactly four things, all of them audited before this was
 * written:
 *
 *   `tkams_locale`      cookie, language preference, 12 months  (i18n/actions.ts)
 *   `payload-token`     cookie, session, only once signed in    (Payload auth)
 *   `payload-theme`     localStorage, light/dark                (providers/Theme)
 *   `tkams-demo-sound`  localStorage, demo sound on/off         (app-demo/sounds.ts)
 *
 * There is no Google Analytics, no pixel, no third-party tag anywhere in the
 * bundle. Under GDPR/ePrivacy — and under Cameroon's electronic communications
 * law — cookies strictly necessary to a service the user asked for, and
 * preference cookies they set themselves, do not require prior consent.
 *
 * So an "Accept / Reject" banner would be actively wrong here: it would ask
 * permission the site does not need, and imply a refusal path that cannot
 * exist (refusing the language cookie means refusing to remember the language).
 * What the law does require is that the visitor be *informed* — hence a notice
 * with one acknowledgement, and a link to the detail.
 *
 * **If a tracker is ever added, this component is no longer sufficient.** It
 * must be replaced by a real consent manager with categories, per-category
 * storage, and scripts that do not load until consent is given. Do not extend
 * this one with a checkbox; the difference is legal, not cosmetic.
 *
 * ## Implementation notes
 *
 * The dismissal is stored in localStorage rather than in a cookie, deliberately:
 * setting a cookie to record that someone read a notice about cookies is a
 * small absurdity, and localStorage is not sent with requests.
 *
 * It renders nothing until mounted. Server-rendering a banner that a returning
 * visitor has already dismissed would flash it on every page load.
 */

const STORAGE_KEY = "tk-cookie-notice";

export function CookieNotice({ locale }: { locale: Locale }) {
	const en = locale === "en";
	/** `null` = not yet known (pre-mount); false = already acknowledged. */
	const [show, setShow] = useState<boolean | null>(null);

	useEffect(() => {
		try {
			setShow(window.localStorage.getItem(STORAGE_KEY) !== "ok");
		} catch {
			// Private browsing can throw on localStorage access. Showing the notice
			// is the safe failure: it informs, and it costs one dismissal.
			setShow(true);
		}
	}, []);

	/*
	 * The floating WhatsApp / back-to-top buttons occupy the same bottom-right
	 * corner. Rather than have them overlap, this flags the document while the
	 * notice is up and `FloatingActions` lifts itself out of the way — see the
	 * `data-cookie-notice` rule there. A CSS-only handshake keeps the two
	 * components independent of each other.
	 */
	useEffect(() => {
		if (show === null) return;
		const root = document.documentElement;
		if (show) root.setAttribute("data-cookie-notice", "open");
		else root.removeAttribute("data-cookie-notice");
		return () => root.removeAttribute("data-cookie-notice");
	}, [show]);

	const dismiss = () => {
		try {
			window.localStorage.setItem(STORAGE_KEY, "ok");
		} catch {
			// Nothing to do — the notice closes for this session either way.
		}
		setShow(false);
	};

	if (!show) return null;

	return (
		<div
			// `role="region"` and not `dialog`: it takes no focus and blocks
			// nothing. A modal role on a non-modal element makes screen readers
			// announce a trap that is not there.
			role="region"
			aria-label={en ? "Cookie notice" : "Information sur les cookies"}
			className="fixed inset-x-0 bottom-0 z-50 border-tk-border border-t bg-tk-surface/97 shadow-[0_-8px_28px_-20px_oklch(0.19_0.026_277/0.6)] backdrop-blur-[14px]"
			style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
		>
			<div className="mx-auto flex max-w-[86rem] flex-col gap-3 px-6 py-4 lg:flex-row lg:items-center lg:gap-6 lg:px-10">
				<p className="flex-1 font-body text-[length:var(--tk-text-sm)] text-tk-ink-2 leading-relaxed">
					{en ? (
						<>
							This site uses only the cookies it needs to work — your language,
							your session once signed in, and display preferences.{" "}
							<span className="font-semibold text-tk-ink">
								No advertising or third-party tracking.
							</span>
						</>
					) : (
						<>
							Ce site n'utilise que les cookies nécessaires à son fonctionnement
							: votre langue, votre session une fois connecté, et vos
							préférences d'affichage.{" "}
							<span className="font-semibold text-tk-ink">
								Aucun traceur publicitaire ou tiers.
							</span>
						</>
					)}
				</p>

				<div className="flex flex-none items-center gap-3">
					<Link
						href="/legal/privacy#cookies"
						className="font-body font-medium text-[length:var(--tk-text-sm)] text-tk-eyebrow underline underline-offset-4 hover:text-tk-primary"
					>
						{en ? "Details" : "En savoir plus"}
					</Link>
					<button
						type="button"
						onClick={dismiss}
						className="cursor-pointer rounded-md bg-tk-primary px-4 py-2 font-body font-semibold text-[length:var(--tk-text-sm)] text-tk-on-primary transition-colors hover:bg-tk-primary-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-tk-ink focus-visible:outline-offset-2"
					>
						{en ? "Got it" : "J'ai compris"}
					</button>
				</div>
			</div>
		</div>
	);
}
