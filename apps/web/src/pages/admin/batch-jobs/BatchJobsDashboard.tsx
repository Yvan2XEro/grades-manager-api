import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
	CheckCircle2,
	Clock,
	Loader2,
	PlayCircle,
	Plus,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "@/lib/toast";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
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
import {
	ContextMenuItem,
	ContextMenuSeparator,
} from "../../../components/ui/context-menu";
import { TableSkeleton } from "../../../components/ui/table-skeleton";
import { trpcClient } from "../../../utils/trpc";
import { CreateBatchJobDialog } from "./CreateBatchJobDialog";

const statusVariants: Record<
	string,
	"default" | "secondary" | "destructive" | "outline"
> = {
	pending: "outline",
	previewed: "secondary",
	running: "default",
	completed: "default",
	failed: "destructive",
	cancelled: "secondary",
	stale: "destructive",
	rolled_back: "secondary",
};

const statusIcons: Record<string, React.ReactNode> = {
	pending: <Clock className="mr-1 h-3 w-3" />,
	previewed: <Clock className="mr-1 h-3 w-3" />,
	running: <Loader2 className="mr-1 h-3 w-3 animate-spin" />,
	completed: <CheckCircle2 className="mr-1 h-3 w-3" />,
	failed: <XCircle className="mr-1 h-3 w-3" />,
	cancelled: <XCircle className="mr-1 h-3 w-3" />,
	stale: <XCircle className="mr-1 h-3 w-3" />,
	rolled_back: <XCircle className="mr-1 h-3 w-3" />,
};

export default function BatchJobsDashboard() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [isCreateOpen, setIsCreateOpen] = useState(false);

	const jobsQuery = useQuery({
		queryKey: ["batchJobs", statusFilter],
		queryFn: () =>
			trpcClient.batchJobs.list.query({
				status:
					statusFilter === "all"
						? undefined
						: [statusFilter as "pending" | "running" | "completed" | "failed"],
				limit: 50,
				offset: 0,
			}),
		refetchInterval: 5000,
	});

	const runMutation = useMutation({
		mutationFn: (jobId: string) => trpcClient.batchJobs.run.mutate({ jobId }),
		onSuccess: () => {
			toast.success(t("admin.batchJobs.toast.runSuccess"));
			queryClient.invalidateQueries({ queryKey: ["batchJobs"] });
		},
		onError: (err) => toast.error((err as Error).message),
	});

	const cancelMutation = useMutation({
		mutationFn: (jobId: string) =>
			trpcClient.batchJobs.cancel.mutate({ jobId }),
		onSuccess: () => {
			toast.success(t("admin.batchJobs.toast.cancelSuccess"));
			queryClient.invalidateQueries({ queryKey: ["batchJobs"] });
		},
		onError: (err) => toast.error((err as Error).message),
	});

	const jobs = jobsQuery.data?.items ?? [];

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-3">
					<PlayCircle className="h-6 w-6 text-primary-700" />
					<div>
						<h1 className="text-foreground">
							{t("admin.batchJobs.title")}
						</h1>
						<p className="text-muted-foreground text-xs">
							{t("admin.batchJobs.subtitle")}
						</p>
					</div>
				</div>
				<Button onClick={() => setIsCreateOpen(true)}>
					<Plus className="mr-2 h-4 w-4" />
					{t("admin.batchJobs.actions.create")}
				</Button>
			</div>

			{/* Filters */}
			<div className="flex items-center gap-3">
				<Select value={statusFilter} onValueChange={setStatusFilter}>
					<SelectTrigger className="w-[180px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All statuses</SelectItem>
						{[
							"pending",
							"previewed",
							"running",
							"completed",
							"failed",
							"cancelled",
							"stale",
							"rolled_back",
						].map((s) => (
							<SelectItem key={s} value={s}>
								{t(`admin.batchJobs.status.${s}`)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Table */}
			<div className="rounded-xl border bg-white shadow-sm">
				{jobsQuery.isLoading ? (
					<TableSkeleton columns={6} rows={8} />
				) : jobs.length === 0 ? (
					<Empty className="border border-dashed">
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<PlayCircle className="text-muted-foreground" />
						</EmptyMedia>
						<EmptyTitle>{t("admin.batchJobs.empty.title")}</EmptyTitle>
						<EmptyDescription>{t("admin.batchJobs.empty.description")}</EmptyDescription>
					</EmptyHeader>
				</Empty>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{t("admin.batchJobs.columns.type")}</TableHead>
								<TableHead>{t("admin.batchJobs.columns.status")}</TableHead>
								<TableHead>{t("admin.batchJobs.columns.progress")}</TableHead>
								<TableHead>{t("admin.batchJobs.columns.createdBy")}</TableHead>
								<TableHead>{t("admin.batchJobs.columns.createdAt")}</TableHead>
								<TableHead className="w-1 text-right">
									{t("admin.batchJobs.columns.actions")}
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{jobs.map((job) => (
								<TableRow
									key={job.id}
									className="cursor-pointer"
									onClick={() => navigate(`/admin/batch-jobs/${job.id}`)}
									actions={<>
										<ContextMenuItem onSelect={() => navigate(`/admin/batch-jobs/${job.id}`)}>{t("common.actions.open", { defaultValue: "Open" })}</ContextMenuItem>
										{job.status === "previewed" && <><ContextMenuSeparator /><ContextMenuItem onSelect={() => runMutation.mutate(job.id)}>{t("admin.batchJobs.actions.run")}</ContextMenuItem></>}
										{["pending","previewed","running"].includes(job.status) && <><ContextMenuSeparator /><ContextMenuItem className="text-destructive" onSelect={() => cancelMutation.mutate(job.id)}>{t("admin.batchJobs.actions.cancel")}</ContextMenuItem></>}
									</>}
								>
									<TableCell className="font-medium">
										{t(`admin.batchJobs.types.${job.type}`, {
											defaultValue: job.type,
										})}
									</TableCell>
									<TableCell>
										<Badge variant={statusVariants[job.status] ?? "outline"}>
											{statusIcons[job.status]}
											{t(`admin.batchJobs.status.${job.status}`, {
												defaultValue: job.status,
											})}
										</Badge>
									</TableCell>
									<TableCell>
										{job.progress ? (
											<div className="flex items-center gap-2">
												<div className="h-2 w-24 rounded-full bg-gray-200">
													<div
														className="h-2 rounded-full bg-primary-600 transition-all"
														style={{
															width: `${job.progress.itemsTotal > 0 ? (job.progress.itemsProcessed / job.progress.itemsTotal) * 100 : 0}%`,
														}}
													/>
												</div>
												<span className="text-muted-foreground text-xs">
													{job.progress.itemsProcessed}/
													{job.progress.itemsTotal}
												</span>
											</div>
										) : (
											<span className="text-muted-foreground/60 text-sm">
												-
											</span>
										)}
									</TableCell>
									<TableCell className="text-sm">
										{job.createdByRef
											? `${job.createdByRef.firstName} ${job.createdByRef.lastName}`
											: "-"}
									</TableCell>
									<TableCell className="text-muted-foreground text-xs">
										{formatDistanceToNow(new Date(job.createdAt), {
											addSuffix: true,
										})}
									</TableCell>
									<TableCell className="text-right">
										<div
											className="flex justify-end gap-1"
											onClick={(e) => e.stopPropagation()}
										>
											{job.status === "previewed" && (
												<Button
													variant="ghost"
													size="sm"
													onClick={() => runMutation.mutate(job.id)}
													disabled={runMutation.isPending}
												>
													{t("admin.batchJobs.actions.run")}
												</Button>
											)}
											{(job.status === "pending" ||
												job.status === "previewed" ||
												job.status === "running") && (
												<Button
													variant="ghost"
													size="sm"
													onClick={() => cancelMutation.mutate(job.id)}
													disabled={cancelMutation.isPending}
												>
													{t("admin.batchJobs.actions.cancel")}
												</Button>
											)}
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</div>

			<CreateBatchJobDialog
				open={isCreateOpen}
				onOpenChange={setIsCreateOpen}
			/>
		</div>
	);
}
