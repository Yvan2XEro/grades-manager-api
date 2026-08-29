import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";

interface DataTableProps<TData> {
	columns: ColumnDef<TData>[];
	data: TData[];
	total: number;
	page: number;
	pageSize: number;
	isLoading?: boolean;
	emptyMessage?: string;
	/** Pass sorting + onSortingChange for server-side sort. Omit both for client-side. */
	sorting?: SortingState;
	onSortingChange?: (sorting: SortingState) => void;
	onPageChange: (page: number) => void;
	onPageSizeChange: (size: number) => void;
}

export function DataTable<TData>({
	columns,
	data,
	total,
	page,
	pageSize,
	isLoading,
	emptyMessage,
	sorting: externalSorting,
	onSortingChange,
	onPageChange,
	onPageSizeChange,
}: DataTableProps<TData>) {
	const { t } = useTranslation();
	// Internal sort state — only used when no external sort control is provided
	const [internalSorting, setInternalSorting] = useState<SortingState>([]);

	const serverSide = !!onSortingChange;
	const sorting = serverSide ? (externalSorting ?? []) : internalSorting;

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: serverSide ? undefined : getSortedRowModel(),
		manualPagination: true,
		manualSorting: serverSide,
		pageCount: Math.ceil(total / pageSize),
		state: { sorting },
		onSortingChange: serverSide
			? (updater) => {
					const next =
						typeof updater === "function" ? updater(sorting) : updater;
					onSortingChange(next);
				}
			: (updater) => {
					const next =
						typeof updater === "function" ? updater(internalSorting) : updater;
					setInternalSorting(next);
				},
	});

	return (
		<div className="overflow-hidden rounded-xl border border-border">
			<Table>
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow
							key={headerGroup.id}
							className="bg-muted/40 hover:bg-muted/40"
						>
							{headerGroup.headers.map((header) => {
								const canSort = header.column.getCanSort();
								const sorted = header.column.getIsSorted();
								return (
									<TableHead
										key={header.id}
										onClick={
											canSort
												? header.column.getToggleSortingHandler()
												: undefined
										}
										className={canSort ? "cursor-pointer select-none" : ""}
									>
										{header.isPlaceholder ? null : (
											<span className="inline-flex items-center gap-1">
												{flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
												{canSort && (
													<span className="text-muted-foreground/60">
														{sorted === "asc" ? (
															<ChevronUp className="h-3.5 w-3.5" />
														) : sorted === "desc" ? (
															<ChevronDown className="h-3.5 w-3.5" />
														) : (
															<ChevronsUpDown className="h-3.5 w-3.5" />
														)}
													</span>
												)}
											</span>
										)}
									</TableHead>
								);
							})}
						</TableRow>
					))}
				</TableHeader>
				<TableBody>
					{isLoading ? (
						Array.from({ length: Math.min(pageSize, 6) }, (_, i) => (
							<TableRow key={i} className="hover:bg-transparent">
								{columns.map((_, ci) => (
									<TableCell key={ci}>
										<Skeleton className="h-4 w-full" />
									</TableCell>
								))}
							</TableRow>
						))
					) : table.getRowModel().rows.length === 0 ? (
						<TableRow>
							<TableCell
								colSpan={columns.length}
								className="h-24 text-center text-muted-foreground"
							>
								{emptyMessage ?? t("common.no_data", "No data")}
							</TableCell>
						</TableRow>
					) : (
						table.getRowModel().rows.map((row, ri) => (
							<TableRow
								key={row.id}
								className={
									ri % 2 === 1
										? "bg-black/[0.04] hover:bg-black/[0.06] dark:bg-white/[0.05] dark:hover:bg-white/[0.07]"
										: "hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
								}
							>
								{row.getVisibleCells().map((cell) => (
									<TableCell key={cell.id}>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
			<div className="border-border border-t">
				<TablePagination
					page={page}
					pageSize={pageSize}
					total={total}
					onPageChange={onPageChange}
					onPageSizeChange={onPageSizeChange}
				/>
			</div>
		</div>
	);
}

export type { SortingState };
