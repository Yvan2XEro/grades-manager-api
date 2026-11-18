import type React from "react";

/**
 * Editorial design primitives — shared building blocks that give the whole
 * marketing site a consistent "academic report / institutional" rhythm:
 * numbered sections, hairline rules, restrained typographic eyebrows.
 *
 * Fonts (Funnel Display headings / Montserrat body / JetBrains mono) and the TKAMS color
 * tokens are intentionally reused — only the layout language changes.
 */

type Theme = "light" | "dark";

const _ink = (theme: Theme) =>
	theme === "dark" ? "text-tk-on-dark" : "text-tk-ink";
/** Display-size headings take the softened title ink, not the full-strength one. */
const titleInk = (theme: Theme) =>
	theme === "dark" ? "text-tk-on-dark" : "text-tk-title";
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
 *
 * The chapter number carries the terracotta accent; the label stays in tracked
 * mono. Together they read as a chapter mark in a report rather than a badge.
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
			<span
				className={`font-code font-semibold text-[length:var(--tk-text-sm)] tabular-nums tracking-[0.1em] ${
					theme === "dark" ? "text-tk-on-dark" : "text-tk-accent"
				}`}
			>
				{number}
			</span>
			<span
				className={`h-px w-8 ${
					theme === "dark" ? "bg-white/25" : "bg-tk-accent/35"
				}`}
			/>
			<span
				className={`font-code font-medium text-[length:var(--tk-text-xs)] uppercase tracking-[0.18em] ${inkSoft(
					theme,
				)}`}
			>
				{children}
			</span>
		</div>
	);
}

/**
 * Big editorial heading.
 *
 * Funnel Display at 700 with slightly relaxed tracking: the previous extrabold/-0.04em
 * setting was tight enough to read as a consumer product page. Backing both off
 * a step is what moves the register towards an institution without changing
 * the typeface.
 */
export function SectionHeading({
	children,
	theme = "light",
	as: Tag = "h2",
	level = "headline",
	className = "",
}: {
	children: React.ReactNode;
	theme?: Theme;
	as?: "h1" | "h2" | "h3";
	/**
	 * Which rank this chapter holds in the page.
	 *
	 * `headline` is for the chapters that carry the argument; `supporting` is
	 * two-thirds the size, for the ones a reader consults rather than reads
	 * (deployment modes, trust badges, FAQ). Everything used to be `headline`,
	 * which is why ten chapters all shouted at the same size and none of them
	 * led.
	 */
	level?: "headline" | "supporting";
	className?: string;
}) {
	const size = level === "supporting" ? "tk-subhead" : "tk-headline";
	return (
		<Tag className={`${size} ${titleInk(theme)} ${className}`}>{children}</Tag>
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
			className={`max-w-[42ch] font-body text-[length:var(--tk-text-lead)] leading-[1.7] ${inkSoft(
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
	level = "headline",
	bg = "",
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
	/** Passed through to the heading — see SectionHeading. */
	level?: "headline" | "supporting";
	bg?: string;
	children: React.ReactNode;
	aside?: React.ReactNode;
	className?: string;
}) {
	return (
		<section id={id} className={`${bg} ${className}`}>
			<div className="mx-auto max-w-[86rem] px-6 lg:px-10">
				{/*
				 * No opening rule. Sections alternate between the light ground and
				 * the primary, so the change of tone already separates them; adding a
				 * hairline on top of a colour change draws the seam twice and is what
				 * made the page read as ruled paper.
				 */}
				<div className="tk-section grid grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-12">
					<div className="lg:col-span-4">
						<div className="lg:sticky lg:top-28">
							<SectionLabel number={number} theme={theme}>
								{label}
							</SectionLabel>
							<SectionHeading theme={theme} level={level} className="mt-6">
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
