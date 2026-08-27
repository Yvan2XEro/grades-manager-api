import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
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
	onPageChange,
	onPageSizeChange,
}: DataTableProps<TData>) {
	const { t } = useTranslation();
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		manualPagination: true,
		pageCount: Math.ceil(total / pageSize),
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
							{headerGroup.headers.map((header) => (
								<TableHead key={header.id}>
									{header.isPlaceholder
										? null
										: flexRender(
												header.column.columnDef.header,
												header.getContext(),
											)}
								</TableHead>
							))}
						</TableRow>
					))}
				</TableHeader>
				<TableBody>
					{isLoading ? (
						<TableRow>
							<TableCell
								colSpan={columns.length}
								className="h-24 text-center text-muted-foreground"
							>
								{t("common.loading", "Loading…")}
							</TableCell>
						</TableRow>
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
						table.getRowModel().rows.map((row) => (
							<TableRow key={row.id}>
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
