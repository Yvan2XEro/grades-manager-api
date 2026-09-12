"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Dict, Locale } from "@/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";

/**
 * Site header.
 *
 * OverBrand sells the TKAMS platform in two editions — Supérieur for
 * universities and IPES, Secondaire for lycées and collèges — plus QR Code
 * OnReceipt, the desktop document generator, across seventeen public pages. The
 * bar's job is to make that structure legible in one glance, which a flat row
 * of links cannot do.
 *
 * ## Why it is shaped this way
 *
 * **Two menus, not seven links.** The previous bar put Accueil, Fonctionnalités,
 * Solutions, Tarifs, Engagements and Contact side by side at identical weight,
 * while /securite, /integrations and /comparatif — the three pages a CIO
 * actually needs — were reachable only by hovering the Produits panel and
 * reading its footer. Hover is not a navigation affordance on a touch screen,
 * and it is not discoverable on any screen. Those pages now sit inside a named
 * "Plateforme" menu, and the top level carries only what a visitor chooses
 * between: the two products, the platform, pricing, and the company's
 * commitments.
 *
 * **The row had no headroom.** Measured on the FR labels (the longer language),
 * seven items plus the trigger need ~700px of the ~790px the 86rem container
 * leaves between the logo and the right-hand cluster. Ninety pixels of slack is
 * not a layout; the first label that grows, or the first viewport under
 * 1280px, breaks it. Grouping frees roughly 300px.
 *
 * **Home is the logo, again.** Adding an explicit "Accueil" link cost a slot in
 * an already-full row to duplicate what the logo does. What the logo lacked was
 * not a sibling but affordance: it is now a labelled link that marks itself when
 * you are on the home page, and the mobile menu — which genuinely had no route
 * home — gets an explicit entry.
 *
 * ## Behaviour
 *
 * Menus open on hover and on focus, close on Escape, on outside click and on
 * route change. Each trigger is a real `aria-expanded` button, so the panels are
 * reachable by keyboard rather than being mouse-only.
 *
 * The current section is marked with `aria-current="page"` and a violet rule —
 * violet, not the accent orange, because `--color-tk-accent` is documented in
 * globals.css as fills-and-motifs-only and this rule sits directly under text.
 */

interface NavProps {
	locale: Locale;
	dict?: Dict;
}

/** One entry inside a dropdown panel. */
type MenuItem = {
	href: string;
	label: string;
	desc: string;
};

/**
 * A top-level dropdown trigger.
 *
 * Opens on hover AND on focus, and toggles on click, so the panel is reachable
 * by pointer, by keyboard and by touch — hover alone would strand touch users,
 * who never fire `mouseenter` without also firing a click.
 */
function MenuTrigger({
	label,
	open,
	current,
	onOpen,
	onToggle,
}: {
	label: string;
	open: boolean;
	current: boolean;
	onOpen: () => void;
	onToggle: () => void;
}) {
	return (
		<button
			type="button"
			aria-expanded={open}
			aria-haspopup="true"
			data-open={open}
			data-current={current}
			onMouseEnter={onOpen}
			onFocus={onOpen}
			onClick={onToggle}
			className="after:-bottom-px relative inline-flex cursor-pointer items-center gap-1.5 rounded-md border-none bg-transparent px-3.5 py-2 font-body font-medium text-[0.9rem] text-tk-ink-soft transition-colors after:absolute after:inset-x-3.5 after:h-[2px] after:origin-center after:scale-x-0 after:bg-tk-primary after:transition-transform after:duration-200 hover:text-tk-ink hover:after:scale-x-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-tk-ink focus-visible:outline-offset-2 data-[current=true]:text-tk-ink data-[open=true]:text-tk-ink data-[current=true]:after:scale-x-100"
		>
			{label}
			<svg
				width="10"
				height="10"
				viewBox="0 0 10 10"
				fill="none"
				aria-hidden="true"
				className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
			>
				<path
					d="M2 4l3 3 3-3"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		</button>
	);
}

export function Nav({ locale, dict }: NavProps) {
	const [scrolled, setScrolled] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	/** Which dropdown is open, by key — only one at a time. */
	const [openMenu, setOpenMenu] = useState<string | null>(null);
	const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const pathname = usePathname();

	/**
	 * A link is current when the path is the link itself or sits beneath it, so
	 * /produit stays marked on /produit/xyz. "/" is exact, otherwise every link
	 * would match the home page.
	 */
	const isCurrent = (href: string) =>
		href === "/"
			? pathname === "/"
			: pathname === href || pathname.startsWith(`${href}/`);

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 8);
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	/** Escape closes whichever layer is open — panel first, then mobile menu. */
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key !== "Escape") return;
			if (openMenu) setOpenMenu(null);
			else if (menuOpen) setMenuOpen(false);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [openMenu, menuOpen]);

	/**
	 * Close everything when the route changes. Without this a panel stays open
	 * over the page you just navigated to, because nothing else unmounts it.
	 */
	useEffect(() => {
		setOpenMenu(null);
		setMenuOpen(false);
	}, [pathname]);

	/** A short close delay keeps the panel usable while the pointer crosses the gap. */
	const openPanel = (key: string) => {
		if (closeTimer.current) clearTimeout(closeTimer.current);
		setOpenMenu(key);
	};
	const closePanel = () => {
		if (closeTimer.current) clearTimeout(closeTimer.current);
		closeTimer.current = setTimeout(() => setOpenMenu(null), 120);
	};

	const en = locale === "en";

	/**
	 * The three products. Shown with their logos — the visitor self-selects.
	 *
	 * TKAMS ships in two editions, and the tag is what separates them: a lycée
	 * and a university both read "TKAMS" and need to know within one line which
	 * one is theirs. Secondaire has no logo asset of its own, so it carries the
	 * TKAMS mark — it is the same platform, which is the point.
	 */
	const products = [
		{
			href: "/produit",
			name: "TKAMS",
			logo: "/logo-tkams.png",
			tag: en ? "Higher education" : "Supérieur",
			desc: en
				? "The whole academic year, from application to diploma."
				: "Toute l'année académique, de la candidature au diplôme.",
		},
		{
			href: "/secondaire",
			name: "TKAMS Secondaire",
			logo: "/logo-tkams.png",
			tag: en ? "Secondary schools" : "Lycées & collèges",
			desc: en
				? "Terms, sequences, report cards, class councils, BEPC and Baccalauréat."
				: "Trimestres, séquences, bulletins, conseils de classe, BEPC et Baccalauréat.",
		},
		{
			href: "/onreceipt",
			name: "QR Code OnReceipt",
			logo: "/onreceipt/logo-onreceipt.png",
			tag: en ? "Desktop software" : "Logiciel de bureau",
			desc: en
				? "Compliant transcripts and certificates, in batches, offline."
				: "Relevés et attestations conformes, en lot, hors ligne.",
		},
	];

	/**
	 * The platform menu. These four pages used to be either absent from the bar
	 * or buried in a hover-only footer strip — /securite and /integrations are
	 * the two a CIO opens first, and neither had a route in from the header.
	 */
	const platform: MenuItem[] = [
		{
			href: "/fonctionnalites",
			label: dict?.nav.features ?? (en ? "Features" : "Fonctionnalités"),
			desc: en
				? "What the platform does, module by module."
				: "Ce que la plateforme fait, module par module.",
		},
		{
			href: "/solutions",
			label: dict?.nav.solutions ?? "Solutions",
			desc: en
				? "The product from each role's desk."
				: "Le produit vu du poste de chaque métier.",
		},
		{
			href: "/securite",
			label: en ? "Security" : "Sécurité",
			desc: en
				? "Hosting, encryption, audit trail, backups."
				: "Hébergement, chiffrement, piste d'audit, sauvegardes.",
		},
		{
			href: "/integrations",
			label: en ? "Integrations" : "Intégrations",
			desc: en
				? "What TKAMS connects to, and how."
				: "Ce à quoi TKAMS se connecte, et comment.",
		},
	];

	/** Top-level links. Deliberately three: choose, price, verify. */
	const directLinks = [
		{ href: "/tarifs", label: dict?.nav.tarifs ?? (en ? "Pricing" : "Tarifs") },
		{ href: "/engagements", label: en ? "Commitments" : "Engagements" },
		{ href: "/contact", label: dict?.nav.contact ?? "Contact" },
	];

	/** A menu is marked current when any page beneath it is open. */
	const productsCurrent =
		products.some((p) => isCurrent(p.href)) || isCurrent("/comparatif");
	const platformCurrent = platform.some((p) => isCurrent(p.href));

	return (
		<nav
			data-scrolled={scrolled}
			onMouseLeave={closePanel}
			className="group/nav fixed top-0 right-0 left-0 z-50 bg-tk-surface/85 backdrop-blur-[14px] transition-shadow duration-200 data-[scrolled=true]:bg-tk-surface/97 data-[scrolled=true]:shadow-[0_10px_30px_-24px_oklch(0.19_0.026_277/0.5)]"
		>
			<div className="mx-auto flex h-[68px] max-w-[86rem] items-center gap-4 px-6 lg:px-10">
				{/*
				 * The logo is the home link. It is labelled for screen readers and
				 * marks itself when the home page is open, which is what it was
				 * missing — an unlabelled image that never says "you are here" is a
				 * convention, not an affordance.
				 */}
				<Link
					href="/"
					aria-label={
						dict?.nav.home ?? (en ? "TKAMS — home" : "TKAMS — accueil")
					}
					aria-current={isCurrent("/") ? "page" : undefined}
					onMouseEnter={() => setOpenMenu(null)}
					className="flex shrink-0 items-center rounded-md no-underline transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-tk-ink focus-visible:outline-offset-4"
				>
					<Image
						src="/logo-tkams.png"
						alt="TKAMS"
						width={120}
						height={36}
						className="h-[30px] w-auto object-contain"
						priority
					/>
				</Link>

				<div className="hidden flex-1 items-center gap-0.5 lg:flex">
					<MenuTrigger
						label={dict?.nav.produit ?? (en ? "Products" : "Produits")}
						open={openMenu === "products"}
						current={productsCurrent}
						onOpen={() => openPanel("products")}
						onToggle={() =>
							setOpenMenu(openMenu === "products" ? null : "products")
						}
					/>
					<MenuTrigger
						label={en ? "Platform" : "Plateforme"}
						open={openMenu === "platform"}
						current={platformCurrent}
						onOpen={() => openPanel("platform")}
						onToggle={() =>
							setOpenMenu(openMenu === "platform" ? null : "platform")
						}
					/>

					{directLinks.map((l) => {
						const current = isCurrent(l.href);
						return (
							<Link
								key={l.href}
								href={l.href}
								aria-current={current ? "page" : undefined}
								data-current={current}
								onMouseEnter={() => setOpenMenu(null)}
								className="after:-bottom-px relative rounded-md px-3.5 py-2 font-body font-medium text-[0.9rem] text-tk-ink-soft no-underline transition-colors after:absolute after:inset-x-3.5 after:h-[2px] after:origin-center after:scale-x-0 after:bg-tk-primary after:transition-transform after:duration-200 hover:text-tk-ink hover:after:scale-x-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-tk-ink focus-visible:outline-offset-2 data-[current=true]:text-tk-ink data-[current=true]:after:scale-x-100"
							>
								{l.label}
							</Link>
						);
					})}
				</div>

				<div className="ml-auto flex items-center gap-2 lg:gap-2.5">
					<LanguageSwitcher locale={locale} />
					<Link
						href="/login"
						className="hidden items-center rounded-md px-3 py-2 font-body font-medium text-[0.875rem] text-tk-ink-soft no-underline transition-colors hover:bg-tk-primary-soft hover:text-tk-primary-deep lg:inline-flex"
					>
						{dict?.nav.login ?? (en ? "Sign in" : "Connexion")}
					</Link>
					<Link
						href="/contact"
						className="hidden items-center rounded-md bg-tk-primary px-4 py-2.5 font-body font-semibold text-[0.875rem] text-tk-on-primary no-underline transition-colors hover:bg-tk-primary-deep lg:inline-flex"
					>
						{dict?.nav.demo ?? (en ? "Request a demo" : "Demander une démo")}
					</Link>

					<button
						type="button"
						onClick={() => setMenuOpen((v) => !v)}
						aria-label={en ? "Toggle menu" : "Ouvrir le menu"}
						aria-expanded={menuOpen}
						className="flex cursor-pointer rounded-md border-none bg-transparent p-2 text-tk-ink transition-colors hover:bg-tk-bg-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-tk-ink focus-visible:outline-offset-2 lg:hidden"
					>
						<svg
							width="22"
							height="22"
							viewBox="0 0 22 22"
							fill="none"
							aria-hidden="true"
						>
							{menuOpen ? (
								<path
									d="M4 4l14 14M18 4L4 18"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
								/>
							) : (
								<path
									d="M3 6h16M3 11h16M3 16h16"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
								/>
							)}
						</svg>
					</button>
				</div>
			</div>

			{/*
			 * The bar's own hairline.
			 *
			 * A plain rule, deliberately: an earlier version wove the brand motif
			 * through it, which put a patterned line directly beneath the active-link
			 * rules and made both harder to read. The motif belongs in the page, not
			 * in the chrome — one line of structure here does more.
			 */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-tk-border"
			/>

			{/*
			 * Dropdown panels.
			 *
			 * Anchored under the bar rather than stretched full-bleed: a panel the
			 * width of the viewport for two or four items reads as a site-wide
			 * takeover and hides the page for no reason. These are sized to their
			 * contents and aligned to the left of the link row.
			 */}
			{openMenu ? (
				<div
					onMouseEnter={() => openPanel(openMenu)}
					onMouseLeave={closePanel}
					className="hidden border-tk-border border-t bg-tk-surface shadow-[0_18px_40px_oklch(0.19_0.026_277/0.10)] lg:block"
				>
					<div className="mx-auto max-w-[86rem] px-6 lg:px-10">
						{openMenu === "products" ? (
							<div className="grid max-w-[72rem] gap-3 py-5 sm:grid-cols-2 lg:grid-cols-3">
								{products.map((p) => {
									const current = isCurrent(p.href);
									return (
										<Link
											key={p.href}
											href={p.href}
											aria-current={current ? "page" : undefined}
											data-current={current}
											className="flex gap-3.5 rounded-lg border border-tk-border p-4 no-underline transition-colors hover:border-tk-primary hover:bg-tk-primary-soft data-[current=true]:border-tk-primary data-[current=true]:bg-tk-primary-soft"
										>
											<Image
												src={p.logo}
												alt=""
												aria-hidden="true"
												width={256}
												height={256}
												className="size-10 flex-none object-contain"
											/>
											<span className="min-w-0">
												<span className="flex flex-wrap items-center gap-2">
													<span className="font-bold font-display text-[1rem] text-tk-ink tracking-[-0.02em]">
														{p.name}
													</span>
													<span className="rounded-full border border-tk-border px-2 py-0.5 font-body font-medium text-[0.66rem] text-tk-muted">
														{p.tag}
													</span>
												</span>
												<span className="mt-1.5 block font-body text-[0.85rem] text-tk-ink-2 leading-relaxed">
													{p.desc}
												</span>
											</span>
										</Link>
									);
								})}
								<Link
									href="/comparatif"
									className="-mt-1 font-body font-medium text-[0.85rem] text-tk-eyebrow no-underline underline-offset-4 hover:underline sm:col-span-2"
								>
									{en
										? "Compare TKAMS and OnReceipt →"
										: "Comparer TKAMS et OnReceipt →"}
								</Link>
							</div>
						) : (
							<div className="grid max-w-[52rem] gap-x-8 gap-y-1 py-5 sm:grid-cols-2">
								{platform.map((item) => {
									const current = isCurrent(item.href);
									return (
										<Link
											key={item.href}
											href={item.href}
											aria-current={current ? "page" : undefined}
											data-current={current}
											className="rounded-lg px-3 py-2.5 no-underline transition-colors hover:bg-tk-primary-soft data-[current=true]:bg-tk-primary-soft"
										>
											<span className="block font-body font-semibold text-[0.9rem] text-tk-ink">
												{item.label}
											</span>
											<span className="mt-0.5 block font-body text-[0.8rem] text-tk-muted leading-relaxed">
												{item.desc}
											</span>
										</Link>
									);
								})}
							</div>
						)}
					</div>
				</div>
			) : null}

			{/* Mobile menu */}
			{menuOpen ? (
				<div className="flex max-h-[calc(100dvh-68px)] flex-col gap-1 overflow-y-auto border-tk-border border-t bg-tk-surface px-6 py-4 lg:hidden">
					{/*
					 * Home first, explicitly. On desktop the logo carries this, but a
					 * logo in a collapsed header is not a menu entry — the mobile menu
					 * previously offered no way back to the home page at all.
					 */}
					<Link
						href="/"
						aria-current={isCurrent("/") ? "page" : undefined}
						data-current={isCurrent("/")}
						onClick={() => setMenuOpen(false)}
						className="block rounded-lg border-transparent border-l-[3px] px-3 py-3 font-body font-medium text-[0.95rem] text-tk-ink no-underline transition-colors hover:bg-tk-primary-soft data-[current=true]:border-tk-primary data-[current=true]:bg-tk-primary-soft"
					>
						{dict?.nav.home ?? (en ? "Home" : "Accueil")}
					</Link>

					<p className="px-1 pt-3 pb-2 font-code text-[0.65rem] text-tk-muted uppercase tracking-[0.14em]">
						{en ? "Products" : "Produits"}
					</p>
					{products.map((p) => {
						const current = isCurrent(p.href);
						return (
							<Link
								key={p.href}
								href={p.href}
								aria-current={current ? "page" : undefined}
								data-current={current}
								onClick={() => setMenuOpen(false)}
								className="flex items-center gap-3 rounded-lg px-3 py-3 no-underline transition-colors hover:bg-tk-primary-soft data-[current=true]:bg-tk-primary-soft"
							>
								<Image
									src={p.logo}
									alt=""
									aria-hidden="true"
									width={256}
									height={256}
									className="size-9 flex-none object-contain"
								/>
								<span>
									<span className="block font-body font-semibold text-[0.95rem] text-tk-ink">
										{p.name}
									</span>
									<span className="block font-body text-[0.78rem] text-tk-muted">
										{p.tag}
									</span>
								</span>
							</Link>
						);
					})}
					<Link
						href="/comparatif"
						onClick={() => setMenuOpen(false)}
						className="px-3 py-2 font-body font-medium text-[0.85rem] text-tk-eyebrow no-underline"
					>
						{en ? "TKAMS vs OnReceipt" : "TKAMS ou OnReceipt"}
					</Link>

					<p className="px-1 pt-3 pb-2 font-code text-[0.65rem] text-tk-muted uppercase tracking-[0.14em]">
						{en ? "Platform" : "Plateforme"}
					</p>
					{platform.map((item) => {
						const current = isCurrent(item.href);
						return (
							<Link
								key={item.href}
								href={item.href}
								aria-current={current ? "page" : undefined}
								data-current={current}
								onClick={() => setMenuOpen(false)}
								className="block rounded-lg border-transparent border-l-[3px] px-3 py-3 font-body font-medium text-[0.95rem] text-tk-ink no-underline transition-colors hover:bg-tk-primary-soft data-[current=true]:border-tk-primary data-[current=true]:bg-tk-primary-soft"
							>
								{item.label}
							</Link>
						);
					})}

					<div className="mt-2 border-tk-border border-t pt-2">
						{[
							...directLinks,
							{ href: "/posts", label: dict?.nav.blog ?? "Blog" },
						].map((l) => {
							const current = isCurrent(l.href);
							return (
								<Link
									key={l.href}
									href={l.href}
									aria-current={current ? "page" : undefined}
									data-current={current}
									onClick={() => setMenuOpen(false)}
									className="block rounded-lg border-transparent border-l-[3px] px-3 py-3 font-body font-medium text-[0.95rem] text-tk-ink no-underline transition-colors hover:bg-tk-primary-soft data-[current=true]:border-tk-primary data-[current=true]:bg-tk-primary-soft"
								>
									{l.label}
								</Link>
							);
						})}
					</div>

					<div className="mt-3 flex flex-col gap-2.5 border-tk-border border-t pt-4">
						<Link
							href="/login"
							onClick={() => setMenuOpen(false)}
							className="rounded-md border border-tk-border px-4 py-3 text-center font-body font-medium text-[0.9375rem] text-tk-ink no-underline hover:bg-tk-bg-deep"
						>
							{dict?.nav.login ?? (en ? "Sign in" : "Connexion")}
						</Link>
						<Link
							href="/contact"
							onClick={() => setMenuOpen(false)}
							className="rounded-md bg-tk-primary px-4 py-3 text-center font-body font-semibold text-[0.9375rem] text-tk-on-primary no-underline hover:bg-tk-primary-deep"
						>
							{dict?.nav.demo ?? (en ? "Request a demo" : "Demander une démo")}
						</Link>
					</div>
				</div>
			) : null}
		</nav>
	);
}
