"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/i18n";

/**
 * The two floating actions: WhatsApp, and back to top.
 *
 * ## Why WhatsApp, and why a float
 *
 * The site already advertises `+237 652 761 931` as a phone AND WhatsApp line
 * (see `ContactPage.tsx`) — but only on /contact, at the bottom of a definition
 * list, on one page out of seventeen. In this market WhatsApp is not a
 * secondary channel: a registrar comparing two vendors will message before they
 * will fill a form, and the form is currently the only thing the site offers
 * from anywhere other than /contact.
 *
 * The number is the one already published. It is not duplicated as a literal
 * here — `WHATSAPP_NUMBER` is exported so there is one place to change it, and
 * `ContactPage` should be pointed at it rather than the reverse.
 *
 * ## Why back-to-top is conditional and WhatsApp is not
 *
 * Back-to-top is meaningless until there is something to go back up from, so it
 * appears past one viewport of scrolling. WhatsApp is an offer, not a
 * navigation aid: it is useful on arrival, so it is always present.
 *
 * Both buttons stay clear of the mobile bottom edge via `env(safe-area-inset-*)`
 * — without it, iOS Safari's home indicator sits on top of them.
 *
 * ## Restraint
 *
 * No auto-opening chat bubble, no "👋 Besoin d'aide ?" tooltip after N seconds,
 * no pulsing ring. Those are the reflexes this pattern usually arrives with, and
 * on a site whose argument is "every franc is written down and verifiable" they
 * read as a sales popup. Two quiet buttons that do exactly what their labels
 * say.
 */

/** The published WhatsApp line. Digits only — wa.me rejects spaces and `+`. */
export const WHATSAPP_NUMBER = "237652761931";

/** Shown formatted wherever a human reads it. */
export const WHATSAPP_DISPLAY = "+237 652 761 931";

export function FloatingActions({ locale }: { locale: Locale }) {
	const en = locale === "en";
	const [showTop, setShowTop] = useState(false);

	useEffect(() => {
		/*
		 * One viewport of scroll before the control appears. A fixed pixel
		 * threshold would fire almost immediately on a desktop monitor and far too
		 * late on a phone.
		 */
		const onScroll = () =>
			setShowTop(window.scrollY > window.innerHeight * 0.9);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	/*
	 * `scrollTo` with `behavior: "smooth"` respects the OS reduced-motion setting
	 * in every current browser, so no manual check is needed here — unlike the
	 * CSS reveals, which do carry one.
	 */
	const toTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

	const waMessage = en
		? "Hello, I would like to know more about TKAMS."
		: "Bonjour, je souhaite en savoir plus sur TKAMS.";

	return (
		<div
			/*
			 * Lifts clear of the cookie notice while that is on screen. The notice
			 * sets `data-cookie-notice` on <html> and removes it on dismissal; the
			 * two components never import each other.
			 */
			className="tk-floating fixed right-4 bottom-4 z-40 flex flex-col items-end gap-2.5 transition-[bottom] duration-300 lg:right-6 lg:bottom-6"
			style={{
				paddingBottom: "env(safe-area-inset-bottom)",
				paddingRight: "env(safe-area-inset-right)",
			}}
		>
			{/*
			 * Back to top — above WhatsApp, so the button that appears and
			 * disappears never displaces the one that is always there.
			 */}
			<button
				type="button"
				onClick={toTop}
				aria-label={en ? "Back to top" : "Revenir en haut"}
				data-visible={showTop}
				className="flex size-11 cursor-pointer items-center justify-center rounded-full border border-tk-border bg-tk-surface text-tk-ink-soft opacity-0 shadow-[0_4px_16px_-6px_oklch(0.19_0.026_277/0.45)] transition-all duration-200 hover:border-tk-primary hover:text-tk-primary-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-tk-ink focus-visible:outline-offset-2 data-[visible=false]:pointer-events-none data-[visible=false]:translate-y-2 data-[visible=true]:opacity-100"
			>
				<svg
					width="18"
					height="18"
					viewBox="0 0 20 20"
					fill="none"
					aria-hidden="true"
				>
					<path
						d="M10 16V4m0 0L4.5 9.5M10 4l5.5 5.5"
						stroke="currentColor"
						strokeWidth="1.8"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			</button>

			{/*
			 * WhatsApp.
			 *
			 * Brand green (#25D366) rather than the site violet: this is a
			 * third-party channel and the colour is how it is recognised without
			 * reading. It is the one place on the site where an outside brand's
			 * colour is correct.
			 *
			 * `noopener` is mandatory on a `_blank` link — without it the opened tab
			 * gets a handle back to this window.
			 */}
			<a
				href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waMessage)}`}
				target="_blank"
				rel="noopener noreferrer"
				aria-label={
					en
						? `Contact us on WhatsApp — ${WHATSAPP_DISPLAY}`
						: `Nous écrire sur WhatsApp — ${WHATSAPP_DISPLAY}`
				}
				className="group/wa flex items-center gap-0 rounded-full bg-[#25D366] pr-0 pl-0 text-white no-underline shadow-[0_6px_20px_-6px_rgb(37_211_102/0.7)] transition-all duration-200 hover:bg-[#1FB855] focus-visible:outline focus-visible:outline-2 focus-visible:outline-tk-ink focus-visible:outline-offset-2"
			>
				<span className="flex size-14 items-center justify-center">
					<svg
						width="27"
						height="27"
						viewBox="0 0 24 24"
						fill="currentColor"
						aria-hidden="true"
					>
						<path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.23 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35z" />
						<path d="M12.04 2h-.01C6.5 2 2.02 6.48 2.02 12c0 1.77.46 3.42 1.27 4.86L2 22l5.3-1.26A9.94 9.94 0 0 0 12.04 22C17.57 22 22.05 17.52 22.05 12S17.57 2 12.04 2zm0 18.13a8.1 8.1 0 0 1-4.14-1.14l-.3-.18-3.07.73.75-2.99-.19-.31a8.06 8.06 0 0 1-1.24-4.31c0-4.47 3.64-8.1 8.13-8.1a8.1 8.1 0 0 1 8.12 8.11c0 4.47-3.64 8.19-8.06 8.19z" />
					</svg>
				</span>
				{/*
				 * The label expands on hover on pointer devices and is never shown on
				 * touch, where there is no hover and the icon is already unambiguous.
				 * `max-w` rather than `width` so the transition works without
				 * measuring the text.
				 */}
				<span className="hidden max-w-0 overflow-hidden whitespace-nowrap font-body font-semibold text-[length:var(--tk-text-sm)] transition-[max-width,padding] duration-300 group-hover/wa:max-w-[14rem] group-hover/wa:pr-5 lg:block">
					{en ? "Chat on WhatsApp" : "Écrire sur WhatsApp"}
				</span>
			</a>
		</div>
	);
}
