"use client";

export default function Logo() {
	return (
		<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src="/logo-tkams.png"
				alt="TKAMS"
				style={{ height: 32, width: "auto", objectFit: "contain" }}
			/>
		</div>
	);
}
