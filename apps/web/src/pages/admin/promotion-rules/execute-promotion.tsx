import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import { toast } from "@/lib/toast";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { trpcClient } from "@/utils/trpc";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";

export function ExecutePromotionPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const state = location.state as {
		ruleId: string;
		sourceClassId: string;
		academicYearId: string;
		studentIds: string[];
	} | null;

	const [targetClassId, setTargetClassId] = useState<string>("");
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);

	// Fetch data
	const { data: rule } = useQuery({
		queryKey: ["promotionRule", state?.ruleId],
		queryFn: async () =>
			trpcClient.promotionRules.getById.query({ id: state!.ruleId }),
		enabled: !!state?.ruleId,
	});

	const { data: sourceClass } = useQuery({
		queryKey: ["class", state?.sourceClassId],
		queryFn: async () =>
			trpcClient.classes.getById.query({ id: state!.sourceClassId }),
		enabled: !!state?.sourceClassId,
	});

	const { data: classes } = useQuery({
		queryKey: ["classes"],
		queryFn: async () => {
			const { items } = await trpcClient.classes.list.query({});
			return items;
		},
	});

	// Mutation
	const applyPromotionMutation = useMutation({
		mutationFn: async (data: {
			ruleId: string;
			sourceClassId: string;
			targetClassId: string;
			academicYearId: string;
			studentIds: string[];
		}) => trpcClient.promotionRules.applyPromotion.mutate(data),
		onSuccess: () => {
			toast.success("Promotion applied successfully!");
			navigate("/admin/promotion-rules/history");
		},
		onError: (error: any) => {
			toast.error(`Failed to apply promotion: ${error.message}`);
		},
	});

	const handleExecute = () => {
		if (!state || !targetClassId) {
			toast.error("Missing required information");
			return;
		}

		setShowConfirmDialog(true);
	};

	// Batch job mutation for large promotions
	const batchPromotionMutation = useMutation({
		mutationFn: async (data: {
			ruleId: string;
			sourceClassId: string;
			targetClassId: string;
			academicYearId: string;
			studentIds: string[];
		}) => {
			const job = await trpcClient.batchJobs.preview.mutate({
				type: "promotion.applyBatch",
				params: {
					ruleId: data.ruleId,
					sourceClassId: data.sourceClassId,
					targetClassId: data.targetClassId,
					academicYearId: data.academicYearId,
					studentIds: data.studentIds,
					executedBy: "__current__",
				},
			});
			await trpcClient.batchJobs.run.mutate({ jobId: job.id });
			return job;
		},
		onSuccess: () => {
			toast.success("Batch promotion started! Redirecting to batch jobs...");
			navigate("/admin/batch-jobs");
		},
		onError: (error: any) => {
			toast.error(`Failed to start batch promotion: ${error.message}`);
		},
	});

	const BATCH_THRESHOLD = 20;
	const useBatch = (state?.studentIds.length ?? 0) > BATCH_THRESHOLD;

	const handleConfirmExecute = () => {
		if (!state || !targetClassId) return;

		const payload = {
			ruleId: state.ruleId,
			sourceClassId: state.sourceClassId,
			targetClassId,
			academicYearId: state.academicYearId,
			studentIds: state.studentIds,
		};

		if (useBatch) {
			batchPromotionMutation.mutate(payload);
		} else {
			applyPromotionMutation.mutate(payload);
		}
		setShowConfirmDialog(false);
	};

	if (!state) {
		return (
			<div>
				<Card className="border-0 shadow-sm">
					<CardContent className="pt-6">
						<Empty className="border border-dashed">
						<EmptyHeader>
							<EmptyDescription>No promotion data found. Please start from the evaluation page.</EmptyDescription>
						</EmptyHeader>
						<EmptyContent>
							<Button onClick={() => navigate("/admin/promotion-rules/evaluate")}>
								Go to Evaluation
							</Button>
						</EmptyContent>
					</Empty>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="space-y-4">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => navigate("/admin/promotion-rules/evaluate")}
					className="gap-2"
				>
					<ArrowLeft className="h-4 w-4" />
					{t("common.actions.back")}
				</Button>
				<div>
					<h1 className="text-foreground">
						Execute Promotion
					</h1>
					<p className="mt-1 text-muted-foreground">
						Confirm and apply the promotion to selected students
					</p>
				</div>
			</div>

			{/* Summary */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
				<Card className="border-0 shadow-sm">
					<CardHeader>
						<CardTitle className="font-medium text-muted-foreground text-sm">
							Rule
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-semibold text-foreground">{rule?.name}</div>
						<p className="mt-1 text-muted-foreground text-sm">
							{rule?.description}
						</p>
					</CardContent>
				</Card>

				<Card className="border-0 shadow-sm">
					<CardHeader>
						<CardTitle className="font-medium text-muted-foreground text-sm">
							Source Class
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-semibold text-foreground">
							{sourceClass?.name}
						</div>
						<Badge variant="secondary" className="mt-2">
							{state.studentIds.length} students selected
						</Badge>
					</CardContent>
				</Card>

				<Card className="border-primary/20 bg-primary/5 shadow-sm">
					<CardHeader>
						<CardTitle className="font-medium text-muted-foreground text-sm">
							Students to Promote
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-3xl text-primary">
							{state.studentIds.length}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Target Class Selection */}
			<Card className="border-0 shadow-sm">
				<CardHeader>
					<CardTitle>Select Target Class</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="space-y-2">
						<Label>Destination Class</Label>
						<Select value={targetClassId} onValueChange={setTargetClassId}>
							<SelectTrigger>
								<SelectValue placeholder="Select the next class level" />
							</SelectTrigger>
							<SelectContent>
								{classes
									.filter((cls) => cls.id !== state.sourceClassId)
									.map((cls) => (
										<SelectItem key={cls.id} value={cls.id}>
											{cls.name}
										</SelectItem>
									))}
							</SelectContent>
						</Select>
						<p className="text-muted-foreground text-xs">
							Students will be enrolled in this class for the next academic year
						</p>
					</div>

					{/* Visual Flow */}
					{targetClassId && (
						<div className="flex items-center justify-center gap-4 rounded-lg bg-muted p-6">
							<div className="text-center">
								<div className="font-semibold">{sourceClass?.name}</div>
								<Badge variant="outline" className="mt-1">
									Current
								</Badge>
							</div>
							<ArrowRight className="h-8 w-8 text-primary" />
							<div className="text-center">
								<div className="font-semibold">
									{classes.find((c) => c.id === targetClassId)?.name}
								</div>
								<Badge variant="default" className="mt-1">
									Target
								</Badge>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Actions */}
			<div className="flex items-center gap-4">
				<Button
					variant="outline"
					onClick={() => navigate("/admin/promotion-rules/evaluate")}
				>
					Back to Evaluation
				</Button>
				<div className="flex-1" />
				<Button
					onClick={handleExecute}
					disabled={
						!targetClassId ||
						applyPromotionMutation.isPending ||
						batchPromotionMutation.isPending
					}
					size="lg"
				>
					{applyPromotionMutation.isPending ||
					batchPromotionMutation.isPending ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
							{useBatch ? "Starting Batch Job..." : "Applying Promotion..."}
						</>
					) : (
						<>
							<CheckCircle className="mr-2 h-4 w-4" />
							{useBatch
								? `Execute as Batch Job (${state.studentIds.length} students)`
								: "Execute Promotion"}
						</>
					)}
				</Button>
			</div>

			{/* Confirmation Dialog */}
			<AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Confirm Promotion Execution</AlertDialogTitle>
						<AlertDialogDescription>
							You are about to promote{" "}
							<strong>{state.studentIds.length}</strong> student(s) from{" "}
							<strong>{sourceClass?.name}</strong> to{" "}
							<strong>
								{classes.find((c) => c.id === targetClassId)?.name}
							</strong>
							.
							<br />
							<br />
							This action will:
							<ul className="mt-2 list-inside list-disc space-y-1">
								<li>Close current enrollments as "completed"</li>
								<li>Create new enrollments in the target class</li>
								<li>Update student class references</li>
								<li>Record this action in the execution history</li>
							</ul>
							<br />
							{useBatch && (
								<>
									<br />
									This will run as a <strong>background batch job</strong> since
									there are more than {BATCH_THRESHOLD} students.
								</>
							)}
							<br />
							This operation cannot be easily undone. Are you sure?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleConfirmExecute}>
							Yes, Execute Promotion
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
