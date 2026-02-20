import type React from "react";

const LoadingScreen: React.FC = () => {
	return (
		<div
			style={{
				position: "fixed",
				inset: 0,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "#ffffff",
				zIndex: 9999,
				fontFamily: "'Plus Jakarta Sans', sans-serif",
				overflow: "hidden",
			}}
		>
			{/* Background glow */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					background:
						"radial-gradient(circle at 50% 50%, rgba(123,123,246,0.08) 0%, transparent 60%)",
					pointerEvents: "none",
				}}
			/>

			<div
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: 40,
					position: "relative",
				}}
			>
				{/* Logo animation area */}
				<div
					style={{
						position: "relative",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					{/* Orbit rings with particles */}
					<div style={orbitStyle(160, "6s", "normal")}>
						<div
							style={{
								position: "absolute",
								top: 0,
								left: "50%",
								transform: "translateX(-50%)",
								width: 6,
								height: 6,
								borderRadius: "50%",
								background: "#7B7BF6",
								opacity: 0.7,
								boxShadow: "0 0 10px rgba(123,123,246,0.5)",
							}}
						/>
						<div
							style={{
								position: "absolute",
								bottom: 0,
								left: "50%",
								transform: "translateX(-50%)",
								width: 4,
								height: 4,
								borderRadius: "50%",
								background: "#7B7BF6",
								opacity: 0.4,
							}}
						/>
					</div>
					<div style={orbitStyle(130, "4s", "reverse")}>
						<div
							style={{
								position: "absolute",
								top: "50%",
								right: 0,
								transform: "translateY(-50%)",
								width: 5,
								height: 5,
								borderRadius: "50%",
								background: "#9D9DFF",
								opacity: 0.5,
								boxShadow: "0 0 8px rgba(157,157,255,0.4)",
							}}
						/>
					</div>

					{/* Corner brackets */}
					<div style={cornersContainerStyle}>
						<div
							style={{
								...cornerStyle,
								top: 0,
								left: 0,
								borderWidth: "2px 0 0 2px",
								borderRadius: "3px 0 0 0",
							}}
						/>
						<div
							style={{
								...cornerStyle,
								top: 0,
								right: 0,
								borderWidth: "2px 2px 0 0",
								borderRadius: "0 3px 0 0",
							}}
						/>
						<div
							style={{
								...cornerStyle,
								bottom: 0,
								left: 0,
								borderWidth: "0 0 2px 2px",
								borderRadius: "0 0 0 3px",
							}}
						/>
						<div
							style={{
								...cornerStyle,
								bottom: 0,
								right: 0,
								borderWidth: "0 2px 2px 0",
								borderRadius: "0 0 3px 0",
							}}
						/>
					</div>

					{/* Logo mark */}
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 6,
							position: "relative",
							zIndex: 1,
						}}
					>
						<div style={badgeStyle}>
							{/* Gradient overlay */}
							<div
								style={{
									position: "absolute",
									inset: 0,
									borderRadius: 18,
									background:
										"linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)",
									pointerEvents: "none",
								}}
							/>
							{/* Scan light */}
							<div
								style={{
									position: "absolute",
									top: "-100%",
									width: "40%",
									height: "300%",
									background:
										"linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
									transform: "rotate(25deg)",
									animation: "tklScan 2.4s ease-in-out infinite",
									pointerEvents: "none",
								}}
							/>
							<span
								style={{
									fontSize: 42,
									fontWeight: 800,
									color: "white",
									letterSpacing: -1,
									position: "relative",
									zIndex: 1,
								}}
							>
								TK
							</span>
						</div>
						<span style={amsStyle}>AMS</span>
					</div>
				</div>

				{/* Progress bar */}
				<div
					style={{
						width: 220,
						height: 4,
						background: "rgba(123,123,246,0.12)",
						borderRadius: 4,
						overflow: "hidden",
					}}
				>
					<div style={progressFillStyle} />
				</div>

				{/* Loading text */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 2,
						fontSize: 13,
						fontWeight: 700,
						color: "rgba(21,21,56,0.4)",
						letterSpacing: 3,
						textTransform: "uppercase",
					}}
				>
					Chargement
					{[0, 0.2, 0.4].map((delay, i) => (
						<span
							key={i}
							style={{
								width: 4,
								height: 4,
								borderRadius: "50%",
								background: "rgba(21,21,56,0.4)",
								marginLeft: 2,
								display: "inline-block",
								animation: `tklDotPulse 1.4s ease-in-out ${delay}s infinite`,
							}}
						/>
					))}
				</div>
			</div>

			<style>{`
				@keyframes tklBadgePulse {
					0%,100% { transform:scale(1); box-shadow:0 4px 20px rgba(123,123,246,0.25); }
					50% { transform:scale(1.04); box-shadow:0 8px 35px rgba(123,123,246,0.35); }
				}
				@keyframes tklScan {
					0%,100% { left:-60%; }
					50% { left:120%; }
				}
				@keyframes tklAmsReveal {
					0%,15% { opacity:0; transform:translateX(-8px); }
					30%,70% { opacity:1; transform:translateX(0); }
					85%,100% { opacity:0; transform:translateX(-8px); }
				}
				@keyframes tklProgressSlide {
					0% { transform:translateX(-100%); }
					100% { transform:translateX(350%); }
				}
				@keyframes tklDotPulse {
					0%,80%,100% { opacity:0.3; transform:scale(0.8); }
					40% { opacity:1; transform:scale(1.2); }
				}
				@keyframes tklOrbit {
					to { transform:rotate(360deg); }
				}
				@keyframes tklOrbitR {
					to { transform:rotate(-360deg); }
				}
				@keyframes tklCornerPulse {
					0%,100% { opacity:0.5; transform:scale(1); }
					50% { opacity:1; transform:scale(1.06); }
				}
			`}</style>
		</div>
	);
};

const badgeStyle: React.CSSProperties = {
	width: 88,
	height: 88,
	background: "#7B7BF6",
	borderRadius: 18,
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	position: "relative",
	overflow: "hidden",
	animation: "tklBadgePulse 2.4s ease-in-out infinite",
};

const amsStyle: React.CSSProperties = {
	fontSize: 42,
	fontWeight: 800,
	color: "#151538",
	letterSpacing: 1,
	animation: "tklAmsReveal 2.4s ease-in-out infinite",
};

const progressFillStyle: React.CSSProperties = {
	height: "100%",
	width: "40%",
	background: "linear-gradient(90deg, #5C5CD6, #7B7BF6, #9D9DFF)",
	borderRadius: 4,
	animation: "tklProgressSlide 1.6s ease-in-out infinite",
};

function orbitStyle(
	size: number,
	duration: string,
	direction: string,
): React.CSSProperties {
	return {
		position: "absolute",
		width: size,
		height: size,
		borderRadius: "50%",
		animation: `${direction === "reverse" ? "tklOrbitR" : "tklOrbit"} ${duration} linear infinite`,
	};
}

const cornersContainerStyle: React.CSSProperties = {
	position: "absolute",
	width: 110,
	height: 110,
	animation: "tklCornerPulse 2.4s ease-in-out infinite",
};

const cornerStyle: React.CSSProperties = {
	position: "absolute",
	width: 16,
	height: 16,
	borderColor: "rgba(123,123,246,0.3)",
	borderStyle: "solid",
};

export default LoadingScreen;
