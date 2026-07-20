import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "./button";

type PaginationBarProps = {
	hasPrev: boolean;
	hasNext: boolean;
	onPrev: () => void;
	onNext: () => void;
	isLoading?: boolean;
	page?: number;
	totalPages?: number;
};

export function PaginationBar({
	hasPrev,
	hasNext,
	onPrev,
	onNext,
	isLoading,
	page,
	totalPages,
}: PaginationBarProps) {
	const { t } = useTranslation();

	if (!hasPrev && !hasNext) return null;

	const pageLabel =
		page !== undefined
			? totalPages !== undefined
				? `${t("common.pagination.page", { defaultValue: "Page" })} ${page} / ${totalPages}`
				: hasNext
					? `${t("common.pagination.page", { defaultValue: "Page" })} ${page}`
					: `${t("common.pagination.page", { defaultValue: "Page" })} ${page} / ${page}`
			: null;

	return (
		<div className="flex items-center justify-end gap-2 pt-4">
			<Button
				variant="outline"
				size="sm"
				onClick={onPrev}
				disabled={!hasPrev || isLoading}
			>
				<ChevronLeft className="mr-1 h-4 w-4" />
				{t("common.pagination.previous", { defaultValue: "Précédent" })}
			</Button>
			{pageLabel && (
				<span className="px-2 text-center text-muted-foreground text-sm tabular-nums">
					{pageLabel}
				</span>
			)}
			<Button
				variant="outline"
				size="sm"
				onClick={onNext}
				disabled={!hasNext || isLoading}
			>
				{t("common.pagination.next", { defaultValue: "Suivant" })}
				<ChevronRight className="ml-1 h-4 w-4" />
			</Button>
		</div>
	);
}
