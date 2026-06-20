"use client";

import {
	FileText,
	HelpCircle,
	Home,
	Menu,
	Monitor,
	Shield,
	User,
	X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import { LogoutButton } from "@/auth/LogoutButton";
import type { Dict } from "@/i18n";
import type { User as PayloadUser } from "@/payload-types";

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

export function Sidebar({ user, dict: d }: { user: PayloadUser; dict: Dict }) {
	const s = d.dashboard.sidebar;
	const pathname = usePathname();
	const [open, setOpen] = useState(false);

	useEffect(() => {
		setOpen(false);
	}, [pathname]);

	useEffect(() => {
		if (!open) return;
		const previous = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = previous;
		};
	}, [open]);

	const close = () => setOpen(false);

	const iconSize = 15;
	const iconStroke = 1.6;

	return (
		<>
			{/* ── Mobile top bar ── */}
			<header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-white/8 border-b bg-tk-dark px-4 md:hidden">
				<Link href="/dashboard" className="flex items-center no-underline">
					<Image
						src="/logo-tkams.png"
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
					aria-label="Open menu"
					className="flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10"
				>
					<Menu size={20} strokeWidth={1.75} />
				</button>
			</header>

			{/* ── Backdrop ── */}
			{open && (
				<button
					type="button"
					aria-label="Close menu"
					onClick={close}
					className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] md:hidden"
				/>
			)}

			{/* ── Sidebar ── */}
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
							src="/logo-tkams.png"
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
						aria-label="Close menu"
						className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white md:hidden"
					>
						<X size={18} strokeWidth={1.75} />
					</button>
				</div>

				{/* Nav */}
				<nav className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
					<SectionLabel label={s.general} />
					<NavLink
						href="/dashboard"
						label={s.home}
						icon={<Home size={iconSize} strokeWidth={iconStroke} />}
						exact
						onNavigate={close}
					/>
					<NavLink
						href="/dashboard/instances"
						label={s.instances}
						icon={<Monitor size={iconSize} strokeWidth={iconStroke} />}
						onNavigate={close}
					/>

					<SectionLabel label={s.billing} />
					<NavLink
						href="/dashboard/billing"
						label={s.invoices}
						icon={<FileText size={iconSize} strokeWidth={iconStroke} />}
						exact
						onNavigate={close}
					/>
					<SectionLabel label={s.account} />
					<NavLink
						href="/dashboard/settings"
						label={s.profile}
						icon={<User size={iconSize} strokeWidth={iconStroke} />}
						exact
						onNavigate={close}
					/>
					<NavLink
						href="/dashboard/settings/security"
						label={s.security}
						icon={<Shield size={iconSize} strokeWidth={iconStroke} />}
						onNavigate={close}
					/>

					<div className="mt-auto pt-4">
						<SectionLabel label="" />
						<NavLink
							href="/dashboard/support"
							label={s.support}
							icon={<HelpCircle size={iconSize} strokeWidth={iconStroke} />}
							onNavigate={close}
						/>
					</div>
				</nav>

				{/* User footer */}
				<div className="border-white/8 border-t px-4 py-4">
					<div className="mb-3 flex items-center gap-3">
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
					</div>
					<LogoutButton dict={d} compact />
				</div>
			</aside>
		</>
	);
}
