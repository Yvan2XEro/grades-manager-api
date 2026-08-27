import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Select, SelectOption } from "@/components/ui/select";

interface TablePaginationProps {
	page: number;
	pageSize: number;
	total: number;
	onPageChange: (page: number) => void;
	onPageSizeChange: (size: number) => void;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function TablePagination({
	page,
	pageSize,
	total,
	onPageChange,
	onPageSizeChange,
}: TablePaginationProps) {
	const { t } = useTranslation();
	const pageCount = Math.max(1, Math.ceil(total / pageSize));
	const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
	const to = Math.min(page * pageSize, total);

	return (
		<div className="flex items-center justify-between gap-4 px-2 py-3">
			<div className="flex items-center gap-2 text-muted-foreground text-sm">
				<span>{t("common.rows_per_page", "Rows per page")}</span>
				<Select
					value={pageSize}
					onChange={(e) => {
						onPageSizeChange(Number(e.target.value));
						onPageChange(1);
					}}
					className="h-8 w-20 px-2 py-1"
				>
					{PAGE_SIZE_OPTIONS.map((s) => (
						<SelectOption key={s} value={s}>
							{s}
						</SelectOption>
					))}
				</Select>
				<span>
					{total === 0
						? t("common.no_results", "No results")
						: t("common.pagination_info", "{{from}}–{{to}} of {{total}}", {
								from,
								to,
								total,
							})}
				</span>
			</div>
			<div className="flex items-center gap-1">
				<Button
					variant="outline"
					size="icon"
					onClick={() => onPageChange(1)}
					disabled={page === 1}
					className="h-8 w-8"
				>
					<ChevronsLeft className="h-4 w-4" />
				</Button>
				<Button
					variant="outline"
					size="icon"
					onClick={() => onPageChange(page - 1)}
					disabled={page === 1}
					className="h-8 w-8"
				>
					<ChevronLeft className="h-4 w-4" />
				</Button>
				<span className="min-w-[80px] text-center text-muted-foreground text-sm">
					{t("common.page_of", "Page {{page}} of {{pageCount}}", {
						page,
						pageCount,
					})}
				</span>
				<Button
					variant="outline"
					size="icon"
					onClick={() => onPageChange(page + 1)}
					disabled={page >= pageCount}
					className="h-8 w-8"
				>
					<ChevronRight className="h-4 w-4" />
				</Button>
				<Button
					variant="outline"
					size="icon"
					onClick={() => onPageChange(pageCount)}
					disabled={page >= pageCount}
					className="h-8 w-8"
				>
					<ChevronsRight className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}
