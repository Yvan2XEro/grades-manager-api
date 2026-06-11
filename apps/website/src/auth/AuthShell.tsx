import Image from "next/image";
import Link from "next/link";
import type React from "react";
import type { Dict } from "@/i18n";
import { TrustBadges } from "@/marketing/TrustBadges";

/**
 * Editorial split-screen shell for the auth pages (login / signup):
 * left = institutional brand panel with trust elements; right = the form.
 * The brand panel is hidden on small screens (form stays centered).
 */
export function AuthShell({
	dict: d,
	children,
}: {
	dict: Dict;
	children: React.ReactNode;
}) {
	return (
		<main className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
			{/* Brand panel */}
			<aside className="relative hidden overflow-hidden bg-tk-dark px-10 py-12 text-tk-on-dark lg:flex lg:flex-col lg:justify-between xl:px-16">
				<div className="tk-grid-pattern pointer-events-none absolute inset-0 opacity-60" />
				<div
					className="pointer-events-none absolute top-[8%] left-[10%] h-[420px] w-[420px]"
					style={{
						background:
							"radial-gradient(ellipse at center, oklch(0.48 0.2 277 / 0.16) 0%, transparent 70%)",
					}}
				/>

				<div className="relative z-[1]">
					<Link href="/" className="inline-flex">
						<Image
							src="/logo-tkams.png"
							alt="TKAMS"
							width={120}
							height={36}
							className="h-9 w-auto brightness-200"
							priority
						/>
					</Link>
				</div>

				<div className="relative z-[1] max-w-md">
					<span className="font-code font-semibold text-[0.7rem] text-tk-primary-bright uppercase tracking-[0.14em]">
						{d.trust.label}
					</span>
					<p className="mt-5 font-display font-extrabold text-[clamp(1.75rem,2.6vw,2.5rem)] text-tk-on-dark leading-[1.12] tracking-[-0.03em]">
						{d.footer.tagline}
					</p>
					<p className="mt-4 font-body text-[0.95rem] text-tk-on-dark-soft leading-[1.7]">
						{d.trust.sub}
					</p>
				</div>

				<div className="relative z-[1]">
					<div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3.5 py-1.5 font-code font-semibold text-[0.7rem] text-tk-primary-bright tracking-[0.04em]">
						<span className="h-1.5 w-1.5 rounded-full bg-tk-accent-emerald" />
						{d.trust.pioneer_tag}
					</div>
					<p className="mb-3 font-code text-[0.65rem] text-tk-on-dark-muted uppercase tracking-[0.14em]">
						{d.trust.badges_title}
					</p>
					<TrustBadges count={3} hint={d.trust.badges_hint} theme="dark" />
				</div>
			</aside>

			{/* Form panel */}
			<div className="flex flex-col justify-center bg-tk-bg px-6 py-12 sm:px-10">
				<div className="mx-auto w-full max-w-[420px]">
					<div className="mb-8 flex items-center justify-between lg:hidden">
						<Link href="/">
							<Image
								src="/logo-tkams.png"
								alt="TKAMS"
								width={110}
								height={33}
								className="h-8 w-auto object-contain"
								priority
							/>
						</Link>
					</div>
					{children}
					<p className="mt-8 text-center">
						<Link
							href="/"
							className="font-code text-[0.75rem] text-tk-muted tracking-[0.04em] no-underline transition-colors duration-150 hover:text-tk-ink-soft"
						>
							← {d.nav.home}
						</Link>
					</p>
				</div>
			</div>
		</main>
	);
}
