import type React from "react";

/**
 * Editorial design primitives — shared building blocks that give the whole
 * marketing site a consistent "academic report / institutional" rhythm:
 * numbered sections, hairline rules, restrained typographic eyebrows.
 *
 * Fonts (Sora display / Inter body / JetBrains mono) and the TKAMS color
 * tokens are intentionally reused — only the layout language changes.
 */

type Theme = "light" | "dark";

const ink = (theme: Theme) =>
	theme === "dark" ? "text-tk-on-dark" : "text-tk-ink";
const inkSoft = (theme: Theme) =>
	theme === "dark" ? "text-tk-on-dark-soft" : "text-tk-ink-2";
const ruleColor = (theme: Theme) =>
	theme === "dark" ? "bg-white/12" : "bg-tk-border-strong";

/** A thin full-width hairline — the backbone of the editorial look. */
export function Rule({
	theme = "light",
	className = "",
}: {
	theme?: Theme;
	className?: string;
}) {
	return <div className={`h-px w-full ${ruleColor(theme)} ${className}`} />;
}

/**
 * Numbered section label, e.g. `01 — LA PLATEFORME`.
 * The number is the accent; the label is tracked monospace.
 */
export function SectionLabel({
	number,
	children,
	theme = "light",
	className = "",
}: {
	number: string;
	children: React.ReactNode;
	theme?: Theme;
	className?: string;
}) {
	return (
		<div className={`flex items-center gap-3 ${className}`}>
			<span className="font-code font-semibold text-[0.8125rem] text-tk-primary tabular-nums tracking-[0.1em]">
				{number}
			</span>
			<span className={`h-px w-8 ${ruleColor(theme)}`} />
			<span
				className={`font-code font-medium text-[0.75rem] uppercase tracking-[0.18em] ${inkSoft(
					theme,
				)}`}
			>
				{children}
			</span>
		</div>
	);
}

/**
 * Big editorial heading. Optional `lead` shows an italic accent fragment.
 */
export function SectionHeading({
	children,
	theme = "light",
	as: Tag = "h2",
	className = "",
}: {
	children: React.ReactNode;
	theme?: Theme;
	as?: "h1" | "h2" | "h3";
	className?: string;
}) {
	return (
		<Tag
			className={`font-display font-extrabold text-[clamp(1.875rem,4vw,3rem)] leading-[1.08] tracking-[-0.04em] ${ink(
				theme,
			)} ${className}`}
		>
			{children}
		</Tag>
	);
}

/** Supporting paragraph on a deliberately narrow measure. */
export function Lede({
	children,
	theme = "light",
	className = "",
}: {
	children: React.ReactNode;
	theme?: Theme;
	className?: string;
}) {
	return (
		<p
			className={`max-w-[42ch] font-body text-[1.0625rem] leading-[1.7] ${inkSoft(
				theme,
			)} ${className}`}
		>
			{children}
		</p>
	);
}

/**
 * Two-column editorial section scaffold:
 * left = sticky numbered label + heading + lede; right = content.
 * On small screens it stacks. This is the recurring rhythm of the page.
 */
export function EditorialSection({
	id,
	number,
	label,
	heading,
	lede,
	theme = "light",
	bg = "bg-tk-bg",
	children,
	aside,
	className = "",
}: {
	id?: string;
	number: string;
	label: React.ReactNode;
	heading: React.ReactNode;
	lede?: React.ReactNode;
	theme?: Theme;
	bg?: string;
	children: React.ReactNode;
	aside?: React.ReactNode;
	className?: string;
}) {
	return (
		<section id={id} className={`${bg} ${className}`}>
			<div className="mx-auto max-w-[86rem] px-6 lg:px-10">
				<Rule theme={theme} />
				<div className="grid grid-cols-1 gap-x-12 gap-y-10 py-16 lg:grid-cols-12 lg:py-24">
					<div className="lg:col-span-4">
						<div className="lg:sticky lg:top-28">
							<SectionLabel number={number} theme={theme}>
								{label}
							</SectionLabel>
							<SectionHeading theme={theme} className="mt-6">
								{heading}
							</SectionHeading>
							{lede ? <div className="mt-5">{lede}</div> : null}
							{aside ? <div className="mt-8">{aside}</div> : null}
						</div>
					</div>
					<div className="lg:col-span-8">{children}</div>
				</div>
			</div>
		</section>
	);
}
