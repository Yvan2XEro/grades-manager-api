import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { trpc } from "@/utils/trpc";

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

	const { data, isLoading } = trpc.tracks.list.useQuery({ page, pageSize });

	const items = data?.items ?? [];
	const total = data?.total ?? 0;

	const columns: ColumnDef<Track>[] = [
		{
			accessorKey: "name",
			header: t("tracks.col_name", "Track"),
			cell: ({ row }) => (
				<span className="font-medium text-foreground">{row.original.name}</span>
			),
		},
		{
			accessorKey: "code",
			header: t("tracks.col_code", "Code"),
			cell: ({ row }) => (
				<span className="text-muted-foreground">{row.original.code}</span>
			),
		},
		{
			accessorKey: "cycleLevel",
			header: t("tracks.col_level", "Cycle"),
			cell: ({ row }) => (
				<Badge
					variant={CYCLE_LEVEL_VARIANTS[row.original.cycleLevel] ?? "secondary"}
				>
					{row.original.cycleLevel.replace("_", " ")}
				</Badge>
			),
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
			</div>

			<DataTable
				columns={columns}
				data={items}
				total={total}
				page={page}
				pageSize={pageSize}
				isLoading={isLoading}
				emptyMessage={t("tracks.empty", "No tracks defined")}
				onPageChange={setPage}
				onPageSizeChange={(s) => {
					setPageSize(s);
					setPage(1);
				}}
			/>
		</div>
	);
}
