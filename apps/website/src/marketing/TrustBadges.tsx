import Image from "next/image";

/**
 * TrustBadges — a row of certification / label slots.
 *
 * No claims are invented: until you provide real labels, each slot renders an
 * empty, clearly-marked placeholder ("À renseigner"). Pass `items` with real
 * badges (name + optional logo under /public) to display them for good.
 */

type Theme = "light" | "dark";

export interface TrustBadgeItem {
	/** Visible label, e.g. "ISO 27001", "Conforme CEMAC". */
	name: string;
	/** Optional logo path under /public, e.g. "/badges/iso.svg". */
	logo?: string;
}

interface TrustBadgesProps {
	/** Real badges. If omitted, `count` placeholder slots are shown. */
	items?: TrustBadgeItem[];
	/** Number of placeholder slots when `items` is empty. */
	count?: number;
	/** Placeholder hint text (e.g. "À renseigner"). */
	hint?: string;
	theme?: Theme;
	className?: string;
}

function Seal({ className }: { className?: string }) {
	return (
		<svg
			width="22"
			height="22"
			viewBox="0 0 24 24"
			fill="none"
			className={className}
			aria-hidden="true"
		>
			<path
				d="M12 2.5l2.6 1.5 3 .3 1 2.8 2 2.2-1 2.9.2 3-2.6 1.6-1.4 2.6-3-.4-2.6 1.5-2.6-1.5-3 .4-1.4-2.6L1.6 18.7l.2-3-1-2.9 2-2.2 1-2.8 3-.3L12 2.5z"
				stroke="currentColor"
				strokeWidth="1.3"
				strokeLinejoin="round"
			/>
			<path
				d="M8.5 12l2.3 2.3L15.5 9.5"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

export function TrustBadges({
	items,
	count = 4,
	hint = "À renseigner",
	theme = "light",
	className = "",
}: TrustBadgesProps) {
	const isDark = theme === "dark";

	if (items && items.length > 0) {
		return (
			<div className={`flex flex-wrap items-center gap-3 ${className}`}>
				{items.map((b) => (
					<div
						key={b.name}
						className={`flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 ${
							isDark
								? "border-white/12 bg-white/[0.03] text-tk-on-dark-soft"
								: "border-tk-border bg-tk-surface text-tk-ink-soft"
						}`}
					>
						{b.logo ? (
							<Image
								src={b.logo}
								alt={b.name}
								width={22}
								height={22}
								className="h-[22px] w-auto object-contain"
							/>
						) : (
							<Seal
								className={
									isDark ? "text-tk-primary-bright" : "text-tk-primary"
								}
							/>
						)}
						<span className="font-body font-medium text-[0.8125rem]">
							{b.name}
						</span>
					</div>
				))}
			</div>
		);
	}

	return (
		<div className={`flex flex-wrap gap-3 ${className}`}>
			{Array.from({ length: count }, (_, i) => (
				<div
					key={i}
					className={`flex items-center gap-2.5 rounded-lg border border-dashed px-3.5 py-2.5 ${
						isDark
							? "border-white/15 bg-white/[0.02]"
							: "border-tk-border-strong bg-tk-bg-deep/30"
					}`}
				>
					<Seal className={isDark ? "text-white/30" : "text-tk-muted"} />
					<span className="flex flex-col leading-tight">
						<span
							className={`font-code text-[0.65rem] uppercase tracking-[0.12em] ${
								isDark ? "text-white/40" : "text-tk-muted"
							}`}
						>
							Label / certif.
						</span>
						<span
							className={`font-body text-[0.75rem] ${
								isDark ? "text-tk-on-dark-muted" : "text-tk-ink-2"
							}`}
						>
							{hint}
						</span>
					</span>
				</div>
			))}
		</div>
	);
}
