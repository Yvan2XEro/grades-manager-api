import { useMutation, useQuery } from "@tanstack/react-query";
import {
	AlertCircle,
	ArrowLeft,
	CheckCircle2,
	Clock3,
	ExternalLink,
	Filter,
	GraduationCap,
	Play,
	RefreshCcw,
	Search,
	ShieldCheck,
	UsersRound,
	XCircle,
} from "lucide-react";
import type React from "react";
import { startTransition, useDeferredValue, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusStepper } from "@/components/ui/status-stepper";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { queryClient, type RouterOutputs, trpcClient } from "@/utils/trpc";

type Transition = RouterOutputs["academicYearTransitions"]["getById"];
type TransitionItem =
	RouterOutputs["academicYearTransitions"]["listItems"]["items"][number];
type TransitionOutcome = TransitionItem["finalOutcome"];
type ItemStatus = TransitionItem["status"];
type TransitionStatus = NonNullable<Transition>["status"];
type Summary = Record<string, number>;

const outcomeTabs: Array<TransitionOutcome | "all"> = [
	"all",
	"review",
	"promote",
	"repeat",
	"graduate",
	"exclude",
];

const itemStatusFilters: Array<ItemStatus | "all"> = [
	"all",
	"blocked",
	"ready",
	"succeeded",
	"failed",
];

function summaryOf(transition?: Pick<Transition, "summary"> | null): Summary {
	return (transition?.summary ?? {}) as Summary;
}

function count(summary: Summary, key: string) {
	return summary[key] ?? 0;
}

function statusVariant(status: TransitionStatus | ItemStatus) {
	if (["completed", "succeeded", "ready", "approved"].includes(status))
		return "success" as const;
	if (["draft", "pending_approval", "running", "processing"].includes(status))
		return "warning" as const;
	if (["blocked", "failed", "cancelled", "stale"].includes(status))
		return "destructive" as const;
	return "secondary" as const;
}

function outcomeVariant(outcome: TransitionOutcome) {
	if (outcome === "promote" || outcome === "graduate")
		return "success" as const;
	if (outcome === "repeat" || outcome === "review") return "warning" as const;
	if (outcome === "exclude") return "destructive" as const;
	return "secondary" as const;
}

function formatDate(value: Date | string | null | undefined) {
	if (!value) return "-";
	return new Intl.DateTimeFormat(undefined, {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(value));
}

const TRANSITION_STEPS = [
	{ key: "draft", labelKey: "admin.academicYearTransitions.step.draft" },
	{
		key: "pending_approval",
		labelKey: "admin.academicYearTransitions.step.pendingApproval",
	},
	{
		key: "approved",
		labelKey: "admin.academicYearTransitions.step.approved",
	},
	{ key: "running", labelKey: "admin.academicYearTransitions.step.running" },
	{
		key: "completed",
		labelKey: "admin.academicYearTransitions.step.completed",
	},
] as const;

function stepStatusFor(status: TransitionStatus): string {
	if (["draft", "ready"].includes(status)) return "draft";
	if (["completed", "completed_with_errors"].includes(status))
		return "completed";
	return status;
}

// ─── TransitionHeader ─────────────────────────────────────────────────────────

function TransitionHeader({
	transition,
	summary,
	onAction,
	isPending,
}: {
	transition: NonNullable<Transition>;
	summary: Summary;
	onAction: (action: "submit" | "approve" | "execute" | "cancel") => void;
	isPending: boolean;
}) {
	const { t } = useTranslation();
	const blocked = count(summary, "blocked");
	const terminal = ["completed", "completed_with_errors", "cancelled", "stale"];
	const canCancel =
		!terminal.includes(transition.status) && transition.status !== "running";

	const primaryAction = (() => {
		if (["draft", "ready"].includes(transition.status)) {
			const canSubmit = blocked === 0;
			return (
				<Button
					size="sm"
					onClick={() => onAction("submit")}
					disabled={isPending || !canSubmit}
					title={
						!canSubmit
							? t("admin.academicYearTransitions.actions.submitBlocked", {
									count: blocked,
								})
							: undefined
					}
				>
					<ShieldCheck className="size-4" />
					{t("admin.academicYearTransitions.actions.submit")}
					{!canSubmit && (
						<Badge variant="destructive" className="ml-1 text-xs">
							{blocked}
						</Badge>
					)}
				</Button>
			);
		}
		if (transition.status === "pending_approval") {
			return (
				<Button
					size="sm"
					onClick={() => onAction("approve")}
					disabled={isPending}
				>
					<CheckCircle2 className="size-4" />
					{t("admin.academicYearTransitions.actions.approve")}
				</Button>
			);
		}
		if (transition.status === "approved") {
			return (
				<Button
					size="sm"
					onClick={() => onAction("execute")}
					disabled={isPending}
				>
					<Play className="size-4" />
					{t("admin.academicYearTransitions.actions.execute")}
				</Button>
			);
		}
		if (transition.status === "running") {
			return (
				<Button size="sm" disabled>
					<RefreshCcw className="size-4 animate-spin" />
					{t("admin.academicYearTransitions.actions.running")}
				</Button>
			);
		}
		return null;
	})();

	const steps = TRANSITION_STEPS.map((s) => ({
		key: s.key,
		label: t(s.labelKey),
	}));

	return (
		<div className="space-y-4 rounded-lg border bg-card p-4">
			<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
				<div>
					<div className="flex flex-wrap items-center gap-2">
						<h2 className="font-semibold text-lg">
							{transition.sourceYear?.name ?? "-"}
							{" → "}
							{transition.targetYear?.name ?? "-"}
						</h2>
						<Badge variant={statusVariant(transition.status)}>
							{t(`admin.academicYearTransitions.status.${transition.status}`)}
						</Badge>
					</div>
					<p className="mt-1 text-muted-foreground text-sm">
						{t("admin.academicYearTransitions.generatedAt", {
							date: formatDate(transition.generatedAt),
						})}
					</p>
				</div>
				<div className="flex shrink-0 flex-wrap items-center gap-2">
					{canCancel && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => onAction("cancel")}
							disabled={isPending}
						>
							<XCircle className="size-4" />
							{t("admin.academicYearTransitions.actions.cancel")}
						</Button>
					)}
					{primaryAction}
				</div>
			</div>
			<StatusStepper
				steps={steps}
				currentStatus={stepStatusFor(transition.status)}
				rejectedStatus={
					["cancelled", "stale"].includes(transition.status)
						? stepStatusFor(transition.status)
						: undefined
				}
			/>
		</div>
	);
}

// ─── Metric ───────────────────────────────────────────────────────────────────

function Metric({
	icon,
	label,
	value,
	tone = "muted",
}: {
	icon: React.ReactNode;
	label: string;
	value: number;
	tone?: "success" | "warning" | "danger" | "muted";
}) {
	return (
		<div
			className={cn(
				"rounded-lg border bg-card p-4",
				tone === "success" && "border-emerald-500/30 bg-emerald-500/5",
				tone === "warning" && "border-amber-500/30 bg-amber-500/5",
				tone === "danger" && "border-destructive/30 bg-destructive/5",
			)}
		>
			<div className="flex items-center gap-2 text-muted-foreground text-xs">
				{icon}
				<span>{label}</span>
			</div>
			<div className="mt-2 font-semibold text-2xl">{value}</div>
		</div>
	);
}

// ─── ResolveItemSheet ─────────────────────────────────────────────────────────

function ResolveItemSheet({
	item,
	open,
	onOpenChange,
	targetClasses,
	onResolved,
}: {
	item: TransitionItem | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	targetClasses: Array<{ id: string; code: string; name: string }>;
	onResolved: () => Promise<void>;
}) {
	const { t } = useTranslation();
	const [outcome, setOutcome] = useState<TransitionOutcome>("repeat");
	const [targetClassId, setTargetClassId] = useState("");
	const [reason, setReason] = useState("");

	useEffect(() => {
		if (!item) return;
		setOutcome(item.finalOutcome === "review" ? "repeat" : item.finalOutcome);
		setTargetClassId(item.targetClass?.id ?? "");
		setReason(item.overrideReason ?? "");
	}, [item]);

	const mutation = useMutation({
		mutationFn: () => {
			if (!item) throw new Error("Missing item");
			return trpcClient.academicYearTransitions.resolveItem.mutate({
				transitionId: item.transitionId,
				itemId: item.id,
				outcome: outcome as Exclude<TransitionOutcome, "review">,
				targetClassId:
					outcome === "promote" || outcome === "repeat" ? targetClassId : null,
				reason,
			});
		},
		onSuccess: async () => {
			toast.success(t("admin.academicYearTransitions.toast.resolved"));
			setReason("");
			await onResolved();
		},
		onError: (error) => toast.error(error.message),
	});

	const needsTarget = outcome === "promote" || outcome === "repeat";

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="w-full overflow-y-auto sm:max-w-xl">
				<SheetHeader>
					<SheetTitle>
						{item
							? `${item.student.lastName} ${item.student.firstName}`
							: t("admin.academicYearTransitions.item.title")}
					</SheetTitle>
					<SheetDescription>
						{item?.student.registrationNumber}
					</SheetDescription>
				</SheetHeader>
				{item && (
					<div className="space-y-5 px-4 pb-6">
						<div className="grid gap-3 rounded-lg border p-4 text-sm">
							<div className="flex justify-between gap-3">
								<span className="text-muted-foreground">
									{t("admin.academicYearTransitions.table.decision")}
								</span>
								<span>
									{item.decision
										? t(
												`admin.academicYearTransitions.decision.${item.decision}`,
											)
										: "-"}
								</span>
							</div>
							<div className="flex justify-between gap-3">
								<span className="text-muted-foreground">
									{t("admin.academicYearTransitions.table.source")}
								</span>
								<span>
									{item.sourceClass.code} - {item.sourceClass.name}
								</span>
							</div>
							<div className="flex justify-between gap-3">
								<span className="text-muted-foreground">
									{t("admin.academicYearTransitions.table.outcome")}
								</span>
								<Badge variant={outcomeVariant(item.finalOutcome)}>
									{t(
										`admin.academicYearTransitions.outcome.${item.finalOutcome}`,
									)}
								</Badge>
							</div>
							<div className="flex justify-between gap-3">
								<span className="text-muted-foreground">
									{t("admin.academicYearTransitions.table.destination")}
								</span>
								<span>
									{item.targetClass
										? `${item.targetClass.code} - ${item.targetClass.name}`
										: "-"}
								</span>
							</div>
							{item.blockerCode && (
								<div className="rounded-md bg-amber-500/10 p-3 text-amber-700 text-sm dark:text-amber-300">
									{t(
										`admin.academicYearTransitions.blocker.${item.blockerCode}`,
										{ defaultValue: item.blockerCode },
									)}
								</div>
							)}
						</div>

						<div className="space-y-3">
							<h3 className="font-medium text-sm">
								{t("admin.academicYearTransitions.resolve.title")}
							</h3>
							<div className="space-y-2">
								<Label>
									{t("admin.academicYearTransitions.resolve.outcome")}
								</Label>
								<Select
									value={outcome}
									onValueChange={(value) =>
										setOutcome(value as TransitionOutcome)
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{[
											"promote",
											"repeat",
											"graduate",
											"exclude",
											"transfer",
											"suspend",
										].map((value) => (
											<SelectItem key={value} value={value}>
												{t(`admin.academicYearTransitions.outcome.${value}`)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							{needsTarget && (
								<div className="space-y-2">
									<Label>
										{t("admin.academicYearTransitions.resolve.targetClass")}
									</Label>
									<Select
										value={targetClassId}
										onValueChange={setTargetClassId}
									>
										<SelectTrigger>
											<SelectValue
												placeholder={t(
													"admin.academicYearTransitions.placeholders.targetClass",
												)}
											/>
										</SelectTrigger>
										<SelectContent>
											{targetClasses.map((klass) => (
												<SelectItem key={klass.id} value={klass.id}>
													{klass.code} - {klass.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							)}
							<div className="space-y-2">
								<Label>
									{t("admin.academicYearTransitions.resolve.reason")}
								</Label>
								<Textarea
									value={reason}
									onChange={(event) => setReason(event.target.value)}
									placeholder={t(
										"admin.academicYearTransitions.placeholders.reason",
									)}
								/>
							</div>
							<Button
								className="w-full"
								disabled={
									mutation.isPending ||
									reason.trim().length < 5 ||
									(needsTarget && !targetClassId)
								}
								onClick={() => mutation.mutate()}
							>
								{t("admin.academicYearTransitions.actions.resolve")}
							</Button>
						</div>
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}

// ─── TransitionDetail ─────────────────────────────────────────────────────────

export default function TransitionDetail() {
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();

	const [outcome, setOutcome] = useState<TransitionOutcome | "all">("all");
	const [itemStatus, setItemStatus] = useState<ItemStatus | "all">("all");
	const [search, setSearch] = useState("");
	const deferredSearch = useDeferredValue(search);
	const [selectedItem, setSelectedItem] = useState<TransitionItem | null>(null);

	const transitionQuery = useQuery({
		queryKey: ["academic-year-transition", id],
		queryFn: () =>
			trpcClient.academicYearTransitions.getById.query({ id: id! }),
		enabled: Boolean(id),
	});
	const transition = transitionQuery.data ?? null;

	const targetClassesQuery = useQuery({
		queryKey: ["classes", "target", transition?.targetAcademicYearId],
		queryFn: async () => {
			if (!transition?.targetAcademicYearId) return { items: [] };
			return trpcClient.classes.list.query({
				academicYearId: transition.targetAcademicYearId,
				limit: 500,
			});
		},
		enabled: Boolean(transition?.targetAcademicYearId),
	});

	const itemsQuery = useQuery({
		queryKey: [
			"academic-year-transition-items",
			id,
			outcome,
			itemStatus,
			deferredSearch,
		],
		queryFn: () =>
			trpcClient.academicYearTransitions.listItems.query({
				transitionId: id!,
				outcome: outcome === "all" ? undefined : outcome,
				status: itemStatus === "all" ? undefined : itemStatus,
				query: deferredSearch || undefined,
				limit: 100,
			}),
		enabled: Boolean(id),
	});

	const readinessQuery = useQuery({
		queryKey: ["academic-year-transition-readiness", id],
		queryFn: () =>
			trpcClient.academicYearTransitions.getTransitionReadiness.query({
				id: id!,
			}),
		enabled: Boolean(id),
	});

	const auditQuery = useQuery({
		queryKey: ["academic-year-transition-audit", id],
		queryFn: () =>
			trpcClient.academicYearTransitions.getTransitionAudit.query({ id: id! }),
		enabled: Boolean(id),
	});

	const invalidate = async () => {
		await queryClient.invalidateQueries({
			queryKey: ["academic-year-transition", id],
		});
		await queryClient.invalidateQueries({
			queryKey: ["academic-year-transition-items", id],
		});
		await queryClient.invalidateQueries({
			queryKey: ["academic-year-transition-readiness", id],
		});
		await queryClient.invalidateQueries({
			queryKey: ["academic-year-transition-audit", id],
		});
		await queryClient.invalidateQueries({
			queryKey: ["academic-year-transitions"],
		});
	};

	const actionMutation = useMutation({
		mutationFn: async ({
			action,
		}: {
			action: "submit" | "approve" | "execute" | "cancel";
		}) => {
			return trpcClient.academicYearTransitions[action].mutate({ id: id! });
		},
		onSuccess: async (_data, { action }) => {
			const msg = {
				submit: t("admin.academicYearTransitions.toast.submitted"),
				approve: t("admin.academicYearTransitions.toast.approved"),
				execute: t("admin.academicYearTransitions.toast.executed"),
				cancel: t("admin.academicYearTransitions.toast.cancelled"),
			}[action];
			toast.success(msg);
			await invalidate();
		},
		onError: (error) => toast.error(error.message),
	});

	const summary = summaryOf(transition);

	if (transitionQuery.isLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-32 w-full" />
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	if (!transition) {
		return (
			<div className="py-16 text-center text-muted-foreground">
				{t("admin.academicYearTransitions.empty.notFound")}
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<Button
					variant="ghost"
					size="sm"
					className="mb-4 gap-2"
					onClick={() => navigate("/admin/promotion")}
				>
					<ArrowLeft className="size-4" />
					{t("common.actions.back")}
				</Button>
			</div>

			<TransitionHeader
				transition={transition}
				summary={summary}
				onAction={(action) => actionMutation.mutate({ action })}
				isPending={actionMutation.isPending}
			/>

			<div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
				<Metric
					icon={<UsersRound />}
					label={t("admin.academicYearTransitions.summary.total")}
					value={count(summary, "total")}
				/>
				<Metric
					icon={<CheckCircle2 />}
					label={t("admin.academicYearTransitions.summary.promote")}
					value={count(summary, "promote")}
					tone="success"
				/>
				<Metric
					icon={<Clock3 />}
					label={t("admin.academicYearTransitions.summary.repeat")}
					value={count(summary, "repeat")}
					tone="warning"
				/>
				<Metric
					icon={<GraduationCap />}
					label={t("admin.academicYearTransitions.summary.graduate")}
					value={count(summary, "graduate")}
					tone="success"
				/>
				<Metric
					icon={<AlertCircle />}
					label={t("admin.academicYearTransitions.summary.blocked")}
					value={count(summary, "blocked")}
					tone={count(summary, "blocked") > 0 ? "danger" : "muted"}
				/>
				<Metric
					icon={<ShieldCheck />}
					label={t("admin.academicYearTransitions.summary.overridden")}
					value={count(summary, "overridden")}
				/>
			</div>

			<Tabs defaultValue="students">
				<TabsList>
					<TabsTrigger value="students">
						{t("admin.academicYearTransitions.tabs.students")}
					</TabsTrigger>
					<TabsTrigger value="readiness">
						{t("admin.academicYearTransitions.tabs.readiness")}
					</TabsTrigger>
					<TabsTrigger value="audit">
						{t("admin.academicYearTransitions.tabs.audit")}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="students" className="mt-4">
					<Card className="rounded-lg">
						<CardHeader className="gap-4 border-b pb-4">
							<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
								<div>
									<CardTitle>
										{t("admin.academicYearTransitions.review.title")}
									</CardTitle>
									<CardDescription>
										{t("admin.academicYearTransitions.review.description")}
									</CardDescription>
								</div>
								<div className="flex min-w-0 flex-col gap-2 sm:flex-row">
									<div className="relative min-w-0 sm:w-72">
										<Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground" />
										<Input
											value={search}
											onChange={(event) =>
												startTransition(() => setSearch(event.target.value))
											}
											placeholder={t(
												"admin.academicYearTransitions.placeholders.search",
											)}
											className="pl-9"
										/>
									</div>
									<Select
										value={itemStatus}
										onValueChange={(value) =>
											setItemStatus(value as ItemStatus | "all")
										}
									>
										<SelectTrigger className="sm:w-44">
											<Filter className="size-4" />
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{itemStatusFilters.map((value) => (
												<SelectItem key={value} value={value}>
													{t(
														`admin.academicYearTransitions.itemStatus.${value}`,
													)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>
							<Tabs
								value={outcome}
								onValueChange={(value) =>
									setOutcome(value as TransitionOutcome | "all")
								}
							>
								<TabsList className="flex h-auto flex-wrap justify-start">
									{outcomeTabs.map((value) => (
										<TabsTrigger key={value} value={value}>
											{t(`admin.academicYearTransitions.outcome.${value}`)}
										</TabsTrigger>
									))}
								</TabsList>
							</Tabs>
						</CardHeader>
						<CardContent className="px-0">
							<div className="max-h-[620px] overflow-auto">
								<Table>
									<TableHeader className="sticky top-0 z-10 bg-card">
										<TableRow>
											<TableHead>
												{t("admin.academicYearTransitions.table.student")}
											</TableHead>
											<TableHead>
												{t("admin.academicYearTransitions.table.decision")}
											</TableHead>
											<TableHead>
												{t("admin.academicYearTransitions.table.source")}
											</TableHead>
											<TableHead>
												{t("admin.academicYearTransitions.table.outcome")}
											</TableHead>
											<TableHead>
												{t("admin.academicYearTransitions.table.destination")}
											</TableHead>
											<TableHead>
												{t("admin.academicYearTransitions.table.status")}
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{itemsQuery.data?.items.map((item) => (
											<TableRow
												key={item.id}
												className="cursor-pointer"
												onClick={() => setSelectedItem(item)}
											>
												<TableCell>
													<div className="font-medium">
														{item.student.lastName} {item.student.firstName}
													</div>
													<div className="text-muted-foreground text-xs">
														{item.student.registrationNumber}
													</div>
												</TableCell>
												<TableCell>
													{item.decision
														? t(
																`admin.academicYearTransitions.decision.${item.decision}`,
															)
														: "-"}
												</TableCell>
												<TableCell>
													{item.sourceClass.code}
													<div className="text-muted-foreground text-xs">
														{item.sourceClass.name}
													</div>
												</TableCell>
												<TableCell>
													<Badge variant={outcomeVariant(item.finalOutcome)}>
														{t(
															`admin.academicYearTransitions.outcome.${item.finalOutcome}`,
														)}
													</Badge>
												</TableCell>
												<TableCell>
													{item.targetClass
														? `${item.targetClass.code} - ${item.targetClass.name}`
														: "-"}
												</TableCell>
												<TableCell>
													<Badge variant={statusVariant(item.status)}>
														{t(
															`admin.academicYearTransitions.itemStatus.${item.status}`,
														)}
													</Badge>
													{item.blockerCode && (
														<div className="mt-1 text-muted-foreground text-xs">
															{t(
																`admin.academicYearTransitions.blocker.${item.blockerCode}`,
																{ defaultValue: item.blockerCode },
															)}
														</div>
													)}
												</TableCell>
											</TableRow>
										))}
										{itemsQuery.data?.items.length === 0 && (
											<TableRow>
												<TableCell
													colSpan={6}
													className="h-32 text-center text-muted-foreground"
												>
													{t("admin.academicYearTransitions.empty.noItems")}
												</TableCell>
											</TableRow>
										)}
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="readiness" className="mt-4">
					<Card className="rounded-lg">
						<CardHeader className="border-b pb-4">
							<CardTitle>
								{t("admin.academicYearTransitions.readiness.title")}
							</CardTitle>
							<CardDescription>
								{t("admin.academicYearTransitions.readiness.description")}
							</CardDescription>
							{readinessQuery.data && (
								<div className="mt-2 flex flex-wrap gap-3">
									<span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm">
										<CheckCircle2 className="size-3.5 text-emerald-500" />
										{readinessQuery.data.summary.readyClasses}/
										{readinessQuery.data.summary.classCount}{" "}
										{t("admin.academicYearTransitions.readiness.classesReady")}
									</span>
									{readinessQuery.data.summary.missingDeliberationCount > 0 && (
										<span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-amber-50 px-3 py-1 text-amber-700 text-sm dark:bg-amber-950/30 dark:text-amber-300">
											<AlertCircle className="size-3.5" />
											{readinessQuery.data.summary.missingDeliberationCount}{" "}
											{t(
												"admin.academicYearTransitions.readiness.missingDeliberation",
											)}
										</span>
									)}
									{readinessQuery.data.summary.blockedStudentCount > 0 && (
										<span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/50 bg-destructive/5 px-3 py-1 text-destructive text-sm">
											<XCircle className="size-3.5" />
											{readinessQuery.data.summary.blockedStudentCount}{" "}
											{t(
												"admin.academicYearTransitions.readiness.blockedStudents",
											)}
										</span>
									)}
								</div>
							)}
						</CardHeader>
						<CardContent className="px-0">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>
											{t("admin.academicYearTransitions.readiness.class")}
										</TableHead>
										<TableHead>
											{t(
												"admin.academicYearTransitions.readiness.deliberation",
											)}
										</TableHead>
										<TableHead className="text-right">
											{t("admin.academicYearTransitions.readiness.ready")}
										</TableHead>
										<TableHead className="text-right">
											{t("admin.academicYearTransitions.readiness.blocked")}
										</TableHead>
										<TableHead className="text-right">
											{t("admin.academicYearTransitions.readiness.total")}
										</TableHead>
										<TableHead>
											{t("admin.academicYearTransitions.readiness.issues")}
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{readinessQuery.data?.classes.map((cls) => (
										<TableRow key={cls.classId}>
											<TableCell>
												<span className="font-medium">{cls.classCode}</span>
												<div className="text-muted-foreground text-xs">
													{cls.className}
												</div>
											</TableCell>
											<TableCell>
												{cls.hasSignedDeliberation ? (
													<span className="flex items-center gap-1 text-emerald-600 text-sm">
														<CheckCircle2 className="size-3.5" />
														{t(
															"admin.academicYearTransitions.readiness.signed",
														)}
													</span>
												) : (
													<a
														href="/admin/deliberations"
														className="flex items-center gap-1 text-amber-600 text-sm hover:underline"
													>
														<AlertCircle className="size-3.5" />
														{t(
															"admin.academicYearTransitions.readiness.missing",
														)}
														<ExternalLink className="size-3" />
													</a>
												)}
											</TableCell>
											<TableCell className="text-right text-sm tabular-nums">
												{cls.studentCounts.ready + cls.studentCounts.succeeded}
											</TableCell>
											<TableCell className="text-right text-sm tabular-nums">
												{cls.studentCounts.blocked > 0 ? (
													<span className="font-medium text-destructive">
														{cls.studentCounts.blocked}
													</span>
												) : (
													cls.studentCounts.blocked
												)}
											</TableCell>
											<TableCell className="text-right text-sm tabular-nums">
												{cls.studentCounts.total}
											</TableCell>
											<TableCell>
												<div className="flex flex-wrap gap-1">
													{cls.blockerCodes.map((code) => (
														<Badge
															key={code}
															variant="outline"
															className="text-xs"
														>
															{t(
																`admin.academicYearTransitions.blocker.${code}`,
																{ defaultValue: code },
															)}
														</Badge>
													))}
												</div>
											</TableCell>
										</TableRow>
									))}
									{readinessQuery.isLoading && (
										<TableRow>
											<TableCell
												colSpan={6}
												className="h-24 text-center text-muted-foreground"
											>
												{t("common.loading")}
											</TableCell>
										</TableRow>
									)}
									{!readinessQuery.isLoading &&
										readinessQuery.data?.classes.length === 0 && (
											<TableRow>
												<TableCell
													colSpan={6}
													className="h-24 text-center text-muted-foreground"
												>
													{t("admin.academicYearTransitions.readiness.empty")}
												</TableCell>
											</TableRow>
										)}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="audit" className="mt-4">
					<Card className="rounded-lg">
						<CardHeader className="border-b pb-4">
							<CardTitle>
								{t("admin.academicYearTransitions.audit.title")}
							</CardTitle>
							<CardDescription>
								{t("admin.academicYearTransitions.audit.description")}
							</CardDescription>
						</CardHeader>
						<CardContent className="py-6">
							{auditQuery.isLoading && (
								<div className="space-y-3">
									{[1, 2, 3].map((i) => (
										<Skeleton key={i} className="h-12 w-full" />
									))}
								</div>
							)}
							{auditQuery.data && (
								<div className="relative space-y-0">
									{auditQuery.data.events.map((event, idx) => {
										const isLast = idx === auditQuery.data.events.length - 1;
										const isTerminal = [
											"completed",
											"completed_with_errors",
											"cancelled",
											"stale",
										].includes(event.action);
										return (
											<div
												key={`${event.action}-${idx}`}
												className="flex gap-4"
											>
												<div className="relative flex flex-col items-center">
													<div
														className={cn(
															"flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2",
															event.action === "completed" &&
																"border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50",
															event.action === "completed_with_errors" &&
																"border-amber-500 bg-amber-50 dark:bg-amber-950/50",
															["cancelled", "stale"].includes(event.action) &&
																"border-destructive/50 bg-destructive/5",
															![
																"completed",
																"completed_with_errors",
																"cancelled",
																"stale",
															].includes(event.action) &&
																"border-muted-foreground/40 bg-muted",
														)}
													>
														{event.action === "completed" ? (
															<CheckCircle2 className="size-4 text-emerald-600" />
														) : event.action === "completed_with_errors" ? (
															<AlertCircle className="size-4 text-amber-600" />
														) : ["cancelled", "stale"].includes(
																event.action,
															) ? (
															<XCircle className="size-4 text-destructive" />
														) : (
															<div className="h-2 w-2 rounded-full bg-muted-foreground/60" />
														)}
													</div>
													{!isLast && (
														<div className="mt-1 w-px flex-1 bg-border" />
													)}
												</div>
												<div className="pt-1 pb-6">
													<p className="font-medium text-sm">
														{t(
															`admin.academicYearTransitions.audit.action.${event.action}`,
														)}
													</p>
													<p className="text-muted-foreground text-xs">
														{event.actorName ? `${event.actorName} · ` : ""}
														{event.at
															? new Intl.DateTimeFormat(undefined, {
																	dateStyle: "medium",
																	timeStyle: "short",
																}).format(new Date(event.at))
															: "—"}
													</p>
													{isTerminal &&
														auditQuery.data.summary &&
														Object.keys(auditQuery.data.summary).length > 0 && (
															<div className="mt-2 flex flex-wrap gap-2">
																{[
																	"promote",
																	"graduate",
																	"repeat",
																	"failed",
																].map((key) => {
																	const val =
																		auditQuery.data.summary?.[key] ?? 0;
																	if (val === 0) return null;
																	return (
																		<span
																			key={key}
																			className="rounded border px-2 py-0.5 text-xs"
																		>
																			{t(
																				`admin.academicYearTransitions.outcome.${key}`,
																			)}
																			: {val}
																		</span>
																	);
																})}
															</div>
														)}
												</div>
											</div>
										);
									})}
									{auditQuery.data.events.length === 0 && (
										<p className="text-center text-muted-foreground text-sm">
											{t("admin.academicYearTransitions.audit.empty")}
										</p>
									)}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			<ResolveItemSheet
				item={selectedItem}
				open={Boolean(selectedItem)}
				onOpenChange={(open) => !open && setSelectedItem(null)}
				targetClasses={targetClassesQuery.data?.items ?? []}
				onResolved={async () => {
					setSelectedItem(null);
					await invalidate();
				}}
			/>
		</div>
	);
}
