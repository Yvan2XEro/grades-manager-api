import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Gavel, Loader2, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "@/lib/toast";
import { AcademicYearSelect } from "../../../components/inputs/AcademicYearSelect";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../../../components/ui/table";
import { TableSkeleton } from "../../../components/ui/table-skeleton";
import { trpcClient } from "../../../utils/trpc";
import CreateDeliberationDialog from "./CreateDeliberationDialog";

const statusVariants: Record<
	string,
	"default" | "secondary" | "destructive" | "outline"
> = {
	draft: "outline",
	open: "default",
	closed: "secondary",
	signed: "default",
};

const STATUSES = ["draft", "open", "closed", "signed"] as const;
const TYPES = ["semester", "annual", "retake"] as const;

export default function DeliberationsList() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [typeFilter, setTypeFilter] = useState<string>("all");
	const [academicYearId, setAcademicYearId] = useState<string | null>(null);

	const deliberationsQuery = useQuery({
		queryKey: ["deliberations", statusFilter, typeFilter, academicYearId],
		queryFn: () =>
			trpcClient.deliberations.list.query({
				status:
					statusFilter !== "all"
						? (statusFilter as (typeof STATUSES)[number])
						: undefined,
				type:
					typeFilter !== "all"
						? (typeFilter as (typeof TYPES)[number])
						: undefined,
				academicYearId: academicYearId || undefined,
				limit: 100,
				offset: 0,
			}),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => trpcClient.deliberations.delete.mutate({ id }),
		onSuccess: () => {
			toast.success(t("admin.deliberations.toast.deleteSuccess"));
			queryClient.invalidateQueries({ queryKey: ["deliberations"] });
		},
		onError: (err) => toast.error((err as Error).message),
	});

	const items = deliberationsQuery.data?.items ?? [];

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-3">
					<Gavel className="h-6 w-6 text-primary" />
					<div>
						<h1 className="text-foreground">
							{t("admin.deliberations.title")}
						</h1>
						<p className="text-muted-foreground text-xs">
							{t("admin.deliberations.subtitle")}
						</p>
					</div>
				</div>
				<Button onClick={() => setIsCreateOpen(true)}>
					<Plus className="mr-2 h-4 w-4" />
					{t("admin.deliberations.actions.create")}
				</Button>
			</div>

			{/* Filters */}
			<div className="flex flex-wrap items-center gap-3">
				<AcademicYearSelect
					value={academicYearId}
					onChange={setAcademicYearId}
					placeholder={t("admin.deliberations.filters.allYears")}
					autoSelectActive
					className="w-[200px]"
				/>
				<Select value={statusFilter} onValueChange={setStatusFilter}>
					<SelectTrigger className="w-[160px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">
							{t("admin.deliberations.filters.allStatuses")}
						</SelectItem>
						{STATUSES.map((s) => (
							<SelectItem key={s} value={s}>
								{t(`admin.deliberations.status.${s}`)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select value={typeFilter} onValueChange={setTypeFilter}>
					<SelectTrigger className="w-[160px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">
							{t("admin.deliberations.filters.allTypes")}
						</SelectItem>
						{TYPES.map((ty) => (
							<SelectItem key={ty} value={ty}>
								{t(`admin.deliberations.type.${ty}`)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Table */}
			<div className="rounded-xl border bg-white shadow-sm">
				{deliberationsQuery.isLoading ? (
					<TableSkeleton columns={7} rows={8} />
				) : items.length === 0 ? (
					<Empty className="border border-dashed">
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<Gavel className="text-muted-foreground" />
						</EmptyMedia>
						<EmptyTitle>{t("admin.deliberations.empty.title")}</EmptyTitle>
						<EmptyDescription>{t("admin.deliberations.empty.description")}</EmptyDescription>
					</EmptyHeader>
				</Empty>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{t("admin.deliberations.columns.class")}</TableHead>
								<TableHead>{t("admin.deliberations.columns.type")}</TableHead>
								<TableHead>
									{t("admin.deliberations.columns.semester")}
								</TableHead>
								<TableHead>{t("admin.deliberations.columns.status")}</TableHead>
								<TableHead>{t("admin.deliberations.columns.date")}</TableHead>
								<TableHead>
									{t("admin.deliberations.columns.createdAt")}
								</TableHead>
								<TableHead className="w-[60px]" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{items.map((d: any) => (
								<TableRow
									key={d.id}
									className="cursor-pointer hover:bg-muted/50"
									onClick={() => navigate(`/admin/deliberations/${d.id}`)}
								>
									<TableCell className="font-medium">
										{d.class?.name ?? "—"}
									</TableCell>
									<TableCell>
										<Badge variant="outline">
											{t(`admin.deliberations.type.${d.type}`)}
										</Badge>
									</TableCell>
									<TableCell>{d.semester?.name ?? "—"}</TableCell>
									<TableCell>
										<Badge variant={statusVariants[d.status] ?? "outline"}>
											{t(`admin.deliberations.status.${d.status}`)}
										</Badge>
									</TableCell>
									<TableCell>
										{d.deliberationDate
											? new Date(d.deliberationDate).toLocaleDateString()
											: "—"}
									</TableCell>
									<TableCell className="text-muted-foreground text-xs">
										{formatDistanceToNow(new Date(d.createdAt), {
											addSuffix: true,
										})}
									</TableCell>
									<TableCell>
										<div onClick={(e) => e.stopPropagation()}>
											{d.status === "draft" && (
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8"
														>
															<MoreHorizontal className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem
															className="text-destructive"
															onClick={() => {
																if (
																	window.confirm(
																		t("admin.deliberations.confirm.delete"),
																	)
																) {
																	deleteMutation.mutate(d.id);
																}
															}}
														>
															<Trash2 className="mr-2 h-4 w-4" />
															{t("admin.deliberations.actions.delete")}
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											)}
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</div>

			<CreateDeliberationDialog
				open={isCreateOpen}
				onOpenChange={setIsCreateOpen}
			/>
		</div>
	);
}
