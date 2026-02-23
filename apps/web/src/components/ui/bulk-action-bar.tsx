import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "./button";

type BulkActionBarProps = {
	selectedCount: number;
	onClear: () => void;
	children: ReactNode;
};

export function BulkActionBar({
	selectedCount,
	onClear,
	children,
}: BulkActionBarProps) {
	const { t } = useTranslation();

	return (
		<AnimatePresence>
			{selectedCount > 0 && (
				<motion.div
					initial={{ opacity: 0, y: -8 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -8 }}
					transition={{ duration: 0.15 }}
					className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5"
				>
					<span className="font-medium text-primary text-sm">
						{t("common.bulkActions.selected", {
							defaultValue: "{{count}} selected",
							count: selectedCount,
						})}
					</span>
					<Button
						variant="ghost"
						size="sm"
						onClick={onClear}
						className="h-7 px-2 text-muted-foreground"
					>
						<X className="mr-1 h-3.5 w-3.5" />
						{t("common.bulkActions.clear", { defaultValue: "Clear" })}
					</Button>
					<div className="mx-1 h-5 w-px bg-border" />
					<div className="flex items-center gap-2">{children}</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
