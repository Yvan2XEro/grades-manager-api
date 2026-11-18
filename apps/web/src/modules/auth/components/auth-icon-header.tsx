import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { staggerItem } from "@/lib/animations";

/** Icon, title and subtitle at the top of the password forms. */
export function AuthIconHeader({
	icon: Icon,
	title,
	subtitle,
}: {
	icon: LucideIcon;
	title: string;
	subtitle: string;
}) {
	return (
		<motion.div variants={staggerItem} className="mb-8">
			<motion.div
				className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10"
				whileHover={{ scale: 1.05 }}
				transition={{ duration: 0.2 }}
			>
				<Icon className="h-6 w-6 text-primary" />
			</motion.div>
			<h2 className="text-foreground">{title}</h2>
			<p className="mt-2 text-muted-foreground text-sm">{subtitle}</p>
		</motion.div>
	);
}
