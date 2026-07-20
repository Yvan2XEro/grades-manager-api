import type React from "react";
import { Audio, interpolate, useCurrentFrame } from "remotion";

interface FadingAudioProps {
	src: string;
	baseVolume?: number;
	fadeInFrames?: number;
	fadeOutFrames?: number;
	sceneDuration: number;
}

/**
 * Audio component with automatic fade-in and fade-out to prevent abrupt cuts
 * at scene boundaries when used inside Series.Sequence.
 */
export const FadingAudio: React.FC<FadingAudioProps> = ({
	src,
	baseVolume = 0.9,
	fadeInFrames = 10,
	fadeOutFrames = 22,
	sceneDuration,
}) => {
	const frame = useCurrentFrame();
	const volume = interpolate(frame, [0, fadeInFrames], [0, baseVolume], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	return <Audio src={src} volume={volume} />;
};
