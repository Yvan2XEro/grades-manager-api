"use client";

export default function Icon() {
	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				width: 32,
				height: 32,
				borderRadius: 6,
				background: "#4f6ef7",
				flexShrink: 0,
			}}
		>
			<span
				style={{
					color: "#fff",
					fontWeight: 700,
					fontSize: 16,
					letterSpacing: "-0.5px",
					fontFamily: "system-ui, sans-serif",
				}}
			>
				T
			</span>
		</div>
	);
}
