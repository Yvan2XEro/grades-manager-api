"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import { LogoutButton } from "@/auth/LogoutButton";
import type { Dict } from "@/i18n";
import type { User } from "@/payload-types";

type NavItem = {
	href: string;
	label: string;
	icon: React.ReactNode;
	exact?: boolean;
	onNavigate?: () => void;
};

function NavLink({ href, label, icon, exact = false, onNavigate }: NavItem) {
	const pathname = usePathname();
	const active = exact
		? pathname === href
		: pathname === href || pathname.startsWith(`${href}/`);

	return (
		<Link
			href={href}
			onClick={onNavigate}
			className={`flex items-center gap-2.5 rounded-[0.5rem] px-3 py-2.5 font-body text-[0.9375rem] no-underline transition-all duration-150 md:py-2 md:text-[0.875rem] ${
				active
					? "bg-white/10 font-medium text-white"
					: "text-white/55 hover:bg-white/6 hover:text-white/90"
			}`}
		>
			<span
				className={`flex-shrink-0 ${active ? "text-white" : "text-white/40"}`}
			>
				{icon}
			</span>
			{label}
		</Link>
	);
}

function SectionLabel({ label }: { label: string }) {
	return (
		<p className="mt-5 mb-1 px-3 font-code font-semibold text-[0.6875rem] text-white/30 uppercase tracking-[0.1em] first:mt-0">
			{label}
		</p>
	);
}

const IconHome = () => (
	<svg
		width="16"
		height="16"
		viewBox="0 0 16 16"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<path d="M2 6.5L8 2l6 4.5V14a1 1 0 01-1 1H3a1 1 0 01-1-1V6.5z" />
		<path d="M6 15V9h4v6" />
	</svg>
);

const IconInstances = () => (
	<svg
		width="16"
		height="16"
		viewBox="0 0 16 16"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<rect x="1" y="2" width="14" height="10" rx="1.5" />
		<path d="M5 15h6M8 12v3" />
	</svg>
);

const _IconPlus = () => (
	<svg
		width="16"
		height="16"
		viewBox="0 0 16 16"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
	>
		<path d="M8 3v10M3 8h10" />
	</svg>
);

const IconInvoice = () => (
	<svg
		width="16"
		height="16"
		viewBox="0 0 16 16"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<rect x="2" y="1" width="12" height="14" rx="1.5" />
		<path d="M5 5h6M5 8h6M5 11h4" />
	</svg>
);

const IconSubscription = () => (
	<svg
		width="16"
		height="16"
		viewBox="0 0 16 16"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<path d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8z" />
		<path d="M8 5v3l2 2" />
	</svg>
);

const IconProfile = () => (
	<svg
		width="16"
		height="16"
		viewBox="0 0 16 16"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<circle cx="8" cy="5.5" r="2.5" />
		<path d="M2 14c0-3.3 2.7-5 6-5s6 1.7 6 5" />
	</svg>
);

const IconSecurity = () => (
	<svg
		width="16"
		height="16"
		viewBox="0 0 16 16"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<path d="M8 1L2 4v4c0 3 2.6 5.7 6 7 3.4-1.3 6-4 6-7V4L8 1z" />
	</svg>
);

const IconSupport = () => (
	<svg
		width="16"
		height="16"
		viewBox="0 0 16 16"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<circle cx="8" cy="8" r="7" />
		<path d="M6 6a2 2 0 0 1 4 0c0 1.5-2 2-2 3.5" />
		<circle cx="8" cy="12.5" r="0.5" fill="currentColor" stroke="none" />
	</svg>
);

export function Sidebar({ user, dict: d }: { user: User; dict: Dict }) {
	const s = d.dashboard.sidebar;
	const pathname = usePathname();
	const [open, setOpen] = useState(false);

	// Close the drawer whenever the route changes.
	useEffect(() => {
		setOpen(false);
	}, [pathname]);

	// Lock body scroll while the mobile drawer is open.
	useEffect(() => {
		if (!open) return;
		const previous = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = previous;
		};
	}, [open]);

	const close = () => setOpen(false);

	return (
		<>
			{/* ── Mobile top bar ── */}
			<header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-white/8 border-b bg-tk-dark px-4 md:hidden">
				<Link href="/dashboard" className="flex items-center no-underline">
					<Image
						src="/logo-tkams-bg.png"
						alt="TKAMS"
						width={88}
						height={26}
						className="h-6 w-auto object-contain"
						priority
					/>
				</Link>
				<button
					type="button"
					onClick={() => setOpen(true)}
					aria-label="Ouvrir le menu"
					className="flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10"
				>
					<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
						<path
							d="M3 5.5h14M3 10h14M3 14.5h14"
							stroke="currentColor"
							strokeWidth="1.75"
							strokeLinecap="round"
						/>
					</svg>
				</button>
			</header>

			{/* ── Backdrop (mobile only) ── */}
			{open && (
				<button
					type="button"
					aria-label="Fermer le menu"
					onClick={close}
					className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] md:hidden"
				/>
			)}

			{/* ── Sidebar / drawer ── */}
			<aside
				className={`fixed top-0 left-0 z-50 flex h-screen w-[264px] flex-col bg-tk-dark transition-transform duration-300 ease-out md:w-[240px] md:translate-x-0 ${
					open ? "translate-x-0 shadow-2xl" : "-translate-x-full md:shadow-none"
				}`}
			>
				{/* Logo + close */}
				<div className="flex items-center justify-between border-white/8 border-b px-5 py-5">
					<Link
						href="/dashboard"
						onClick={close}
						className="flex items-center gap-2 no-underline"
					>
						<Image
							src="/logo-tkams-bg.png"
							alt="TKAMS"
							width={96}
							height={28}
							className="h-7 w-auto object-contain"
							priority
						/>
					</Link>
					<button
						type="button"
						onClick={close}
						aria-label="Fermer le menu"
						className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white md:hidden"
					>
						<svg width="18" height="18" viewBox="0 0 18 18" fill="none">
							<path
								d="M4 4l10 10M14 4L4 14"
								stroke="currentColor"
								strokeWidth="1.75"
								strokeLinecap="round"
							/>
						</svg>
					</button>
				</div>

				{/* Nav */}
				<nav className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
					<SectionLabel label={s.general} />
					<NavLink
						href="/dashboard"
						label={s.home}
						icon={<IconHome />}
						exact
						onNavigate={close}
					/>
					<NavLink
						href="/dashboard/instances"
						label={s.instances}
						icon={<IconInstances />}
						onNavigate={close}
					/>

					<SectionLabel label={s.billing} />
					<NavLink
						href="/dashboard/billing"
						label={s.invoices}
						icon={<IconInvoice />}
						exact
						onNavigate={close}
					/>
					<NavLink
						href="/dashboard/billing/subscriptions"
						label={s.subscriptions}
						icon={<IconSubscription />}
						onNavigate={close}
					/>

					<SectionLabel label={s.account} />
					<NavLink
						href="/dashboard/settings"
						label={s.profile}
						icon={<IconProfile />}
						exact
						onNavigate={close}
					/>
					<NavLink
						href="/dashboard/settings/security"
						label={s.security}
						icon={<IconSecurity />}
						onNavigate={close}
					/>

					<div className="mt-auto pt-4">
						<SectionLabel label="" />
						<NavLink
							href="/dashboard/support"
							label={s.support}
							icon={<IconSupport />}
							onNavigate={close}
						/>
					</div>
				</nav>

				{/* User + logout */}
				<div className="flex items-center gap-3 border-white/8 border-t px-4 py-4">
					<div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-tk-primary/30 bg-tk-primary/20">
						<span className="font-code font-semibold text-[0.75rem] text-tk-primary">
							{(user.name ?? user.email ?? "?")[0]?.toUpperCase()}
						</span>
					</div>
					<div className="min-w-0 flex-1">
						<p className="truncate font-body font-medium text-[0.8125rem] text-white/80 leading-tight">
							{user.name ?? user.email}
						</p>
						<p className="truncate font-code text-[0.6875rem] text-white/35">
							{user.email}
						</p>
					</div>
					<LogoutButton dict={d} compact />
				</div>
			</aside>
		</>
	);
}
