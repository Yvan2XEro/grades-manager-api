import type { ColumnDef } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

type ClassRow = {
	id: string;
	name: string;
	level: string | null;
};

export function ReportCardsList() {
	const { t } = useTranslation();

	const { data: years = [] } = trpc.academicYears.list.useQuery();
	const activeYear = years.find((y) => y.status === "active") ?? years[0];
	const yearId = activeYear?.id ?? "";

	const { data: terms = [], isLoading: loadingTerms } =
		trpc.terms.list.useQuery({ academicYearId: yearId }, { enabled: !!yearId });

	const { data: classesData, isLoading: loadingClasses } =
		trpc.classes.list.useQuery(
			{ academicYearId: yearId, pageSize: 200 },
			{ enabled: !!yearId },
		);
	const classes = classesData?.items ?? [];

	const rows: ClassRow[] = classes.map((c) => ({
		id: c.id,
		name: c.name,
		level: c.level ?? null,
	}));

	const columns: ColumnDef<ClassRow>[] = [
		{
			id: "name",
			enableSorting: false,
			header: t("enrollments.col_class", "Class"),
			cell: ({ row }) => (
				<span className="font-medium text-foreground">{row.original.name}</span>
			),
		},
		{
			id: "level",
			enableSorting: false,
			header: t("classes.col_level", "Level"),
			cell: ({ row }) => (
				<span className="text-muted-foreground text-sm">
					{row.original.level ?? "—"}
				</span>
			),
		},
		{
			id: "terms",
			enableSorting: false,
			header: t("grades.term", "Term"),
			cell: ({ row }) => {
				if (loadingTerms) return <Skeleton className="h-5 w-24" />;
				if (!terms.length) {
					return (
						<Badge variant="secondary" className="text-xs">
							{t("report_cards.no_terms", "No terms configured")}
						</Badge>
					);
				}
				return (
					<div className="flex flex-wrap gap-1">
						{terms.map((trm) => (
							<Button
								key={trm.id}
								asChild
								variant="outline"
								size="sm"
								className="h-6 px-2 text-xs"
							>
								<Link to={`/report-cards/${row.original.id}/${trm.id}`}>
									{t(`terms.term_${trm.termNumber}`, `Term ${trm.termNumber}`)}
								</Link>
							</Button>
						))}
					</div>
				);
			},
		},
	];

	return (
		<div className="space-y-5">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="font-bold text-2xl text-foreground">
						{t("report_cards.title", "Report Cards")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{rows.length > 0
							? `${rows.length} ${t("classes.title", "classes")}`
							: t("report_cards.subtitle", "Generate and view report cards")}
					</p>
				</div>
			</div>

			<DataTable
				columns={columns}
				data={rows}
				total={rows.length}
				page={1}
				pageSize={rows.length || 25}
				isLoading={loadingClasses}
				emptyMessage={
					!yearId
						? t("enrollments.select_year", "No active academic year")
						: t("report_cards.empty_classes", "No classes found")
				}
				onPageChange={() => {}}
				onPageSizeChange={() => {}}
			/>
		</div>
	);
}
