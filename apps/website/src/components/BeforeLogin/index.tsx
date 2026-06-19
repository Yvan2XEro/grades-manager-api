import type React from "react";

const BeforeLogin: React.FC = () => {
	return (
		<div
			style={{
				marginBottom: 24,
				padding: "16px 20px",
				background: "oklch(0.97 0.02 260)",
				borderRadius: 8,
				borderLeft: "3px solid #4f6ef7",
			}}
		>
			<p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.5 }}>
				<strong style={{ color: "#111827" }}>TKAMS Admin Panel</strong>
				<br />
				Restricted to administrators. Manage instances, client requests, and
				deployment settings.
			</p>
		</div>
	);
};

export default BeforeLogin;
