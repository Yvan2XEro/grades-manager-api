import { useMutation, useQuery } from "@tanstack/react-query";
import {
	AlertCircle,
	CheckCircle2,
	Clock3,
	Filter,
	GraduationCap,
	Play,
	RefreshCcw,
	Search,
	ShieldCheck,
	UserRoundCheck,
	UsersRound,
	XCircle,
} from "lucide-react";
import type React from "react";
import { startTransition, useDeferredValue, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { PageHeader } from "@/components/ui/page-header";
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { queryClient, type RouterOutputs, trpcClient } from "@/utils/trpc";

type Transition =
	RouterOutputs["academicYearTransitions"]["list"]["items"][number];
type TransitionItem =
	RouterOutputs["academicYearTransitions"]["listItems"]["items"][number];
type TransitionOutcome = TransitionItem["finalOutcome"];
type TransitionStatus = Transition["status"];
type ItemStatus = TransitionItem["status"];

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
	if (["completed", "succeeded", "ready", "approved"].includes(status)) {
		return "success" as const;
	}
	if (["draft", "pending_approval", "running", "processing"].includes(status)) {
		return "warning" as const;
	}
	if (["blocked", "failed", "cancelled", "stale"].includes(status)) {
		return "destructive" as const;
	}
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

export default function AcademicYearTransitionsPage() {
	const { t } = useTranslation();
	const [sourceAcademicYearId, setSourceAcademicYearId] = useState("");
	const [targetAcademicYearId, setTargetAcademicYearId] = useState("");
	const [sourceClassId, setSourceClassId] = useState("all");
	const [deferredOutcome, setDeferredOutcome] = useState<"review" | "repeat">(
		"review",
	);
	const [selectedTransitionId, setSelectedTransitionId] = useState<
		string | null
	>(null);
	const [outcome, setOutcome] = useState<TransitionOutcome | "all">("review");
	const [itemStatus, setItemStatus] = useState<ItemStatus | "all">("all");
	const [search, setSearch] = useState("");
	const deferredSearch = useDeferredValue(search);
	const [selectedItem, setSelectedItem] = useState<TransitionItem | null>(null);

	const yearsQuery = useQuery({
		queryKey: ["academic-years", "transition"],
		queryFn: () => trpcClient.academicYears.list.query({ limit: 100 }),
	});
	const classesQuery = useQuery({
		queryKey: ["classes", sourceAcademicYearId],
		queryFn: () =>
			trpcClient.classes.list.query({
				academicYearId: sourceAcademicYearId,
				limit: 500,
			}),
		enabled: Boolean(sourceAcademicYearId),
	});
	const transitionsQuery = useQuery({
		queryKey: ["academic-year-transitions"],
		queryFn: () => trpcClient.academicYearTransitions.list.query({ limit: 50 }),
	});
	const selectedTransition =
		transitionsQuery.data?.items.find(
			(item) => item.id === selectedTransitionId,
		) ??
		transitionsQuery.data?.items[0] ??
		null;
	const transitionId = selectedTransition?.id ?? null;
	const targetClassesQuery = useQuery({
		queryKey: ["classes", "target", transitionId],
		queryFn: async () => {
			if (!selectedTransition?.targetAcademicYearId) return { items: [] };
			return trpcClient.classes.list.query({
				academicYearId: selectedTransition.targetAcademicYearId,
				limit: 500,
			});
		},
		enabled: Boolean(transitionId),
	});
	const itemsQuery = useQuery({
		queryKey: [
			"academic-year-transition-items",
			transitionId,
			outcome,
			itemStatus,
			deferredSearch,
		],
		queryFn: () =>
			trpcClient.academicYearTransitions.listItems.query({
				transitionId: transitionId!,
				outcome: outcome === "all" ? undefined : outcome,
				status: itemStatus === "all" ? undefined : itemStatus,
				query: deferredSearch || undefined,
				limit: 100,
			}),
		enabled: Boolean(transitionId),
	});

	const invalidateTransitions = async () => {
		await queryClient.invalidateQueries({
			queryKey: ["academic-year-transitions"],
		});
		await queryClient.invalidateQueries({
			queryKey: ["academic-year-transition-items"],
		});
	};

	const createMutation = useMutation({
		mutationFn: () =>
			trpcClient.academicYearTransitions.createDraft.mutate({
				sourceAcademicYearId,
				targetAcademicYearId,
				classIds: sourceClassId === "all" ? [] : [sourceClassId],
				deferredOutcome,
			}),
		onSuccess: async (transition) => {
			toast.success(t("admin.academicYearTransitions.toast.created"));
			setSelectedTransitionId(transition.id);
			await invalidateTransitions();
		},
		onError: (error) => toast.error(error.message),
	});

	const actionMutation = useMutation({
		mutationFn: async ({
			action,
			id,
		}: {
			action: "submit" | "approve" | "execute" | "cancel";
			id: string;
		}) => {
			return trpcClient.academicYearTransitions[action].mutate({ id });
		},
		onSuccess: async () => {
			toast.success(t("admin.academicYearTransitions.toast.updated"));
			await invalidateTransitions();
		},
		onError: (error) => toast.error(error.message),
	});

	const selectedSummary = summaryOf(selectedTransition);
	const canCreate = Boolean(
		sourceAcademicYearId &&
			targetAcademicYearId &&
			sourceAcademicYearId !== targetAcademicYearId,
	);

	return (
		<div className="space-y-6">
			<PageHeader
				title={t("admin.academicYearTransitions.title")}
				description={t("admin.academicYearTransitions.subtitle")}
				actions={
					<Button
						variant="outline"
						size="sm"
						onClick={() => transitionsQuery.refetch()}
						disabled={transitionsQuery.isFetching}
					>
						<RefreshCcw className="size-4" />
						{t("admin.academicYearTransitions.actions.refresh")}
					</Button>
				}
			/>

			<div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
				<div className="space-y-4">
					<Card className="rounded-lg">
						<CardHeader>
							<CardTitle>
								{t("admin.academicYearTransitions.create.title")}
							</CardTitle>
							<CardDescription>
								{t("admin.academicYearTransitions.create.description")}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label>
									{t("admin.academicYearTransitions.fields.sourceYear")}
								</Label>
								<Select
									value={sourceAcademicYearId}
									onValueChange={setSourceAcademicYearId}
								>
									<SelectTrigger>
										<SelectValue
											placeholder={t(
												"admin.academicYearTransitions.placeholders.sourceYear",
											)}
										/>
									</SelectTrigger>
									<SelectContent>
										{yearsQuery.data?.items.map((year) => (
											<SelectItem key={year.id} value={year.id}>
												{year.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>
									{t("admin.academicYearTransitions.fields.targetYear")}
								</Label>
								<Select
									value={targetAcademicYearId}
									onValueChange={setTargetAcademicYearId}
								>
									<SelectTrigger>
										<SelectValue
											placeholder={t(
												"admin.academicYearTransitions.placeholders.targetYear",
											)}
										/>
									</SelectTrigger>
									<SelectContent>
										{yearsQuery.data?.items.map((year) => (
											<SelectItem key={year.id} value={year.id}>
												{year.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>{t("admin.academicYearTransitions.fields.scope")}</Label>
								<Select
									value={sourceClassId}
									onValueChange={setSourceClassId}
									disabled={!sourceAcademicYearId}
								>
									<SelectTrigger>
										<SelectValue
											placeholder={t(
												"admin.academicYearTransitions.placeholders.scope",
											)}
										/>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">
											{t("admin.academicYearTransitions.scope.allClasses")}
										</SelectItem>
										{classesQuery.data?.items.map((klass) => (
											<SelectItem key={klass.id} value={klass.id}>
												{klass.code} - {klass.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>
									{t("admin.academicYearTransitions.fields.deferredPolicy")}
								</Label>
								<Select
									value={deferredOutcome}
									onValueChange={(value) =>
										setDeferredOutcome(value as "review" | "repeat")
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="review">
											{t("admin.academicYearTransitions.deferred.review")}
										</SelectItem>
										<SelectItem value="repeat">
											{t("admin.academicYearTransitions.deferred.repeat")}
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<Button
								className="w-full"
								disabled={!canCreate || createMutation.isPending}
								onClick={() => createMutation.mutate()}
							>
								<UserRoundCheck className="size-4" />
								{createMutation.isPending
									? t("admin.academicYearTransitions.actions.preparing")
									: t("admin.academicYearTransitions.actions.prepare")}
							</Button>
						</CardContent>
					</Card>

					<Card className="rounded-lg">
						<CardHeader>
							<CardTitle>
								{t("admin.academicYearTransitions.plans.title")}
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							{transitionsQuery.data?.items.map((transition) => {
								const active = transition.id === transitionId;
								const summary = summaryOf(transition);
								return (
									<button
										key={transition.id}
										type="button"
										onClick={() => setSelectedTransitionId(transition.id)}
										className={cn(
											"w-full rounded-md border p-3 text-left transition hover:bg-muted/60",
											active && "border-primary bg-primary/5",
										)}
									>
										<div className="flex items-center justify-between gap-2">
											<div className="font-medium text-sm">
												{transition.sourceYear?.name ?? "-"}
												{" -> "}
												{transition.targetYear?.name ?? "-"}
											</div>
											<Badge variant={statusVariant(transition.status)}>
												{t(
													`admin.academicYearTransitions.status.${transition.status}`,
												)}
											</Badge>
										</div>
										<div className="mt-2 text-muted-foreground text-xs">
											{count(summary, "total")}{" "}
											{t("admin.academicYearTransitions.metrics.students")}
										</div>
									</button>
								);
							})}
							{transitionsQuery.data?.items.length === 0 && (
								<div className="py-8 text-center text-muted-foreground text-sm">
									{t("admin.academicYearTransitions.empty.noPlans")}
								</div>
							)}
						</CardContent>
					</Card>
				</div>

				<div className="min-w-0 space-y-4">
					{selectedTransition ? (
						<>
							<TransitionHeader
								transition={selectedTransition}
								summary={selectedSummary}
								onAction={(action) =>
									actionMutation.mutate({ action, id: selectedTransition.id })
								}
								isPending={actionMutation.isPending}
							/>
							<div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
								<Metric
									icon={<UsersRound />}
									label={t("admin.academicYearTransitions.summary.total")}
									value={count(selectedSummary, "total")}
								/>
								<Metric
									icon={<CheckCircle2 />}
									label={t("admin.academicYearTransitions.summary.promote")}
									value={count(selectedSummary, "promote")}
									tone="success"
								/>
								<Metric
									icon={<Clock3 />}
									label={t("admin.academicYearTransitions.summary.repeat")}
									value={count(selectedSummary, "repeat")}
									tone="warning"
								/>
								<Metric
									icon={<GraduationCap />}
									label={t("admin.academicYearTransitions.summary.graduate")}
									value={count(selectedSummary, "graduate")}
									tone="success"
								/>
								<Metric
									icon={<AlertCircle />}
									label={t("admin.academicYearTransitions.summary.blocked")}
									value={count(selectedSummary, "blocked")}
									tone={
										count(selectedSummary, "blocked") > 0 ? "danger" : "muted"
									}
								/>
								<Metric
									icon={<ShieldCheck />}
									label={t("admin.academicYearTransitions.summary.overridden")}
									value={count(selectedSummary, "overridden")}
								/>
							</div>

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
														{t(
															"admin.academicYearTransitions.table.destination",
														)}
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
															<Badge
																variant={outcomeVariant(item.finalOutcome)}
															>
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
						</>
					) : (
						<Card className="rounded-lg">
							<CardContent className="py-16 text-center text-muted-foreground">
								{t("admin.academicYearTransitions.empty.selectPlan")}
							</CardContent>
						</Card>
					)}
				</div>
			</div>

			<ResolveItemSheet
				item={selectedItem}
				open={Boolean(selectedItem)}
				onOpenChange={(open) => !open && setSelectedItem(null)}
				targetClasses={targetClassesQuery.data?.items ?? []}
				onResolved={async () => {
					setSelectedItem(null);
					await invalidateTransitions();
				}}
			/>
		</div>
	);
}

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

function TransitionHeader({
	transition,
	summary,
	onAction,
	isPending,
}: {
	transition: Transition;
	summary: Summary;
	onAction: (action: "submit" | "approve" | "execute" | "cancel") => void;
	isPending: boolean;
}) {
	const { t } = useTranslation();
	const blocked = count(summary, "blocked");
	return (
		<div className="rounded-lg border bg-card p-4">
			<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
				<div>
					<div className="flex flex-wrap items-center gap-2">
						<h2 className="font-semibold text-lg">
							{transition.sourceYear?.name ?? "-"}
							{" -> "}
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
				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => onAction("cancel")}
						disabled={
							isPending ||
							[
								"running",
								"completed",
								"completed_with_errors",
								"cancelled",
							].includes(transition.status)
						}
					>
						<XCircle className="size-4" />
						{t("admin.academicYearTransitions.actions.cancel")}
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => onAction("submit")}
						disabled={
							isPending ||
							blocked > 0 ||
							!["draft", "ready"].includes(transition.status)
						}
					>
						<ShieldCheck className="size-4" />
						{t("admin.academicYearTransitions.actions.submit")}
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => onAction("approve")}
						disabled={isPending || transition.status !== "pending_approval"}
					>
						<CheckCircle2 className="size-4" />
						{t("admin.academicYearTransitions.actions.approve")}
					</Button>
					<Button
						size="sm"
						onClick={() => onAction("execute")}
						disabled={isPending || transition.status !== "approved"}
					>
						<Play className="size-4" />
						{t("admin.academicYearTransitions.actions.execute")}
					</Button>
				</div>
			</div>
		</div>
	);
}

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
