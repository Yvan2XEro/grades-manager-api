import { interpolate } from "remotion";

/**
 * Enveloppe d'opacité pour les transitions entre scènes.
 * Chaque scène fait un fade-in propre et un fade-out propre.
 */
export function sceneOpacity(
	frame: number,
	totalFrames: number,
	fadeInDuration = 18,
	fadeOutDuration = 22,
): number {
	const fadeIn =
		fadeInDuration > 0
			? interpolate(frame, [0, fadeInDuration], [0, 1], {
					extrapolateRight: "clamp",
				})
			: 1;
	const fadeOut =
		fadeOutDuration > 0
			? interpolate(
					frame,
					[totalFrames - fadeOutDuration, totalFrames],
					[1, 0],
					{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
				)
			: 1;
	return Math.min(fadeIn, fadeOut);
}
