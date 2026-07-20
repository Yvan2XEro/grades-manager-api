import type { Dict, Locale } from "@/i18n";

/**
 * BrochureDownload — download zone for the TKAMS presentation document.
 *
 * The served PDF is chosen from the visitor's locale: French visitors get
 * `brochure-commerciale_tkams_fr.pdf`, English visitors get the `_en` variant
 * (both live in `public/documents/`). Pass an explicit `href` to override.
 */

type Theme = "light" | "dark";

interface BrochureDownloadProps {
	brochure: Dict["brochure"];
	/** Visitor locale — selects the FR/EN PDF when `href` is not provided. */
	locale?: Locale;
	/** Path under /public to the document. Overrides locale-based selection. */
	href?: string;
	/** Set false to show the "coming soon" placeholder instead. */
	available?: boolean;
	theme?: Theme;
	className?: string;
}

function DocIcon({ className }: { className?: string }) {
	return (
		<svg
			width="26"
			height="26"
			viewBox="0 0 28 28"
			fill="none"
			className={className}
			aria-hidden="true"
		>
			<path
				d="M7 3.5h8.5L22 10v13.5a1 1 0 01-1 1H7a1 1 0 01-1-1V4.5a1 1 0 011-1z"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinejoin="round"
			/>
			<path
				d="M15 3.5V10h6.5"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinejoin="round"
			/>
			<path
				d="M10 15h8M10 18.5h8M10 21.5h5"
				stroke="currentColor"
				strokeWidth="1.3"
				strokeLinecap="round"
			/>
		</svg>
	);
}

export function BrochureDownload({
	brochure: b,
	locale = "fr",
	href,
	available = true,
	theme = "light",
	className = "",
}: BrochureDownloadProps) {
	const isDark = theme === "dark";
	const docHref = href ?? `/documents/brochure-commerciale_tkams_${locale}.pdf`;

	return (
		<div
			className={`flex flex-col gap-5 border p-7 ${
				isDark
					? "border-white/12 bg-white/[0.03]"
					: "border-tk-border border-l-[3px] border-l-tk-primary bg-tk-surface"
			} ${className}`}
		>
			<div className="flex items-start gap-4">
				<span
					className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${
						isDark
							? "border-white/12 bg-white/[0.04] text-tk-primary-bright"
							: "border-tk-border bg-tk-bg text-tk-primary"
					}`}
				>
					<DocIcon />
				</span>
				<div>
					<span
						className={`font-code font-semibold text-[0.7rem] uppercase tracking-[0.12em] ${
							isDark ? "text-tk-primary-bright" : "text-tk-primary"
						}`}
					>
						{b.label}
					</span>
					<h3
						className={`mt-1.5 font-bold font-display text-[1.0625rem] tracking-[-0.02em] ${
							isDark ? "text-tk-on-dark" : "text-tk-ink"
						}`}
					>
						{b.title}
					</h3>
					<p
						className={`mt-1.5 font-body text-[0.9rem] leading-[1.6] ${
							isDark ? "text-tk-on-dark-soft" : "text-tk-ink-2"
						}`}
					>
						{b.sub}
					</p>
				</div>
			</div>

			<div className="flex flex-wrap items-center gap-3">
				{available ? (
					<a href={docHref} download className="tk-btn-primary">
						{b.download}
						<svg
							width="15"
							height="15"
							viewBox="0 0 16 16"
							fill="none"
							aria-hidden="true"
						>
							<path
								d="M8 2v8m0 0L5 7m3 3l3-3M3 13h10"
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</a>
				) : (
					<span
						className={`inline-flex cursor-not-allowed items-center gap-2 rounded-[0.625rem] border px-5 py-3 font-body font-semibold text-[0.9375rem] ${
							isDark
								? "border-white/12 text-tk-on-dark-muted"
								: "border-tk-border text-tk-muted"
						}`}
					>
						{b.soon}
					</span>
				)}
				<span
					className={`font-code text-[0.75rem] tracking-[0.04em] ${
						isDark ? "text-tk-on-dark-muted" : "text-tk-muted"
					}`}
				>
					{available ? b.meta : `public${docHref}`}
				</span>
			</div>
		</div>
	);
}
