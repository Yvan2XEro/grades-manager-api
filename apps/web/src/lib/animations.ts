import type { Variants } from "framer-motion";

/** Stagger container — used to animate lists of children in cascade */
export const staggerContainer: Variants = {
	hidden: {},
	visible: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

/** Child item of a stagger container */
export const staggerItem: Variants = {
	hidden: { opacity: 0, y: 14 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.38, ease: "easeOut" },
	},
};

/** Simple fade + slide-up entrance */
export const fadeUp: Variants = {
	hidden: { opacity: 0, y: 18 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.42, ease: "easeOut" },
	},
};

/** Zoom + fade entrance */
export const scaleIn: Variants = {
	hidden: { opacity: 0, scale: 0.94 },
	visible: {
		opacity: 1,
		scale: 1,
		transition: { duration: 0.3, ease: "easeOut" },
	},
};

/** Form error message */
export const errorMsg: Variants = {
	hidden: { opacity: 0, y: -4 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.22, ease: "easeOut" },
	},
};
