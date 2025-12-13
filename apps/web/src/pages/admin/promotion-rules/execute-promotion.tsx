import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
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
		queryFn: async () => trpcClient.classes.list.query({}),
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

	const handleConfirmExecute = () => {
		if (!state || !targetClassId) return;

		applyPromotionMutation.mutate({
			ruleId: state.ruleId,
			sourceClassId: state.sourceClassId,
			targetClassId,
			academicYearId: state.academicYearId,
			studentIds: state.studentIds,
		});
		setShowConfirmDialog(false);
	};

	if (!state) {
		return (
			<div className="container mx-auto py-8">
				<Card>
					<CardContent className="pt-6">
						<div className="py-12 text-center">
							<p className="text-muted-foreground">
								No promotion data found. Please start from the evaluation page.
							</p>
							<Button
								className="mt-4"
								onClick={() => navigate("/admin/promotion-rules/evaluate")}
							>
								Go to Evaluation
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="container mx-auto space-y-6 py-8">
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
					<h1 className="font-bold text-3xl tracking-tight">
						Execute Promotion
					</h1>
					<p className="mt-1 text-muted-foreground">
						Confirm and apply the promotion to selected students
					</p>
				</div>
			</div>

			{/* Summary */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
				<Card>
					<CardHeader>
						<CardTitle className="font-medium text-muted-foreground text-sm">
							Rule
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-semibold">{rule?.name}</div>
						<p className="mt-1 text-muted-foreground text-sm">
							{rule?.description}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="font-medium text-muted-foreground text-sm">
							Source Class
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-semibold">{sourceClass?.name}</div>
						<Badge variant="secondary" className="mt-2">
							{state.studentIds.length} students selected
						</Badge>
					</CardContent>
				</Card>

				<Card className="border-primary/30 bg-primary/5">
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
			<Card>
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
								{classes?.items
									.filter((cls) => cls.id !== state.sourceClassId)
									.map((cls) => (
										<SelectItem key={cls.id} value={cls.id}>
											{cls.name}
										</SelectItem>
									))}
							</SelectContent>
						</Select>
						<p className="text-muted-foreground text-sm">
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
									{classes?.items.find((c) => c.id === targetClassId)?.name}
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
					onClick={() => navigate("/promotion-rules/evaluate")}
				>
					Back to Evaluation
				</Button>
				<div className="flex-1" />
				<Button
					onClick={handleExecute}
					disabled={!targetClassId || applyPromotionMutation.isPending}
					size="lg"
				>
					{applyPromotionMutation.isPending ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Applying Promotion...
						</>
					) : (
						<>
							<CheckCircle className="mr-2 h-4 w-4" />
							Execute Promotion
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
								{classes?.items.find((c) => c.id === targetClassId)?.name}
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
