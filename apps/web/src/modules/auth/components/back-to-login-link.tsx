import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";
import { staggerItem } from "@/lib/animations";

export function BackToLoginLink({
	callbackURL,
	label,
}: {
	callbackURL: string | null;
	label: string;
}) {
	return (
		<motion.div variants={staggerItem} className="text-center">
			<Link
				to={`/auth/login?return=${callbackURL}`}
				className="inline-flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
			>
				<ArrowLeft className="h-4 w-4" />
				{label}
			</Link>
		</motion.div>
	);
}
