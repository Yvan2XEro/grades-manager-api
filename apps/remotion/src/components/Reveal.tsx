/**
 * Wrapper d'animation d'entrée réutilisable
 * direction: "up" | "down" | "left" | "right" | "scale" | "fade"
 */
import type React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface RevealProps {
	children: React.ReactNode;
	delay?: number;
	direction?: "up" | "down" | "left" | "right" | "scale" | "fade";
	distance?: number;
	damping?: number;
	stiffness?: number;
	style?: React.CSSProperties;
}

export const Reveal: React.FC<RevealProps> = ({
	children,
	delay = 0,
	direction = "up",
	distance = 48,
	damping = 16,
	stiffness = 120,
	style,
}) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const progress = spring({
		frame: frame - delay,
		fps,
		config: { damping, stiffness, mass: 0.8 },
		durationInFrames: 50,
	});

	const opacity = interpolate(progress, [0, 1], [0, 1]);

	let transform = "";
	if (direction === "up")
		transform = `translateY(${interpolate(progress, [0, 1], [distance, 0])}px)`;
	if (direction === "down")
		transform = `translateY(${interpolate(progress, [0, 1], [-distance, 0])}px)`;
	if (direction === "left")
		transform = `translateX(${interpolate(progress, [0, 1], [distance, 0])}px)`;
	if (direction === "right")
		transform = `translateX(${interpolate(progress, [0, 1], [-distance, 0])}px)`;
	if (direction === "scale")
		transform = `scale(${interpolate(progress, [0, 1], [0.88, 1])})`;
	if (direction === "fade") transform = "";

	return <div style={{ opacity, transform, ...style }}>{children}</div>;
};
