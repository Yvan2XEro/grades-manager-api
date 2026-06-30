import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertCircle, RefreshCcw, UserRoundCheck } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { queryClient, type RouterOutputs, trpcClient } from "@/utils/trpc";

type Transition =
	RouterOutputs["academicYearTransitions"]["list"]["items"][number];
type TransitionStatus = Transition["status"];
type Summary = Record<string, number>;

function summaryOf(transition?: Pick<Transition, "summary"> | null): Summary {
	return (transition?.summary ?? {}) as Summary;
}

function count(summary: Summary, key: string) {
	return summary[key] ?? 0;
}

function statusVariant(status: TransitionStatus) {
	if (["completed", "succeeded", "ready", "approved"].includes(status))
		return "success" as const;
	if (["draft", "pending_approval", "running", "processing"].includes(status))
		return "warning" as const;
	if (["blocked", "failed", "cancelled", "stale"].includes(status))
		return "destructive" as const;
	return "secondary" as const;
}

const TERMINAL = ["completed", "completed_with_errors", "stale", "cancelled"];

export default function AcademicYearTransitionsPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [sourceAcademicYearId, setSourceAcademicYearId] = useState("");
	const [targetAcademicYearId, setTargetAcademicYearId] = useState("");
	const [sourceClassId, setSourceClassId] = useState("all");
	const [deferredOutcome, setDeferredOutcome] = useState<"review" | "repeat">(
		"review",
	);

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

	const invalidateTransitions = async () => {
		await queryClient.invalidateQueries({
			queryKey: ["academic-year-transitions"],
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
			await invalidateTransitions();
			void navigate(`/admin/promotion/${transition.id}`);
		},
		onError: (error) => toast.error(error.message),
	});

	const duplicatePlan = (transitionsQuery.data?.items ?? []).find(
		(p) =>
			p.sourceAcademicYearId === sourceAcademicYearId &&
			p.targetAcademicYearId === targetAcademicYearId &&
			!TERMINAL.includes(p.status),
	);
	const canCreate = Boolean(
		sourceAcademicYearId &&
			targetAcademicYearId &&
			sourceAcademicYearId !== targetAcademicYearId &&
			!duplicatePlan,
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
							{duplicatePlan && (
								<div className="flex items-start gap-2 rounded-md border border-amber-400/40 bg-amber-50 p-3 text-amber-800 text-xs dark:bg-amber-950/30 dark:text-amber-300">
									<AlertCircle className="mt-0.5 size-3.5 shrink-0" />
									<span>
										{t("admin.academicYearTransitions.duplicateWarning")}{" "}
										<button
											type="button"
											className="font-medium underline underline-offset-2 hover:no-underline"
											onClick={() =>
												void navigate(`/admin/promotion/${duplicatePlan.id}`)
											}
										>
											{t("admin.academicYearTransitions.duplicateWarningLink")}
										</button>
									</span>
								</div>
							)}
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
				</div>

				<Card className="rounded-lg">
					<CardHeader>
						<CardTitle>
							{t("admin.academicYearTransitions.plans.title")}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						{transitionsQuery.data?.items.map((transition) => {
							const summary = summaryOf(transition);
							return (
								<button
									key={transition.id}
									type="button"
									onClick={() =>
										void navigate(`/admin/promotion/${transition.id}`)
									}
									className="w-full rounded-md border p-3 text-left transition hover:bg-muted/60"
								>
									<div className="flex items-center justify-between gap-2">
										<div className="font-medium text-sm">
											{transition.sourceYear?.name ?? "-"}
											{" → "}
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
		</div>
	);
}
