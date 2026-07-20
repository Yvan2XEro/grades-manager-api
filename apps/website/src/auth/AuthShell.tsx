import Image from "next/image";
import Link from "next/link";
import type React from "react";
import type { Dict } from "@/i18n";
import { DemoFrame } from "@/marketing/demos/DemoFrame";

/**
 * Editorial split-screen shell for the auth pages (login / signup):
 * left = light brand panel showcasing a live product demo; right = form.
 * The brand panel is hidden on small screens (form stays centered).
 */
export function AuthShell({
	dict: d,
	demo,
	children,
}: {
	dict: Dict;
	demo: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<main className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
			{/* Brand panel with live demo */}
			<aside className="relative hidden overflow-hidden border-tk-border border-r bg-tk-bg-deep px-10 py-12 lg:flex lg:flex-col lg:justify-between xl:px-14">
				<div
					className="pointer-events-none absolute inset-0 opacity-[0.6]"
					style={{
						backgroundImage:
							"linear-gradient(oklch(0.13 0.03 264 / 0.03) 1px, transparent 1px), linear-gradient(90deg, oklch(0.13 0.03 264 / 0.03) 1px, transparent 1px)",
						backgroundSize: "32px 32px",
					}}
				/>
				<div
					className="pointer-events-none absolute top-[6%] left-[8%] h-[420px] w-[420px]"
					style={{
						background:
							"radial-gradient(ellipse at center, oklch(0.48 0.2 277 / 0.1) 0%, transparent 70%)",
					}}
				/>

				<div className="relative z-[1] flex items-center justify-between">
					<Link href="/" className="inline-flex">
						<Image
							src="/logo-tkams.png"
							alt="TKAMS"
							width={120}
							height={36}
							className="h-9 w-auto object-contain"
							priority
						/>
					</Link>
					<span className="font-code font-semibold text-[0.7rem] text-tk-primary uppercase tracking-[0.14em]">
						{d.trust.pioneer_tag}
					</span>
				</div>

				<div className="relative z-[1]">
					<p className="mb-6 max-w-md font-bold font-display text-[clamp(1.25rem,1.8vw,1.75rem)] text-tk-ink leading-[1.2] tracking-[-0.02em]">
						{d.footer.tagline}
					</p>
					<DemoFrame url="app.tkams.com">{demo}</DemoFrame>
				</div>

				<div className="relative z-[1] flex items-center gap-2 font-code text-[0.72rem] text-tk-muted">
					<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-tk-accent-emerald" />
					{d.trust.sub}
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
