import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";
import { staggerItem } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { useDashboardPages } from "../../hooks/use-dashboard-pages";
import type { KpiCard } from "../../types";

export function StatCard({ card, label }: { card: KpiCard; label: string }) {
	const count = useAnimatedCounter(card.count);
	const openPage = useDashboardPages();
	return (
		<motion.div
			variants={staggerItem}
			whileHover={{ y: -3 }}
			transition={{ duration: 0.15 }}
		>
			<button
				type="button"
				className="block w-full text-left"
				onClick={() => openPage(card.page)}
			>
				<Card className="group cursor-pointer border-0 shadow-sm transition-all duration-200 hover:shadow-lg">
					{/* Phones: icon above the text so the label gets the full width */}
					<CardContent className="relative flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
						<div
							className={cn(
								"flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-110 sm:h-12 sm:w-12",
								card.gradient,
								card.iconColor,
							)}
						>
							{card.icon}
						</div>
						<div className="min-w-0 flex-1">
							<p className="line-clamp-2 break-words font-medium text-muted-foreground text-xs uppercase tracking-wide">
								{label}
							</p>
							<p className="animate-counter-in font-bold font-heading text-2xl text-foreground tabular-nums leading-tight">
								{count.toLocaleString()}
								{card.suffix && (
									<span className="font-semibold text-base">{card.suffix}</span>
								)}
							</p>
							{card.hint && (
								<p className="mt-0.5 text-muted-foreground text-xs">
									{card.hint}
								</p>
							)}
						</div>
						<ArrowUpRight className="group-hover:-translate-y-0.5 absolute top-4 right-4 h-4 w-4 shrink-0 text-muted-foreground/30 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary sm:static" />
					</CardContent>
				</Card>
			</button>
		</motion.div>
	);
}
