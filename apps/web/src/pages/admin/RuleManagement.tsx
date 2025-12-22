import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	AlertTriangle,
	BookOpenCheck,
	FileCog,
	PlusCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { trpc, trpcClient } from "../../utils/trpc";

const RuleManagement = () => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [selectedInstitution, setSelectedInstitution] = useState<string>("");
	const [selectedCycle, setSelectedCycle] = useState<string>("");
	const [draftRule, setDraftRule] = useState<string>("");

	const institutionsQuery = useQuery({
		queryKey: ["institutions", "faculties"],
		queryFn: async () => {
			const result = await trpcClient.institutions.list.query({ limit: 100 });
			if (!result) {
				return { items: [], total: 0 };
			}
			return {
				...result,
				items: result.items.filter((i) => i.type === "faculty"),
			};
		},
	});
	const cyclesQuery = useQuery({
		...trpc.studyCycles.listCycles.queryOptions({
			institutionId: selectedInstitution || undefined,
			limit: 200,
		}),
		enabled: Boolean(selectedInstitution),
	});
	const rulesQuery = useQuery(trpc.promotions.listDefaultRules.queryOptions());

	const selectedCycleData = useMemo(() => {
		if (!selectedCycle) return undefined;
		return cyclesQuery.data?.items?.find((cycle) => cycle.id === selectedCycle);
	}, [cyclesQuery.data, selectedCycle]);

	const levelsQuery = useQuery({
		...trpc.studyCycles.listLevels.queryOptions({
			cycleId: selectedCycle || "",
		}),
		enabled: Boolean(selectedCycle),
	});

	const saveRule = useMutation({
		mutationFn: async () => {
			await trpcClient.promotions.evaluateStudent.mutate({
				studentId: "preview",
			});
			return true;
		},
		onSuccess: () => {
			toast.success(
				t("admin.rules.toast.saved", {
					defaultValue: "Rule saved successfully",
				}),
			);
			queryClient.invalidateQueries(
				trpc.promotions.listDefaultRules.queryKey(),
			);
		},
		onError: (error: Error) => toast.error(error.message),
	});

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="font-semibold text-2xl text-gray-900">
						{t("admin.rules.title", {
							defaultValue: "Promotion & Rule Center",
						})}
					</h1>
					<p className="text-gray-600">
						{t("admin.rules.subtitle", {
							defaultValue:
								"Curate study cycles, tune credit thresholds, and preview upcoming changes.",
						})}
					</p>
				</div>
				<Button
					type="button"
					variant="outline"
					onClick={() => {
						setDraftRule(JSON.stringify(rulesQuery.data ?? [], null, 2));
					}}
				>
					<PlusCircle className="mr-2 h-4 w-4" />
					{t("admin.rules.actions.clone", { defaultValue: "Clone defaults" })}
				</Button>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>
							{t("admin.rules.studyCycles", { defaultValue: "Study cycles" })}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label className="font-medium text-gray-700 text-sm">
								{t("admin.rules.faculty", { defaultValue: "Faculty" })}
							</Label>
							<Select
								value={selectedInstitution}
								onValueChange={(value) => {
									setSelectedInstitution(value);
									setSelectedCycle("");
								}}
							>
								<SelectTrigger>
									<SelectValue
										placeholder={t("admin.rules.selectFaculty", {
											defaultValue: "Select faculty",
										})}
									/>
								</SelectTrigger>
								<SelectContent>
									{institutionsQuery.data?.items?.map((institution) => (
										<SelectItem key={institution.id} value={institution.id}>
											{institution.nameFr || institution.nameEn}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label className="font-medium text-gray-700 text-sm">
								{t("admin.rules.cycle", { defaultValue: "Study cycle" })}
							</Label>
							<Select
								value={selectedCycle}
								onValueChange={setSelectedCycle}
								disabled={!selectedInstitution}
							>
								<SelectTrigger>
									<SelectValue
										placeholder={t("admin.rules.selectCycle", {
											defaultValue: "Select cycle",
										})}
									/>
								</SelectTrigger>
								<SelectContent>
									{cyclesQuery.data?.items?.map((cycle) => (
										<SelectItem key={cycle.id} value={cycle.id}>
											{cycle.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{selectedCycleData && (
							<div className="rounded-lg border bg-gray-50 p-4 text-gray-700 text-sm">
								<p className="font-semibold text-gray-900">
									{selectedCycleData.name}
								</p>
								<p>
									{t("admin.rules.totalCredits", {
										defaultValue: "Total credits required: {{value}}",
										value: selectedCycleData.totalCreditsRequired,
									})}
								</p>
								<p>
									{t("admin.rules.duration", {
										defaultValue: "Duration: {{value}} years",
										value: selectedCycleData.durationYears,
									})}
								</p>
							</div>
						)}

						{levelsQuery.data && levelsQuery.data.length > 0 && (
							<div className="space-y-3">
								<p className="font-semibold text-gray-800 text-sm">
									{t("admin.rules.levels", { defaultValue: "Cycle levels" })}
								</p>
								<div className="space-y-2">
									{levelsQuery.data.map((level) => (
										<div
											key={level.id}
											className="rounded-lg border bg-white p-3 shadow-sm"
										>
											<div className="flex items-center justify-between">
												<div>
													<p className="font-medium text-gray-900">
														{level.name}
													</p>
													<p className="text-gray-600 text-sm">
														{t("admin.rules.minCredits", {
															defaultValue: "Required credits: {{value}}",
															value: level.minCredits,
														})}
													</p>
												</div>
												<Button variant="ghost" size="sm">
													<BookOpenCheck className="mr-2 h-4 w-4" />
													{t("admin.rules.actions.attach", {
														defaultValue: "View programs",
													})}
												</Button>
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>
							{t("admin.rules.promotionRules", {
								defaultValue: "Promotion rules",
							})}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<p className="text-gray-600 text-sm">
							{t("admin.rules.rulesHint", {
								defaultValue:
									"Default rules come from the server. Clone them to craft faculty-level overrides.",
							})}
						</p>
						<Textarea
							value={draftRule}
							onChange={(event) => setDraftRule(event.target.value)}
							placeholder={JSON.stringify(rulesQuery.data ?? [], null, 2)}
							className="h-64 font-mono text-sm"
						/>
						<Button
							type="button"
							onClick={() => saveRule.mutate()}
							disabled={!draftRule}
						>
							<FileCog className="mr-2 h-4 w-4" />
							{t("admin.rules.actions.save", {
								defaultValue: "Save override",
							})}
						</Button>
						<div className="flex items-start gap-3 rounded-lg bg-amber-50 p-3 text-amber-900 text-sm">
							<AlertTriangle className="mt-0.5 h-4 w-4" />
							<p>
								{t("admin.rules.previewWarning", {
									defaultValue:
										"Overrides are stored soon. For now, keep a note of exported JSON until persistence arrives.",
								})}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default RuleManagement;
