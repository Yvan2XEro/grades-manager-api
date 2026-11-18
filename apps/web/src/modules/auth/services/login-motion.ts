import type { Variants } from "framer-motion";

/** Stagger of the login screens. */
export const loginContainer: Variants = {
	hidden: {},
	visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

export const loginItem: Variants = {
	hidden: { opacity: 0, y: 14 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};
