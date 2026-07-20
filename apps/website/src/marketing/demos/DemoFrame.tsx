import type React from "react";

/**
 * DemoFrame — an institutional app-window chrome that wraps a live, interactive
 * demo (instead of a static screenshot). Same visual language as the previous
 * Showcase frame, but the body is real, clickable UI.
 */
export function DemoFrame({
	url = "app.tkams.com",
	caption,
	children,
	className = "",
}: {
	url?: string;
	caption?: string;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<figure className={`m-0 ${className}`}>
			<div className="overflow-hidden rounded-2xl border border-tk-border-strong bg-tk-surface shadow-[0_24px_70px_oklch(0.13_0.03_264/0.12)]">
				<div className="flex items-center gap-2 border-tk-border border-b px-4 py-3">
					<div className="flex gap-1.5">
						<span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.7_0.18_25)]" />
						<span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.75_0.16_86)]" />
						<span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6_0.17_149)]" />
					</div>
					<div className="mx-auto flex items-center gap-1.5 rounded-md bg-tk-bg-deep px-3 py-1 font-code text-[0.7rem] text-tk-muted">
						<svg
							width="9"
							height="9"
							viewBox="0 0 9 9"
							fill="none"
							aria-hidden="true"
						>
							<path
								d="M2.5 4V3a2 2 0 014 0v1"
								stroke="currentColor"
								strokeWidth="1"
								strokeLinecap="round"
							/>
							<rect
								x="1.5"
								y="4"
								width="6"
								height="4"
								rx="1"
								stroke="currentColor"
								strokeWidth="1"
							/>
						</svg>
						{url}
					</div>
				</div>
				<div className="bg-tk-bg">{children}</div>
			</div>
			{caption ? (
				<figcaption className="mt-3 flex items-center gap-2 font-code text-[0.75rem] text-tk-muted tracking-[0.02em]">
					<span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-tk-accent-emerald" />
					{caption}
				</figcaption>
			) : null}
		</figure>
	);
}
