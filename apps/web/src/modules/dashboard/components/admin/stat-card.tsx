import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";
import { staggerItem } from "@/lib/animations";
import { cn } from "@/lib/utils";
import type { KpiCard } from "../../types";

export function StatCard({ card, label }: { card: KpiCard; label: string }) {
	const count = useAnimatedCounter(card.count);
	return (
		<motion.div
			variants={staggerItem}
			whileHover={{ y: -3 }}
			transition={{ duration: 0.15 }}
		>
			<Link to={card.href}>
				<Card className="group cursor-pointer border-0 shadow-sm transition-all duration-200 hover:shadow-lg">
					<CardContent className="flex items-center gap-4 p-5">
						<div
							className={cn(
								"flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-110",
								card.gradient,
								card.iconColor,
							)}
						>
							{card.icon}
						</div>
						<div className="min-w-0 flex-1">
							<p className="truncate font-medium text-muted-foreground text-xs uppercase tracking-wide">
								{label}
							</p>
							<p className="animate-counter-in font-bold font-heading text-2xl text-foreground tabular-nums leading-tight">
								{count.toLocaleString()}
								{card.suffix && (
									<span className="font-semibold text-base">{card.suffix}</span>
								)}
							</p>
						</div>
						<ArrowUpRight className="group-hover:-translate-y-0.5 h-4 w-4 shrink-0 text-muted-foreground/30 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
					</CardContent>
				</Card>
			</Link>
		</motion.div>
	);
}
