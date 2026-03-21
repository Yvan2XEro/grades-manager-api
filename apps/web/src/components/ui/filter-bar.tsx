import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Filter, RotateCcw } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";
import { Button } from "./button";

type FilterBarProps = {
	activeCount: number;
	onReset: () => void;
	children: React.ReactNode;
	className?: string;
	defaultOpen?: boolean;
	label?: string;
};

export function FilterBar({
	activeCount,
	onReset,
	children,
	className,
	defaultOpen = false,
	label,
}: FilterBarProps) {
	const { t } = useTranslation();
	const [isOpen, setIsOpen] = useState(defaultOpen || activeCount > 0);

	return (
		<div
			className={cn(
				"overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md",
				className,
			)}
		>
			{/* Header trigger */}
			<button
				type="button"
				onClick={() => setIsOpen((v) => !v)}
				className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
			>
				<div
					className={cn(
						"flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
						activeCount > 0
							? "bg-primary/10 text-primary"
							: "bg-muted text-muted-foreground",
					)}
				>
					<Filter className="h-3.5 w-3.5" />
				</div>

				<span className="font-medium text-sm">{label ?? t("components.filterBar.label")}</span>

				{activeCount > 0 && (
					<Badge className="h-5 bg-primary px-1.5 text-[10px] text-primary-foreground">
						{activeCount} actif{activeCount > 1 ? "s" : ""}
					</Badge>
				)}

				<div className="ml-auto flex items-center gap-2">
					{activeCount > 0 && (
						<Button
							variant="ghost"
							size="sm"
							className="h-6 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
							onClick={(e) => {
								e.stopPropagation();
								onReset();
							}}
						>
							<RotateCcw className="h-3 w-3" />
							{t("components.filterBar.reset")}
						</Button>
					)}
					<ChevronDown
						className={cn(
							"h-4 w-4 text-muted-foreground transition-transform duration-200",
							isOpen && "rotate-180",
						)}
					/>
				</div>
			</button>

			{/* Collapsible body */}
			<AnimatePresence initial={false}>
				{isOpen && (
					<motion.div
						key="filter-body"
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
						className="overflow-hidden"
					>
						<div className="border-t px-4 py-4">{children}</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
