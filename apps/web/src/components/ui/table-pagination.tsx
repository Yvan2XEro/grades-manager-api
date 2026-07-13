import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface TablePaginationProps {
	page: number;
	pageCount: number;
	total: number;
	pageSize: number;
	onPageChange: (page: number) => void;
	onPageSizeChange?: (size: number) => void;
}

export function TablePagination({
	page,
	pageCount,
	total,
	pageSize,
	onPageChange,
	onPageSizeChange,
}: TablePaginationProps) {
	const start = Math.min((page - 1) * pageSize + 1, total);
	const end = Math.min(page * pageSize, total);

	// Build page number list: always show first, last, current ±1, with ellipsis
	function getPages(): (number | "ellipsis")[] {
		if (pageCount <= 7)
			return Array.from({ length: pageCount }, (_, i) => i + 1);
		const pages: (number | "ellipsis")[] = [1];
		if (page > 3) pages.push("ellipsis");
		for (
			let p = Math.max(2, page - 1);
			p <= Math.min(pageCount - 1, page + 1);
			p++
		) {
			pages.push(p);
		}
		if (page < pageCount - 2) pages.push("ellipsis");
		pages.push(pageCount);
		return pages;
	}

	if (pageCount <= 1 && total <= pageSize) return null;

	return (
		<div className="flex flex-wrap items-center justify-between gap-3 pt-2">
			<p className="text-muted-foreground text-sm">
				{total === 0 ? "No results" : `Showing ${start}–${end} of ${total}`}
			</p>

			<div className="flex items-center gap-3">
				<Pagination>
					<PaginationContent>
						<PaginationItem>
							<PaginationPrevious
								onClick={() => onPageChange(page - 1)}
								aria-disabled={page <= 1}
								className={
									page <= 1
										? "pointer-events-none opacity-50"
										: "cursor-pointer"
								}
							/>
						</PaginationItem>

						{getPages().map((p, i) =>
							p === "ellipsis" ? (
								// biome-ignore lint/suspicious/noArrayIndexKey: stable ellipsis position
								<PaginationItem key={`ellipsis-${i}`}>
									<PaginationEllipsis />
								</PaginationItem>
							) : (
								<PaginationItem key={p}>
									<PaginationLink
										isActive={p === page}
										onClick={() => onPageChange(p)}
										className="cursor-pointer"
									>
										{p}
									</PaginationLink>
								</PaginationItem>
							),
						)}

						<PaginationItem>
							<PaginationNext
								onClick={() => onPageChange(page + 1)}
								aria-disabled={page >= pageCount}
								className={
									page >= pageCount
										? "pointer-events-none opacity-50"
										: "cursor-pointer"
								}
							/>
						</PaginationItem>
					</PaginationContent>
				</Pagination>

				{onPageSizeChange && (
					<Select
						value={String(pageSize)}
						onValueChange={(v) => onPageSizeChange(Number(v))}
					>
						<SelectTrigger className="h-8 w-[90px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{[10, 25, 50, 100].map((s) => (
								<SelectItem key={s} value={String(s)}>
									{s} / page
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}
			</div>
		</div>
	);
}
