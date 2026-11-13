import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	type RowData,
	useReactTable,
} from "@tanstack/react-table";
import type { ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import type { useRowSelection } from "@/hooks/useRowSelection";
import { cn } from "@/lib/utils";
import {
	type RowAction,
	RowActionsDropdown,
	RowContextMenuItems,
} from "./row-actions";

declare module "@tanstack/react-table" {
	interface ColumnMeta<TData extends RowData, TValue> {
		/** Classes applied to the header and every cell of the column (widths, alignment). */
		className?: string;
	}
}

interface DataTableProps<T extends { id: string }> {
	columns: ColumnDef<T, any>[];
	data: T[];
	isLoading?: boolean;
	onRowClick?: (row: T) => void;
	/** Actions of a row, shown in a trailing "…" menu and on right click. */
	rowActions?: (row: T) => RowAction[];
	/** Adds a leading checkbox column driven by `useRowSelection`. */
	selection?: ReturnType<typeof useRowSelection<T>>;
	/** Rendered instead of the table when `data` is empty. */
	empty?: ReactNode;
	className?: string;
}

/** Column-definition driven table; columns live in each module's `table/` folder. */
export function DataTable<T extends { id: string }>({
	columns,
	data,
	isLoading,
	onRowClick,
	rowActions,
	selection,
	empty,
	className,
}: DataTableProps<T>) {
	const table = useReactTable({
		data,
		columns,
		getRowId: (row) => row.id,
		getCoreRowModel: getCoreRowModel(),
	});

	const columnCount =
		columns.length + (selection ? 1 : 0) + (rowActions ? 1 : 0);
	if (isLoading) return <TableSkeleton columns={columnCount} rows={8} />;
	if (data.length === 0 && empty) return <>{empty}</>;

	const fixedLayout = columns.some((column) => column.meta?.className);

	return (
		<Table className={cn(fixedLayout && "table-fixed", className)}>
			<TableHeader>
				{table.getHeaderGroups().map((group) => (
					<TableRow key={group.id}>
						{selection && (
							<TableHead className="w-10">
								<Checkbox
									checked={selection.isAllSelected}
									onCheckedChange={(checked) => selection.toggleAll(!!checked)}
									aria-label="Select all"
								/>
							</TableHead>
						)}
						{group.headers.map((header) => (
							<TableHead
								key={header.id}
								className={cn(
									"truncate",
									header.column.columnDef.meta?.className,
								)}
							>
								{header.isPlaceholder
									? null
									: flexRender(
											header.column.columnDef.header,
											header.getContext(),
										)}
							</TableHead>
						))}
						{rowActions && <TableHead className="w-12" />}
					</TableRow>
				))}
			</TableHeader>
			<TableBody>
				{table.getRowModel().rows.map((row) => {
					const actions = rowActions?.(row.original) ?? [];
					return (
						<TableRow
							key={row.id}
							data-state={
								selection?.isSelected(row.id) ? "selected" : undefined
							}
							onClick={onRowClick ? () => onRowClick(row.original) : undefined}
							className={cn(onRowClick && "cursor-pointer")}
							actions={
								actions.length > 0 ? (
									<RowContextMenuItems actions={actions} />
								) : undefined
							}
						>
							{selection && (
								<TableCell onClick={(e) => e.stopPropagation()}>
									<Checkbox
										checked={selection.isSelected(row.id)}
										onCheckedChange={() => selection.toggle(row.id)}
										aria-label="Select row"
									/>
								</TableCell>
							)}
							{row.getVisibleCells().map((cell) => (
								<TableCell
									key={cell.id}
									className={cell.column.columnDef.meta?.className}
								>
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</TableCell>
							))}
							{rowActions && (
								<TableCell onClick={(e) => e.stopPropagation()}>
									<RowActionsDropdown actions={actions} />
								</TableCell>
							)}
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	);
}
