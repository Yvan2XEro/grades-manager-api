import type React from "react";

/**
 * DemoFrame — the window chrome that stages a live, interactive demo.
 *
 * The frame is deliberately quiet: a single hairline, one soft shadow, a flat
 * title bar. Everything that competes for attention has been removed, because
 * the demo inside it is the proof and the frame is only the mount. The old
 * red/amber/green "traffic light" dots were the loudest thing on the homepage
 * and read as a desktop-OS pastiche; they are now neutral, and the status dot
 * uses the accent rather than a semantic green — green and red belong to the
 * data inside the demos, never to decoration around them.
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
			<div className="overflow-hidden rounded-[14px] border border-tk-border-strong bg-tk-surface shadow-[0_24px_60px_oklch(0.205_0.02_65/0.14)]">
				<div className="flex items-center gap-2 border-tk-border border-b bg-tk-bg-deep px-4 py-2.5">
					<div className="flex gap-1.5" aria-hidden="true">
						<span className="h-2.5 w-2.5 rounded-full bg-tk-border-strong" />
						<span className="h-2.5 w-2.5 rounded-full bg-tk-border-strong" />
						<span className="h-2.5 w-2.5 rounded-full bg-tk-border-strong" />
					</div>
					<div className="mx-auto flex items-center gap-1.5 rounded-md border border-tk-border bg-tk-surface px-3 py-1 font-code text-[0.7rem] text-tk-muted">
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
				<div className="bg-tk-surface">{children}</div>
			</div>
			{caption ? (
				<figcaption className="mt-3 flex items-center gap-2 font-body text-[0.8125rem] text-tk-muted italic">
					<span
						aria-hidden="true"
						className="inline-block h-1.5 w-1.5 rounded-full bg-tk-accent"
					/>
					{caption}
				</figcaption>
			) : null}
		</figure>
	);
}
