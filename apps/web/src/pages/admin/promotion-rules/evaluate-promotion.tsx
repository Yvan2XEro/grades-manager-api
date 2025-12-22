import { useMutation, useQuery } from "@tanstack/react-query";
import {
	ArrowLeft,
	CheckCircle2,
	Loader2,
	Play,
	RefreshCcw,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { StudentEvaluationCard } from "@/components/promotion-rules/student-evaluation-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpcClient } from "@/utils/trpc";

export function EvaluatePromotionPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [selectedRuleId, setSelectedRuleId] = useState<string>("");
	const [selectedSourceClassId, setSelectedSourceClassId] =
		useState<string>("");
	const [selectedAcademicYearId, setSelectedAcademicYearId] =
		useState<string>("");
	const [selectedStudents, setSelectedStudents] = useState<Set<string>>(
		new Set(),
	);
	const [hasEvaluated, setHasEvaluated] = useState(false);

	// Fetch data
	const { data: rules } = useQuery({
		queryKey: ["promotionRules", { isActive: true }],
		queryFn: async () =>
			trpcClient.promotionRules.list.query({ isActive: true }),
	});

	const { data: classes } = useQuery({
		queryKey: ["classes"],
		queryFn: async () => trpcClient.classes.list.query({}),
	});

	const { data: academicYears } = useQuery({
		queryKey: ["academicYears"],
		queryFn: async () => trpcClient.academicYears.list.query({}),
	});

	// Evaluation query
	const {
		data: evaluationResult,
		refetch: evaluateClass,
		isLoading: isEvaluating,
	} = useQuery({
		queryKey: [
			"promotionEvaluation",
			{
				ruleId: selectedRuleId,
				sourceClassId: selectedSourceClassId,
				academicYearId: selectedAcademicYearId,
			},
		],
		queryFn: async () =>
			trpcClient.promotionRules.evaluateClass.query({
				ruleId: selectedRuleId,
				sourceClassId: selectedSourceClassId,
				academicYearId: selectedAcademicYearId,
			}),
		enabled: false, // Manual trigger only
	});

	const {
		mutateAsync: refreshClassFacts,
		isPending: isRefreshingFacts,
	} = useMutation({
		mutationFn: (input: { classId: string; academicYearId: string }) =>
			trpcClient.promotionRules.refreshClassSummaries.mutate(input),
	});

	const handleEvaluate = async () => {
		if (!selectedRuleId || !selectedSourceClassId || !selectedAcademicYearId) {
			toast.error(t("admin.promotionRules.evaluate.toast.selectAll"));
			return;
		}

		setHasEvaluated(true);
		setSelectedStudents(new Set());
		await evaluateClass();
	};

	const handleRefreshFacts = async () => {
		if (!selectedSourceClassId || !selectedAcademicYearId) {
			toast.error(t("admin.promotionRules.evaluate.toast.selectAll"));
			return;
		}

		try {
			await refreshClassFacts({
				classId: selectedSourceClassId,
				academicYearId: selectedAcademicYearId,
			});
			toast.success(
				t("admin.promotionRules.evaluate.toast.refreshSuccess"),
			);
			if (hasEvaluated) {
				await evaluateClass();
			}
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: t("common.errors.unknown");
			toast.error(
				t("admin.promotionRules.evaluate.toast.refreshError", {
					error: message,
				}),
			);
		}
	};

	const handleToggleStudent = (studentId: string) => {
		const newSelection = new Set(selectedStudents);
		if (newSelection.has(studentId)) {
			newSelection.delete(studentId);
		} else {
			newSelection.add(studentId);
		}
		setSelectedStudents(newSelection);
	};

	const handleSelectAll = () => {
		if (!evaluationResult) return;
		const allEligible = new Set(
			evaluationResult.eligible.map((e) => e.student.id),
		);
		setSelectedStudents(allEligible);
	};

	const handleDeselectAll = () => {
		setSelectedStudents(new Set());
	};

	const handleProceed = () => {
		if (selectedStudents.size === 0) {
			toast.error(t("admin.promotionRules.evaluate.toast.selectStudent"));
			return;
		}

		// Navigate to execution page with selections
		navigate("/admin/promotion-rules/execute", {
			state: {
				ruleId: selectedRuleId,
				sourceClassId: selectedSourceClassId,
				academicYearId: selectedAcademicYearId,
				studentIds: Array.from(selectedStudents),
			},
		});
	};

	return (
		<div className="container mx-auto space-y-6 py-8">
			{/* Header */}
			<div className="space-y-4">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => navigate("/admin/promotion-rules")}
					className="gap-2"
				>
					<ArrowLeft className="h-4 w-4" />
					{t("common.actions.back")}
				</Button>
				<div>
					<h1 className="font-bold text-3xl tracking-tight">
						{t("admin.promotionRules.evaluate.title")}
					</h1>
					<p className="mt-1 text-muted-foreground">
						{t("admin.promotionRules.evaluate.subtitle")}
					</p>
				</div>
			</div>

			{/* Selection Form */}
			<Card>
				<CardHeader>
					<CardTitle>{t("admin.promotionRules.evaluate.form.title")}</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div className="space-y-2">
							<Label>{t("admin.promotionRules.evaluate.form.ruleLabel")}</Label>
							<Select value={selectedRuleId} onValueChange={setSelectedRuleId}>
								<SelectTrigger>
									<SelectValue
										placeholder={t(
											"admin.promotionRules.evaluate.form.rulePlaceholder",
										)}
									/>
								</SelectTrigger>
								<SelectContent>
									{rules?.items?.map((rule) => (
										<SelectItem key={rule.id} value={rule.id}>
											{rule.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label>
								{t("admin.promotionRules.evaluate.form.classLabel")}
							</Label>
							<Select
								value={selectedSourceClassId}
								onValueChange={setSelectedSourceClassId}
							>
								<SelectTrigger>
									<SelectValue
										placeholder={t(
											"admin.promotionRules.evaluate.form.classPlaceholder",
										)}
									/>
								</SelectTrigger>
								<SelectContent>
									{classes?.items?.map((cls) => (
										<SelectItem key={cls.id} value={cls.id}>
											{cls.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label>{t("admin.promotionRules.evaluate.form.yearLabel")}</Label>
							<Select
								value={selectedAcademicYearId}
								onValueChange={setSelectedAcademicYearId}
							>
								<SelectTrigger>
									<SelectValue
										placeholder={t(
											"admin.promotionRules.evaluate.form.yearPlaceholder",
										)}
									/>
								</SelectTrigger>
								<SelectContent>
									{academicYears?.items?.map((year) => (
										<SelectItem key={year.id} value={year.id}>
											{year.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="mt-6 rounded-lg border bg-muted/30 p-4">
						<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
							<div>
								<p className="font-medium">
									{t("admin.promotionRules.evaluate.actions.refreshFacts")}
								</p>
								<p className="text-sm text-muted-foreground">
									{t(
										"admin.promotionRules.evaluate.form.refreshDescription",
									)}
								</p>
							</div>
							<Button
								variant="outline"
								onClick={handleRefreshFacts}
								disabled={
									isRefreshingFacts ||
									!selectedSourceClassId ||
									!selectedAcademicYearId
								}
								className="md:w-auto"
							>
								{isRefreshingFacts ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										{t(
											"admin.promotionRules.evaluate.actions.refreshingFacts",
										)}
									</>
								) : (
									<>
										<RefreshCcw className="mr-2 h-4 w-4" />
										{t(
											"admin.promotionRules.evaluate.actions.refreshFacts",
										)}
									</>
								)}
							</Button>
						</div>
					</div>

					<div className="mt-4">
						<Button
							onClick={handleEvaluate}
							disabled={
								isEvaluating ||
								!selectedRuleId ||
								!selectedSourceClassId ||
								!selectedAcademicYearId
							}
							className="w-full md:w-auto"
						>
							{isEvaluating ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									{t("admin.promotionRules.evaluate.actions.evaluating")}
								</>
							) : (
								<>
									<Play className="mr-2 h-4 w-4" />
									{t("admin.promotionRules.evaluate.actions.evaluate")}
								</>
							)}
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Results */}
			{hasEvaluated && evaluationResult && (
				<div className="fade-in slide-in-from-bottom-4 animate-in space-y-6">
					{/* Summary */}
					<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
						<Card>
							<CardContent className="pt-6">
								<div className="font-bold text-2xl">
									{evaluationResult.totalStudents}
								</div>
								<p className="text-muted-foreground text-xs">
									{t("admin.promotionRules.evaluate.summary.total")}
								</p>
							</CardContent>
						</Card>
						<Card className="border-green-500/30 bg-green-50/20">
							<CardContent className="pt-6">
								<div className="font-bold text-2xl text-green-600">
									{evaluationResult.eligible.length}
								</div>
								<p className="text-muted-foreground text-xs">
									{t("admin.promotionRules.evaluate.summary.eligible")}
								</p>
							</CardContent>
						</Card>
						<Card className="border-red-500/30 bg-red-50/20">
							<CardContent className="pt-6">
								<div className="font-bold text-2xl text-red-600">
									{evaluationResult.notEligible.length}
								</div>
								<p className="text-muted-foreground text-xs">
									{t("admin.promotionRules.evaluate.summary.notEligible")}
								</p>
							</CardContent>
						</Card>
						<Card className="border-primary/30 bg-primary/5">
							<CardContent className="pt-6">
								<div className="font-bold text-2xl text-primary">
									{selectedStudents.size}
								</div>
								<p className="text-muted-foreground text-xs">
									{t("admin.promotionRules.evaluate.summary.selected")}
								</p>
							</CardContent>
						</Card>
					</div>

					{/* Selection Actions */}
					{evaluationResult.eligible.length > 0 && (
						<div className="flex items-center gap-2">
							<Button variant="outline" size="sm" onClick={handleSelectAll}>
								{t("admin.promotionRules.evaluate.actions.selectAll")}
							</Button>
							<Button variant="outline" size="sm" onClick={handleDeselectAll}>
								{t("admin.promotionRules.evaluate.actions.deselectAll")}
							</Button>
							<div className="flex-1" />
							<Button
								onClick={handleProceed}
								disabled={selectedStudents.size === 0}
							>
								{t("admin.promotionRules.evaluate.actions.proceed", {
									count: selectedStudents.size,
								})}
							</Button>
						</div>
					)}

					<Separator />

					{/* Student Lists */}
					<Tabs defaultValue="eligible">
						<TabsList className="grid w-full max-w-md grid-cols-2">
							<TabsTrigger value="eligible" className="gap-2">
								<CheckCircle2 className="h-4 w-4" />
								{t("admin.promotionRules.evaluate.tabs.eligible", {
									count: evaluationResult.eligible.length,
								})}
							</TabsTrigger>
							<TabsTrigger value="not-eligible" className="gap-2">
								<XCircle className="h-4 w-4" />
								{t("admin.promotionRules.evaluate.tabs.notEligible", {
									count: evaluationResult.notEligible.length,
								})}
							</TabsTrigger>
						</TabsList>

						<TabsContent value="eligible" className="mt-6 space-y-4">
							{evaluationResult.eligible.length === 0 ? (
								<div className="py-12 text-center text-muted-foreground">
									{t("admin.promotionRules.evaluate.emptyState.noEligible")}
								</div>
							) : (
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
									{evaluationResult.eligible.map((result) => (
										<StudentEvaluationCard
											key={result.student.id}
											student={result.student}
											facts={result.facts}
											eligible={true}
											reasons={result.reasons}
											selected={selectedStudents.has(result.student.id)}
											onToggleSelect={() =>
												handleToggleStudent(result.student.id)
											}
										/>
									))}
								</div>
							)}
						</TabsContent>

						<TabsContent value="not-eligible" className="mt-6 space-y-4">
							{evaluationResult.notEligible.length === 0 ? (
								<div className="py-12 text-center text-muted-foreground">
									{t("admin.promotionRules.evaluate.emptyState.allEligible")}
								</div>
							) : (
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
									{evaluationResult.notEligible.map((result) => (
										<StudentEvaluationCard
											key={result.student.id}
											student={result.student}
											facts={result.facts}
											eligible={false}
											reasons={result.reasons}
										/>
									))}
								</div>
							)}
						</TabsContent>
					</Tabs>
				</div>
			)}
		</div>
	);
}
