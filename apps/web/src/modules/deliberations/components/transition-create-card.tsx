import { AlertCircle, UserRoundCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type {
	CreateTransitionPlanState,
	DeferredOutcome,
} from "../hooks/use-academic-year-transitions";
import { TransitionPreflightPanel } from "./transition-preflight-panel";

function YearSelect({
	label,
	placeholder,
	value,
	onChange,
	years,
}: {
	label: string;
	placeholder: string;
	value: string;
	onChange: (value: string) => void;
	years: CreateTransitionPlanState["years"];
}) {
	return (
		<div className="space-y-2">
			<Label>{label}</Label>
			<Select value={value} onValueChange={onChange}>
				<SelectTrigger>
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent>
					{years.map((year) => (
						<SelectItem key={year.id} value={year.id}>
							{year.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}

/** Form preparing a new transition plan, with its pre-flight diagnostic. */
export function TransitionCreateCard({
	state,
}: {
	state: CreateTransitionPlanState;
}) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const {
		sourceAcademicYearId,
		setSourceAcademicYearId,
		targetAcademicYearId,
		setTargetAcademicYearId,
		sourceClassId,
		setSourceClassId,
		deferredOutcome,
		setDeferredOutcome,
		years,
		classes,
		readiness,
		duplicatePlan,
		canCreate,
		createMutation,
	} = state;

	return (
		<Card className="rounded-lg">
			<CardHeader>
				<CardTitle>{t("admin.academicYearTransitions.create.title")}</CardTitle>
				<CardDescription>
					{t("admin.academicYearTransitions.create.description")}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<YearSelect
					label={t("admin.academicYearTransitions.fields.sourceYear")}
					placeholder={t(
						"admin.academicYearTransitions.placeholders.sourceYear",
					)}
					value={sourceAcademicYearId}
					onChange={setSourceAcademicYearId}
					years={years}
				/>
				<YearSelect
					label={t("admin.academicYearTransitions.fields.targetYear")}
					placeholder={t(
						"admin.academicYearTransitions.placeholders.targetYear",
					)}
					value={targetAcademicYearId}
					onChange={setTargetAcademicYearId}
					years={years}
				/>
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
							{classes.map((klass) => (
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
							setDeferredOutcome(value as DeferredOutcome)
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

				{readiness && <TransitionPreflightPanel readiness={readiness} />}

				{duplicatePlan && (
					<div className="flex items-start gap-2 rounded-md border border-amber-400/40 bg-amber-50 p-3 text-amber-800 text-xs dark:bg-amber-950/30 dark:text-amber-300">
						<AlertCircle className="mt-0.5 size-3.5 shrink-0" />
						<span>
							{t("admin.academicYearTransitions.duplicateWarning")}{" "}
							<button
								type="button"
								className="font-medium underline underline-offset-2 hover:no-underline"
								onClick={() => void navigate(`/promotion/${duplicatePlan.id}`)}
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
	);
}
