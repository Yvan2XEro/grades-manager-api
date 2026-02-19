import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "./button";

type PaginationBarProps = {
	hasPrev: boolean;
	hasNext: boolean;
	onPrev: () => void;
	onNext: () => void;
	isLoading?: boolean;
};

export function PaginationBar({
	hasPrev,
	hasNext,
	onPrev,
	onNext,
	isLoading,
}: PaginationBarProps) {
	const { t } = useTranslation();

	if (!hasPrev && !hasNext) return null;

	return (
		<div className="flex items-center justify-end gap-2 pt-4">
			<Button
				variant="outline"
				size="sm"
				onClick={onPrev}
				disabled={!hasPrev || isLoading}
			>
				<ChevronLeft className="mr-1 h-4 w-4" />
				{t("common.pagination.previous", { defaultValue: "Previous" })}
			</Button>
			<Button
				variant="outline"
				size="sm"
				onClick={onNext}
				disabled={!hasNext || isLoading}
			>
				{t("common.pagination.next", { defaultValue: "Next" })}
				<ChevronRight className="ml-1 h-4 w-4" />
			</Button>
		</div>
	);
}
