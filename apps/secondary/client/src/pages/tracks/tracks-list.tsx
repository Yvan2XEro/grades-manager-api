import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type SortingState } from "@/components/ui/data-table";
import { trpc } from "@/utils/trpc";
import { TrackFormDialog } from "./track-form-dialog";

type Track = {
	id: string;
	name: string;
	code: string;
	cycleLevel: string;
};

const CYCLE_LEVEL_VARIANTS: Record<
	string,
	"default" | "secondary" | "info" | "success"
> = {
	first_cycle: "info",
	second_cycle: "success",
	technical: "secondary",
};

export function TracksList() {
	const { t } = useTranslation();
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);
	const [showCreate, setShowCreate] = useState(false);
	const [sorting, setSorting] = useState<SortingState>([
		{ id: "code", desc: false },
	]);

	const sortCol = sorting[0];
	const orderBy = (sortCol?.id === "name" ? "name" : "code") as "name" | "code";
	const orderDir = (sortCol?.desc ? "desc" : "asc") as "asc" | "desc";

	const { data, isLoading } = trpc.tracks.list.useQuery({
		orderBy,
		orderDir,
		page,
		pageSize,
	});

	const items = data?.items ?? [];
	const total = data?.total ?? 0;

	const columns: ColumnDef<Track>[] = [
		{
			id: "name",
			accessorKey: "name",
			enableSorting: true,
			header: t("tracks.col_name", "Track"),
			cell: ({ row }) => (
				<Link
					to={`/tracks/${row.original.id}`}
					state={{
						name: row.original.name,
						code: row.original.code,
						cycleLevel: row.original.cycleLevel,
					}}
					className="font-medium text-foreground hover:underline"
				>
					{row.original.name}
				</Link>
			),
		},
		{
			id: "code",
			accessorKey: "code",
			enableSorting: true,
			header: t("tracks.col_code", "Code"),
			cell: ({ row }) => (
				<span className="text-muted-foreground">{row.original.code}</span>
			),
		},
		{
			id: "cycleLevel",
			accessorKey: "cycleLevel",
			enableSorting: false,
			header: t("tracks.col_level", "Cycle"),
			cell: ({ row }) => {
				const CYCLE_LABELS: Record<string, string> = {
					first_cycle: t("tracks.cycle_first", "1st cycle"),
					second_cycle: t("tracks.cycle_second", "2nd cycle"),
					technical: t("tracks.cycle_technical", "Technical"),
				};
				return (
					<Badge
						variant={
							CYCLE_LEVEL_VARIANTS[row.original.cycleLevel] ?? "secondary"
						}
					>
						{CYCLE_LABELS[row.original.cycleLevel] ?? row.original.cycleLevel}
					</Badge>
				);
			},
		},
	];

	return (
		<div className="space-y-5">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl text-foreground">
						{t("tracks.title", "Tracks")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{t(
							"tracks.subtitle",
							"Subject tracks for Cameroonian secondary schools",
						)}
					</p>
				</div>
				<Button onClick={() => setShowCreate(true)} size="sm">
					<Plus className="mr-2 h-4 w-4" />
					{t("tracks.create_btn", "New Track")}
				</Button>
			</div>

			<DataTable
				columns={columns}
				data={items}
				total={total}
				page={page}
				pageSize={pageSize}
				isLoading={isLoading}
				sorting={sorting}
				onSortingChange={(next) => {
					setSorting(next);
					setPage(1);
				}}
				emptyMessage={t("tracks.empty", "No tracks defined")}
				onPageChange={setPage}
				onPageSizeChange={(s) => {
					setPageSize(s);
					setPage(1);
				}}
			/>

			<TrackFormDialog
				open={showCreate}
				onOpenChange={setShowCreate}
				onSuccess={() => setShowCreate(false)}
			/>
		</div>
	);
}
