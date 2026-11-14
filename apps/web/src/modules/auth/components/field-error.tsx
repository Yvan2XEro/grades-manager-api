import { motion } from "framer-motion";
import { errorMsg } from "@/lib/animations";

/** Validation message under a field of the auth forms. */
export function FieldError({ message }: { message?: string }) {
	if (!message) return null;
	return (
		<motion.p
			variants={errorMsg}
			initial="hidden"
			animate="visible"
			className="text-destructive text-sm"
		>
			{message}
		</motion.p>
	);
}
