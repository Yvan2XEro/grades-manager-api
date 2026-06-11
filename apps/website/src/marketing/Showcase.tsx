import Image from "next/image";
import type React from "react";

/**
 * Showcase — a styled slot for product screenshots / images.
 *
 * While you have not uploaded an image yet, it renders an elegant editorial
 * placeholder showing exactly which file to drop in `public/<src>` and the
 * recommended pixel size. As soon as you pass a real `src` (a file that exists
 * under /public), it renders the actual image inside the chosen frame.
 *
 * Usage once your file is uploaded:
 *   <Showcase src="/screenshots/dashboard.png" ... />
 * Until then, leave `src` undefined and the placeholder guides the upload.
 */

type Variant = "browser" | "frame" | "bare";
type Theme = "light" | "dark";

interface ShowcaseProps {
	/** Path under /public, e.g. "/screenshots/dashboard.png". Omit to show placeholder. */
	src?: string;
	alt: string;
	/** Intrinsic pixel size — also shown as the recommended size in the placeholder. */
	width: number;
	height: number;
	/** Fake URL shown in the browser chrome (browser variant only). */
	url?: string;
	/** Short label describing what belongs here (shown in the placeholder). */
	label?: string;
	/** Caption rendered under the frame. */
	caption?: string;
	variant?: Variant;
	theme?: Theme;
	priority?: boolean;
	className?: string;
	/** Tailwind sizes attribute for responsive loading. */
	sizes?: string;
}

const dot = [
	"oklch(0.7 0.18 25)",
	"oklch(0.75 0.16 86)",
	"oklch(0.6 0.17 149)",
];

function PlaceholderBody({
	caption,
	label,
	width,
	height,
	theme,
}: {
	caption?: string;
	label?: string;
	width: number;
	height: number;
	theme: Theme;
}) {
	const isDark = theme === "dark";
	return (
		<div
			className={`flex h-full w-full flex-col items-center justify-center gap-3 border border-dashed p-6 text-center ${
				isDark
					? "border-white/15 bg-white/[0.02]"
					: "border-tk-border-strong bg-tk-bg-deep/40"
			}`}
			style={{
				backgroundImage: isDark
					? "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)"
					: "linear-gradient(oklch(0.13 0.03 264 / 0.025) 1px, transparent 1px), linear-gradient(90deg, oklch(0.13 0.03 264 / 0.025) 1px, transparent 1px)",
				backgroundSize: "28px 28px",
			}}
		>
			<svg
				width="34"
				height="34"
				viewBox="0 0 34 34"
				fill="none"
				className={isDark ? "text-white/30" : "text-tk-muted"}
				aria-hidden="true"
			>
				<rect
					x="3"
					y="6"
					width="28"
					height="22"
					rx="3"
					stroke="currentColor"
					strokeWidth="1.5"
				/>
				<circle
					cx="12"
					cy="14"
					r="2.5"
					stroke="currentColor"
					strokeWidth="1.5"
				/>
				<path
					d="M6 25l7-7 4 4 5-5 6 6"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
			{label ? (
				<p
					className={`max-w-[36ch] font-body font-medium text-[0.9rem] ${
						isDark ? "text-tk-on-dark-soft" : "text-tk-ink-2"
					}`}
				>
					{label}
				</p>
			) : null}
			<div className="flex flex-col items-center gap-1">
				<span
					className={`rounded-full px-2.5 py-0.5 font-code text-[0.7rem] tracking-[0.05em] ${
						isDark
							? "bg-white/8 text-tk-on-dark-soft"
							: "bg-tk-primary-soft text-tk-primary"
					}`}
				>
					À UPLOADER · {width} × {height} px
				</span>
				{caption ? (
					<code
						className={`font-code text-[0.7rem] ${
							isDark ? "text-white/35" : "text-tk-muted"
						}`}
					>
						{caption}
					</code>
				) : null}
			</div>
		</div>
	);
}

export function Showcase({
	src,
	alt,
	width,
	height,
	url = "app.tkams.com",
	label,
	caption,
	variant = "browser",
	theme = "light",
	priority = false,
	className = "",
	sizes = "(min-width: 1024px) 60vw, 100vw",
}: ShowcaseProps) {
	const isDark = theme === "dark";
	const aspect = `${width} / ${height}`;

	const media = src ? (
		<Image
			src={src}
			alt={alt}
			width={width}
			height={height}
			priority={priority}
			sizes={sizes}
			className="h-full w-full object-cover"
		/>
	) : (
		<PlaceholderBody
			caption={caption}
			label={label}
			width={width}
			height={height}
			theme={theme}
		/>
	);

	const frameBorder = isDark ? "border-white/10" : "border-tk-border-strong";
	const frameBg = isDark ? "bg-tk-dark-2" : "bg-tk-surface";
	const shadow = isDark
		? "shadow-[0_32px_80px_oklch(0_0_0/0.45)]"
		: "shadow-[0_24px_70px_oklch(0.13_0.03_264/0.12)]";

	let frame: React.ReactNode;

	if (variant === "bare") {
		frame = (
			<div
				className="relative w-full overflow-hidden"
				style={{ aspectRatio: aspect }}
			>
				{media}
			</div>
		);
	} else if (variant === "frame") {
		frame = (
			<div
				className={`overflow-hidden rounded-2xl border ${frameBorder} ${shadow}`}
			>
				<div
					className="relative w-full overflow-hidden"
					style={{ aspectRatio: aspect }}
				>
					{media}
				</div>
			</div>
		);
	} else {
		// browser variant — institutional app-window chrome
		frame = (
			<div
				className={`overflow-hidden rounded-2xl border ${frameBorder} ${frameBg} ${shadow}`}
			>
				<div
					className={`flex items-center gap-2 border-b px-4 py-3 ${
						isDark ? "border-white/8" : "border-tk-border"
					}`}
				>
					<div className="flex gap-1.5">
						{dot.map((c) => (
							<span
								key={c}
								className="h-2.5 w-2.5 rounded-full"
								style={{ background: c }}
							/>
						))}
					</div>
					<div
						className={`mx-auto flex items-center gap-1.5 rounded-md px-3 py-1 font-code text-[0.7rem] ${
							isDark
								? "bg-white/6 text-tk-on-dark-soft"
								: "bg-tk-bg-deep text-tk-muted"
						}`}
					>
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
				<div
					className="relative w-full overflow-hidden"
					style={{ aspectRatio: aspect }}
				>
					{media}
				</div>
			</div>
		);
	}

	return (
		<figure className={`m-0 ${className}`}>
			{frame}
			{src && caption ? (
				<figcaption
					className={`mt-3 font-code text-[0.75rem] tracking-[0.02em] ${
						isDark ? "text-tk-on-dark-soft" : "text-tk-muted"
					}`}
				>
					{caption}
				</figcaption>
			) : null}
		</figure>
	);
}
