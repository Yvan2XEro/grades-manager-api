"use client";

import {
	Bell,
	type LucideIcon,
	Minus,
	Moon,
	PanelLeftClose,
	Search,
	Settings,
	Square,
	Volume2,
	VolumeX,
	X,
} from "lucide-react";
import Image from "next/image";
import type React from "react";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n";
import { isSoundOn, toggleSound } from "./sounds";
import { demoStrings } from "./strings";

/**
 * The TKAMS application shell, reproduced for the marketing site.
 *
 * Every measurement here is taken from the real product source so a prospect
 * sees the software they will actually log into:
 *
 *   apps/web/src/index.css                 --radius 0.375rem; body 14px;
 *                                          --primary    oklch(0.48 0.2 277)
 *                                          (surfaces are re-hued — see the
 *                                          note on `appTokens` below)
 *   components/layouts/DashboardLayout.tsx h-dvh flex; main px-4 py-6 md:px-8
 *   components/navigation/Header.tsx       h-14, sticky, bg-sidebar/95, blur
 *   components/navigation/Sidebar.tsx      w-64 expanded / 56px collapsed;
 *                                          group titles text-[10px] uppercase
 *                                          tracking-widest; item text-[12.5px];
 *                                          active bg-primary/10 text-primary
 *   components/ui/table.tsx                th h-9 px-4 py-2.5 text-[11px]
 *                                          uppercase tracking-wider on
 *                                          bg-muted/40; td px-4 py-3 text-sm;
 *                                          tr border-b border-border/50
 *   components/ui/badge.tsx                rounded-full px-2.5 py-0.5 text-xs
 *                                          font-medium, NOT uppercase
 *   components/ui/button.tsx               h-9 px-4 rounded (4px), icons 16px
 *   components/ui/card.tsx                 rounded-xl border bg-card
 *
 * The product's own violet is used inside these frames rather than the brand
 * violet: this is a window into the software, and the software has its own
 * (slightly deeper) primary. Same hue, so the two read as one family.
 */

/**
 * Product tokens, scoped so they never leak into the marketing page.
 *
 * The application's own surfaces sit on hue 80 — a warm clay-beige that reads
 * as cream (#FBF7F2 for a card). That is right inside the product, where it is
 * the whole palette, but wrong on this site: the pages around these frames are
 * white with violet-biased greys, so a warm frame looked yellowed, like a
 * screenshot taken on a different monitor.
 *
 * Surfaces are therefore moved onto hue 277, the site's own neutral axis, with
 * chroma pulled down so they stay quiet:
 *
 *   card    #FBF7F2 → #FDFDFF     bg     #F2F0EC → #F4F4F7
 *   muted   #F5F3F0 → #F6F7F9     input  #EEEBE7 → #F0F1F4
 *   border  #D9D7D3 → #DEDFE4
 *
 * Everything that carries meaning is untouched: the violet primary, the ink,
 * and the semantic pass/warn/block colours are the product's own, because those
 * are what a prospect will actually recognise when they log in.
 */
export const appTokens = {
	"--ap-bg": "oklch(0.968 0.004 277)",
	"--ap-card": "oklch(0.995 0.002 277)",
	"--ap-fg": "oklch(0.14 0.028 277)",
	"--ap-primary": "oklch(0.48 0.2 277)",
	"--ap-primary-fg": "oklch(0.99 0 0)",
	"--ap-muted": "oklch(0.975 0.003 277)",
	"--ap-muted-fg": "oklch(0.53 0.014 277)",
	"--ap-border": "oklch(0.905 0.006 277)",
	"--ap-input": "oklch(0.958 0.005 277)",
	"--ap-accent": "oklch(0.95 0.006 277)",
	"--ap-accent-fg": "oklch(0.38 0.18 277)",
	"--ap-destructive": "oklch(0.55 0.22 27)",
} as React.CSSProperties;

/** Badge variants, mirroring ui/badge.tsx (fill 12%, text 700, border 25%). */
export const badgeTone = {
	success: "border-emerald-500/25 bg-emerald-500/12 text-emerald-700",
	warning: "border-amber-500/25 bg-amber-500/12 text-amber-700",
	destructive: "border-red-500/25 bg-red-500/12 text-red-700",
	info: "border-sky-500/25 bg-sky-500/12 text-sky-700",
	outline: "border-[var(--ap-border)] bg-transparent text-[var(--ap-fg)]",
	primary:
		"border-transparent bg-[var(--ap-primary)] text-[var(--ap-primary-fg)]",
	muted:
		"border-[var(--ap-border)] bg-[var(--ap-muted)] text-[var(--ap-muted-fg)]",
} as const;

export function AppBadge({
	tone = "outline",
	children,
}: {
	tone?: keyof typeof badgeTone;
	children: React.ReactNode;
}) {
	return (
		<span
			className={`inline-flex w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 font-body font-medium text-xs ${badgeTone[tone]}`}
		>
			{children}
		</span>
	);
}

/** Button, mirroring ui/button.tsx: h-9 px-4, rounded 4px. */
export function AppButton({
	variant = "default",
	size = "default",
	children,
	onClick,
	disabled,
	type = "button",
	className = "",
}: {
	variant?: "default" | "outline" | "ghost";
	size?: "default" | "sm";
	children: React.ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	type?: "button" | "submit";
	className?: string;
}) {
	const base =
		"inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded border font-body font-medium transition-colors disabled:pointer-events-none disabled:opacity-40";
	const variants = {
		default:
			"border-transparent bg-[var(--ap-primary)] text-[var(--ap-primary-fg)] hover:opacity-85",
		outline:
			"border-[var(--ap-border)] bg-transparent text-[var(--ap-fg)] hover:bg-[var(--ap-muted)]",
		ghost:
			"border-transparent bg-transparent text-[var(--ap-fg)] hover:bg-[var(--ap-muted)]",
	};
	const sizes = {
		default: "h-9 px-4 text-sm",
		sm: "h-8 px-3 text-[0.8125rem]",
	};
	return (
		<button
			type={type}
			onClick={onClick}
			disabled={disabled}
			className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
		>
			{children}
		</button>
	);
}

/** Card, mirroring ui/card.tsx. */
export function AppCard({
	children,
	className = "",
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={`rounded-xl border border-[var(--ap-border)] bg-[var(--ap-card)] shadow-[0_1px_3px_oklch(0_0_0/0.06),0_1px_2px_oklch(0_0_0/0.04)] ${className}`}
		>
			{children}
		</div>
	);
}

/** Table head cell — h-9 px-4 py-2.5, 11px uppercase tracking-wider. */
export function Th({
	children,
	align = "left",
	className = "",
}: {
	children?: React.ReactNode;
	align?: "left" | "right" | "center";
	className?: string;
}) {
	const a =
		align === "right"
			? "text-right"
			: align === "center"
				? "text-center"
				: "text-left";
	return (
		<th
			className={`h-9 @md:px-4 px-3 py-2.5 align-middle font-body font-medium text-[11px] text-[var(--ap-muted-fg)] uppercase tracking-wider ${a} ${className}`}
		>
			{children}
		</th>
	);
}

/** Table body cell — px-4 py-3 text-sm. */
export function Td({
	children,
	align = "left",
	className = "",
}: {
	children?: React.ReactNode;
	align?: "left" | "right" | "center";
	className?: string;
}) {
	const a =
		align === "right"
			? "text-right"
			: align === "center"
				? "text-center"
				: "text-left";
	return (
		<td
			className={`@md:px-4 px-3 py-3 align-middle font-body text-[0.8125rem] text-[var(--ap-fg)] ${a} ${className}`}
		>
			{children}
		</td>
	);
}

/** Table row — border-b border-border/50, violet inset bar on hover. */
export function Tr({
	children,
	className = "",
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<tr
			className={`border-[var(--ap-border)]/50 border-b transition-all duration-150 last:border-0 hover:bg-[var(--ap-muted)]/50 hover:shadow-[inset_3px_0_0_0_var(--ap-primary)] ${className}`}
		>
			{children}
		</tr>
	);
}

/**
 * A sidebar entry. `icon` takes the same lucide component the product uses for
 * that destination, rendered at the product's own `size-[15px]`.
 */
export type NavItem = {
	label: string;
	group: string;
	active?: boolean;
	icon: LucideIcon;
};

/** The product's nav icon size — `const IC = "size-[15px] shrink-0"`. */
const IC = "size-[15px] shrink-0";

/**
 * The window: title bar, sidebar, 56px header, content.
 *
 * Sizing is driven by CONTAINER queries (`@container` on the frame, `@2xl:` on
 * the parts), not viewport breakpoints, and that distinction is load-bearing.
 *
 * This frame is dropped into columns of very different widths — full-bleed on
 * the homepage, a ~26rem column beside role copy on /solutions. Viewport
 * breakpoints cannot see that: on a wide screen `@2xl:` expanded the 256px
 * sidebar even inside a narrow column, leaving roughly 180px for the content
 * and overlapping every label in it.
 *
 * Container queries measure the frame's own box, so the shell falls back to its
 * 56px icon rail exactly when it is too narrow to hold the full sidebar — which
 * is also how the real application behaves.
 */
export function AppWindow({
	url = "tkams.com/admin",
	breadcrumb,
	title,
	action,
	nav,
	children,
	locale,
	institution,
}: {
	url?: string;
	breadcrumb: string;
	title: string;
	action?: React.ReactNode;
	nav: NavItem[];
	children: React.ReactNode;
	/** Drives the application chrome, so the demo follows the site's language. */
	locale?: Locale;
	institution?: string;
}) {
	const t = demoStrings(locale);
	const groups = nav.reduce<Record<string, NavItem[]>>((acc, item) => {
		const group = acc[item.group] ?? [];
		group.push(item);
		acc[item.group] = group;
		return acc;
	}, {});

	/*
	 * Sound state is read after mount, never during render: the stored
	 * preference lives in localStorage, which the server cannot see, and
	 * reading it while rendering would make the markup differ between server
	 * and client and trip hydration.
	 *
	 * The initial value is `true` to match the default, so a visitor who has
	 * not muted never sees the speaker flash to "muted" before the effect runs.
	 */
	const [soundOn, setSoundOn] = useState(true);
	useEffect(() => setSoundOn(isSoundOn()), []);

	return (
		<div className="tk-frame">
			<div className="tk-frame-inner">
				<div
					style={appTokens}
					// A constant 16:9 at a fixed 1120px design width, scaled to fit.
					//
					// The frame is always laid out as if it had 1120px — the width the app
					// is actually designed for — and the wrapper scales the whole thing down
					// on narrower screens. That is how the reference site shows its console
					// on a phone: the screenshot gets smaller, it does not get re-flowed into
					// a cramped mobile version of itself, and the reader sees the entire
					// interface without scrolling sideways.
					//
					// `min-h` is deliberately absent: a minimum height would fight the
					// scale-to-fit and reintroduce the overflow it exists to prevent.
					//
					// `tk-demo-cursor` swaps the pointer for the product's own cursor set
					// inside this box and nowhere else — see the block of the same name
					// in globals.css. The frame reproduces the software down to the title
					// bar; the pointer was the last thing in it still belonging to the OS.
					className="tk-demo-cursor tk-frame-chrome @container flex aspect-[16/9] w-[1120px] flex-col overflow-hidden rounded-xl bg-[var(--ap-bg)]"
				>
					{/*
					 * Window title bar.
					 *
					 * Drawn as the desktop window the product actually runs in, with the
					 * Windows control trio on the right — minimise, maximise, close — rather
					 * than the three inert grey dots that stood here before and read as a
					 * macOS pastiche.
					 */}
					<div className="flex items-center gap-2 border-[var(--ap-border)] border-b bg-[var(--ap-muted)] py-1.5 pr-0 pl-3">
						<span className="truncate font-body text-[0.72rem] text-[var(--ap-muted-fg)]">
							{url}
						</span>

						<span className="ml-auto flex items-stretch" aria-hidden="true">
							<span className="flex h-7 w-10 items-center justify-center text-[var(--ap-muted-fg)]">
								<Minus className="size-3.5" />
							</span>
							<span className="flex h-7 w-10 items-center justify-center text-[var(--ap-muted-fg)]">
								<Square className="size-3" />
							</span>
							<span className="flex h-7 w-10 items-center justify-center rounded-tr-xl text-[var(--ap-muted-fg)]">
								<X className="size-3.5" />
							</span>
						</span>
					</div>

					<div className="flex min-h-0 flex-1">
						{/* Sidebar */}
						<aside className="flex @2xl:w-64 w-14 shrink-0 flex-col border-[var(--ap-border)] border-r bg-[var(--ap-card)]">
							{/*
							 * Logo block — the real wordmark, as the product shows it (h-7 in
							 * Sidebar.tsx), with the favicon standing in on the collapsed rail.
							 */}
							<div className="flex h-14 shrink-0 items-center @2xl:justify-start justify-center border-[var(--ap-border)] border-b @2xl:px-5">
								<Image
									src="/favicon.svg"
									alt=""
									aria-hidden="true"
									width={32}
									height={32}
									className="@2xl:hidden size-6 object-contain"
								/>
								<span className="@2xl:block hidden min-w-0">
									<Image
										src="/logo-tkams.png"
										alt="TKAMS"
										width={775}
										height={200}
										className="h-[18px] w-auto object-contain"
									/>
									<span className="mt-0.5 block truncate font-body text-[0.7rem] text-[var(--ap-muted-fg)]">
										{institution ?? t.chrome.institution}
									</span>
								</span>
							</div>

							<nav className="flex-1 py-2">
								{/* Collapsed rail */}
								<div className="flex @2xl:hidden flex-col items-center gap-1.5">
									{nav.slice(0, 6).map((item) => {
										const Icon = item.icon;
										return (
											<span
												key={item.label}
												className={`flex size-8 items-center justify-center rounded-lg ${
													item.active
														? "bg-[var(--ap-primary)] text-white"
														: "text-[var(--ap-muted-fg)]"
												}`}
											>
												<Icon className={IC} aria-hidden="true" />
											</span>
										);
									})}
								</div>

								{/* Expanded */}
								<div className="@2xl:block hidden space-y-0.5 px-2">
									{Object.entries(groups).map(([group, items], gi) => (
										<div key={group}>
											{gi > 0 ? (
												<div className="my-2 border-[var(--ap-border)] border-t" />
											) : null}
											<p className="px-1.5 py-1 font-body font-semibold text-[10px] text-[var(--ap-muted-fg)] uppercase tracking-widest">
												{group}
											</p>
											<div className="mt-0.5 space-y-0.5">
												{items.map((item) => {
													const Icon = item.icon;
													return (
														<span
															key={item.label}
															className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 font-body text-[12.5px] ${
																item.active
																	? "bg-[var(--ap-primary)]/10 font-semibold text-[var(--ap-primary)]"
																	: "text-[var(--ap-muted-fg)]"
															}`}
														>
															<Icon className={IC} aria-hidden="true" />
															{item.label}
														</span>
													);
												})}
											</div>
										</div>
									))}
								</div>
							</nav>
						</aside>

						<div className="flex min-h-0 min-w-0 flex-1 flex-col">
							{/*
							 * Header — h-14, sticky in the product.
							 *
							 * The control cluster on the right mirrors Header.tsx: the ⌘K search
							 * trigger (h-8 w-52, rounded-lg, bg-input, with a kbd hint), then
							 * ghost icon buttons at h-8 w-8 — theme, sound, notifications with
							 * their unread dot, settings — and finally the user's initials in a
							 * primary/10 circle.
							 */}
							<div className="flex h-14 items-center gap-2 border-[var(--ap-border)] border-b bg-[var(--ap-card)] @md:px-4 px-3">
								{/* Sidebar toggle, first control in the product's header */}
								<span className="flex size-8 flex-none items-center justify-center rounded text-[var(--ap-muted-fg)]">
									<PanelLeftClose className="size-4" aria-hidden="true" />
								</span>
								<span className="truncate font-body text-[0.8rem] text-[var(--ap-muted-fg)]">
									{breadcrumb} /{" "}
									<span className="font-semibold text-[var(--ap-fg)]">
										{title}
									</span>
								</span>

								<span className="ml-auto flex items-center gap-1.5">
									{action}

									{/* Search trigger */}
									<span className="@4xl:flex hidden h-8 w-44 items-center gap-2 rounded-lg border border-[var(--ap-border)] bg-[var(--ap-input)] px-3 text-[var(--ap-muted-fg)] shadow-sm">
										<Search className="size-3.5 shrink-0" aria-hidden="true" />
										<span className="flex-1 text-left font-body text-xs">
											{t.chrome.search}
										</span>
										<span className="flex items-center rounded-md border border-[var(--ap-border)] bg-[var(--ap-card)] px-1.5 py-0.5 font-code text-[10px] text-[var(--ap-muted-fg)]">
											Ctrl+K
										</span>
									</span>

									{/*
									 * The speaker is the one live control in this header: it mutes
									 * and un-mutes the demo's micro-interaction sounds. Sound is on
									 * by default, as in the product; muting is remembered.
									 */}
									<button
										type="button"
										onClick={() => setSoundOn(toggleSound())}
										aria-pressed={soundOn}
										title={soundOn ? t.chrome.muteSound : t.chrome.unmuteSound}
										className={`flex size-8 cursor-pointer items-center justify-center rounded border-none bg-transparent transition-colors hover:bg-[var(--ap-muted)] ${
											soundOn
												? "text-[var(--ap-primary)]"
												: "text-[var(--ap-muted-fg)]"
										}`}
									>
										{soundOn ? (
											<Volume2 className="size-4" aria-hidden="true" />
										) : (
											<VolumeX className="size-4" aria-hidden="true" />
										)}
										<span className="sr-only">
											{soundOn ? t.chrome.muteSound : t.chrome.unmuteSound}
										</span>
									</button>

									{/* Decorative chrome, matching the product's header */}
									{[Moon, Settings].map((Icon, i) => (
										<span
											key={Icon.displayName ?? String(i)}
											className="@md:flex hidden size-8 items-center justify-center rounded text-[var(--ap-muted-fg)]"
										>
											<Icon className="size-4" aria-hidden="true" />
										</span>
									))}

									{/* Notifications, with the unread badge the product shows */}
									<span className="relative @md:flex hidden size-8 items-center justify-center rounded text-[var(--ap-muted-fg)]">
										<Bell className="size-4" aria-hidden="true" />
										<span className="absolute top-1 right-1 flex size-3.5 items-center justify-center rounded-full bg-[var(--ap-destructive)] font-body font-semibold text-[9px] text-white">
											3
										</span>
									</span>

									<span className="flex size-8 items-center justify-center rounded-full bg-[var(--ap-primary)]/10 font-body font-semibold text-[0.68rem] text-[var(--ap-primary)]">
										AN
									</span>
								</span>
							</div>

							{/* Content — px-4 py-6 md:px-8 in the product, tightened for the page */}
							<div className="min-h-0 flex-1 overflow-y-auto @md:px-4 px-3 @md:py-5 py-4">
								{children}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
