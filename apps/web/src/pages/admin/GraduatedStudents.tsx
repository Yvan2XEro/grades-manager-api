import { useQuery } from "@tanstack/react-query";
import { GraduationCap, Search, Trophy } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useCursorPagination } from "@/hooks/useCursorPagination";
import { trpcClient } from "../../utils/trpc";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function creditsProgress(earned: number, required: number) {
	const pct = Math.min(Math.round((earned / required) * 100), 100);
	return { pct, isFull: pct >= 100 };
}

function formatDate(date: Date | string | null | undefined) {
	if (!date) return "—";
	return new Intl.DateTimeFormat("fr", {
		year: "numeric",
		month: "short",
		day: "numeric",
	}).format(new Date(date));
}

// ---------------------------------------------------------------------------
// Row skeleton
// ---------------------------------------------------------------------------

function RowSkeleton() {
	return (
		<TableRow>
			{Array.from({ length: 6 }).map((_, i) => (
				<TableCell key={i}>
					<Skeleton className="h-4 w-full" />
				</TableCell>
			))}
		</TableRow>
	);
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function GraduatedStudents() {
	const { t } = useTranslation();
	const [search, setSearch] = useState("");
	const pagination = useCursorPagination({ pageSize: 50 });

	const { data, isLoading } = useQuery({
		queryKey: ["graduated-students", pagination.cursor],
		queryFn: () =>
			trpcClient.classes.graduatedStudents.query({
				cursor: pagination.cursor,
				limit: 50,
			}),
	});

	const items = data?.items ?? [];

	const filtered = search.trim()
		? items.filter(({ student }) => {
				const q = search.toLowerCase();
				const name =
					`${student?.profile?.firstName} ${student?.profile?.lastName}`.toLowerCase();
				const reg = student?.registrationNumber?.toLowerCase() ?? "";
				return name.includes(q) || reg.includes(q);
			})
		: items;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h2 className="flex items-center gap-2 font-bold font-heading text-2xl text-foreground">
						<GraduationCap className="h-6 w-6" />
						{t("admin.graduation.title")}
					</h2>
					<p className="mt-1 text-muted-foreground text-sm">
						{t("admin.graduation.subtitle")}
					</p>
				</div>
				{!isLoading && (
					<Badge variant="secondary" className="px-3 py-1 text-sm">
						<Trophy className="mr-1.5 h-4 w-4" />
						{items.length} {t("admin.graduation.totalGraduates")}
					</Badge>
				)}
			</div>

			{/* Search */}
			<div className="relative max-w-sm">
				<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
				<Input
					placeholder={t("admin.graduation.searchPlaceholder")}
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="pl-9"
				/>
			</div>

			{/* Table */}
			<div className="overflow-hidden rounded-xl border">
				<Table>
					<TableHeader>
						<TableRow className="bg-muted/40 hover:bg-muted/40">
							<TableHead>{t("admin.graduation.table.student")}</TableHead>
							<TableHead>{t("admin.graduation.table.registration")}</TableHead>
							<TableHead>{t("admin.graduation.table.program")}</TableHead>
							<TableHead>{t("admin.graduation.table.level")}</TableHead>
							<TableHead className="text-center">
								{t("admin.graduation.table.credits")}
							</TableHead>
							<TableHead>{t("admin.graduation.table.graduatedAt")}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading
							? Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)
							: filtered.map(({ student, klass, enrollment, creditLedger }) => {
									const creditsEarned = creditLedger?.creditsEarned ?? 0;
									const requiredCredits =
										klass?.cycleLevel?.minCredits ?? klass?.totalCredits ?? 0;
									const { pct, isFull } = creditsProgress(
										creditsEarned,
										requiredCredits,
									);

									return (
										<TableRow key={enrollment.id}>
											<TableCell className="font-medium">
												{student?.profile?.lastName},{" "}
												{student?.profile?.firstName}
											</TableCell>
											<TableCell className="font-mono text-muted-foreground text-xs">
												{student?.registrationNumber}
											</TableCell>
											<TableCell>
												<span className="text-sm">
													{klass?.programInfo?.name ?? "—"}
												</span>
											</TableCell>
											<TableCell>
												{klass?.cycleLevel?.code ? (
													<Badge
														variant="outline"
														className="font-mono text-xs"
													>
														{klass.cycleLevel.code}
													</Badge>
												) : (
													<span className="text-muted-foreground">—</span>
												)}
											</TableCell>
											<TableCell className="text-center">
												{requiredCredits > 0 ? (
													<div className="flex flex-col items-center gap-1">
														<span
															className={
																isFull
																	? "font-semibold text-emerald-600 text-sm dark:text-emerald-400"
																	: "font-semibold text-amber-600 text-sm dark:text-amber-400"
															}
														>
															{creditsEarned}/{requiredCredits}
														</span>
														<div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
															<div
																className={`h-full rounded-full transition-all ${isFull ? "bg-emerald-500" : "bg-amber-500"}`}
																style={{ width: `${pct}%` }}
															/>
														</div>
													</div>
												) : (
													<span className="text-muted-foreground">—</span>
												)}
											</TableCell>
											<TableCell className="text-muted-foreground text-sm">
												{formatDate(enrollment.exitedAt)}
											</TableCell>
										</TableRow>
									);
								})}
					</TableBody>
				</Table>
			</div>

			{/* Empty state */}
			{!isLoading && filtered.length === 0 && (
				<div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-12 text-center">
					<div className="rounded-full bg-muted p-3">
						<GraduationCap className="h-6 w-6 text-muted-foreground" />
					</div>
					<div>
						<p className="font-medium text-sm">
							{search
								? t("admin.graduation.noResults")
								: t("admin.graduation.empty")}
						</p>
						<p className="mt-1 text-muted-foreground text-sm">
							{search
								? t("admin.graduation.noResultsHint")
								: t("admin.graduation.emptyHint")}
						</p>
					</div>
				</div>
			)}

			{/* Pagination */}
			{filtered.length > 0 && (
				<PaginationBar
					hasPrev={pagination.hasPrev}
					hasNext={!!data?.nextCursor}
					onPrev={pagination.handlePrev}
					onNext={() => pagination.handleNext(data?.nextCursor)}
					isLoading={isLoading}
				/>
			)}
		</div>
	);
}
