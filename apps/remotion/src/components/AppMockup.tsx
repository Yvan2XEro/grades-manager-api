/**
 * AppMockup — Cadre navigateur light mode
 */
import type React from "react";
import { Img, staticFile } from "remotion";
import { C, F } from "../lib/theme";

interface AppMockupProps {
	src: string;
	width?: number;
	height?: number;
	tilt?: number;
	shadow?: boolean;
	label?: string;
}

export const AppMockup: React.FC<AppMockupProps> = ({
	src,
	width = 960,
	height = 540,
	tilt = 0,
	shadow = true,
	label,
}) => {
	const barH = 38;

	return (
		<div
			style={{
				width,
				display: "flex",
				flexDirection: "column",
				borderRadius: 12,
				overflow: "hidden",
				border: `1px solid ${C.border}`,
				boxShadow: shadow
					? "0 2px 8px rgba(28,20,16,0.08), 0 16px 48px rgba(28,20,16,0.12), 0 0 0 1px rgba(28,20,16,0.04)"
					: undefined,
				transform:
					tilt !== 0 ? `perspective(1400px) rotateY(${tilt}deg)` : undefined,
				transformOrigin: tilt < 0 ? "right center" : "left center",
			}}
		>
			{/* Barre navigateur light */}
			<div
				style={{
					height: barH,
					background: "#F4F1ED",
					borderBottom: `1px solid ${C.border}`,
					display: "flex",
					alignItems: "center",
					padding: "0 14px",
					gap: 7,
					flexShrink: 0,
				}}
			>
				{(["#FF5F57", "#FFBD2E", "#28C840"] as const).map((color, i) => (
					<div
						key={i}
						style={{
							width: 11,
							height: 11,
							borderRadius: "50%",
							backgroundColor: color,
							opacity: 0.85,
						}}
					/>
				))}
				<div
					style={{
						marginLeft: 12,
						flex: 1,
						height: 22,
						borderRadius: 5,
						background: C.bgCard,
						border: `1px solid ${C.border}`,
						display: "flex",
						alignItems: "center",
						paddingLeft: 10,
						maxWidth: 340,
					}}
				>
					<span
						style={{ fontFamily: F.mono, fontSize: 11, color: C.textFaint }}
					>
						{label ?? "localhost:5174/admin"}
					</span>
				</div>
			</div>

			<div
				style={{
					width,
					height,
					overflow: "hidden",
					position: "relative",
					background: C.bgCard,
				}}
			>
				<Img
					src={staticFile(`screens/${src}`)}
					style={{
						width: "100%",
						height: "100%",
						objectFit: "cover",
						objectPosition: "top",
					}}
				/>
			</div>
		</div>
	);
};
