"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";
import { LogoutButton } from "@/auth/LogoutButton";
import type { Dict } from "@/i18n";
import type { User } from "@/payload-types";

type NavItem = {
	href: string;
	label: string;
	icon: React.ReactNode;
	exact?: boolean;
};

function NavLink({ href, label, icon, exact = false }: NavItem) {
	const pathname = usePathname();
	const active = exact
		? pathname === href
		: pathname === href || pathname.startsWith(`${href}/`);

	return (
		<Link
			href={href}
			className={`flex items-center gap-2.5 rounded-[0.5rem] px-3 py-2 font-body text-[0.875rem] no-underline transition-all duration-150 ${
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

	return (
		<aside className="fixed top-0 left-0 z-50 flex h-screen w-[240px] flex-col bg-tk-dark">
			{/* Logo */}
			<div className="border-white/8 border-b px-5 py-5">
				<Link
					href="/dashboard"
					className="flex items-center gap-2 no-underline"
				>
					<Image
						src="/logo-tkams.png"
						alt="TKAMS"
						width={96}
						height={28}
						className="h-7 w-auto object-contain brightness-0 invert"
						priority
					/>
				</Link>
			</div>

			{/* Nav */}
			<nav className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
				<SectionLabel label={s.general} />
				<NavLink href="/dashboard" label={s.home} icon={<IconHome />} exact />
				<NavLink
					href="/dashboard/instances"
					label={s.instances}
					icon={<IconInstances />}
				/>

				<SectionLabel label={s.billing} />
				<NavLink
					href="/dashboard/billing"
					label={s.invoices}
					icon={<IconInvoice />}
					exact
				/>
				<NavLink
					href="/dashboard/billing/subscriptions"
					label={s.subscriptions}
					icon={<IconSubscription />}
				/>

				<SectionLabel label={s.account} />
				<NavLink
					href="/dashboard/settings"
					label={s.profile}
					icon={<IconProfile />}
					exact
				/>
				<NavLink
					href="/dashboard/settings/security"
					label={s.security}
					icon={<IconSecurity />}
				/>

				<div className="mt-auto pt-4">
					<SectionLabel label="" />
					<NavLink
						href="/dashboard/support"
						label={s.support}
						icon={<IconSupport />}
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
	);
}
