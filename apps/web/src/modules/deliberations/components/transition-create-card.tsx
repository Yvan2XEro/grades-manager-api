import { AlertCircle, ChevronDown, UserRoundCheck } from "lucide-react";
import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
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
import { formatDate } from "../services/transition-status";
import { TransitionPreflightPanel } from "./transition-preflight-panel";

/**
 * Classes a plan covers: every class of the source year (nothing ticked) or
 * the ticked ones. Several plans may run for the same years on distinct
 * classes.
 */
function ClassScopePicker({
	classes,
	value,
	onChange,
	disabled,
}: {
	classes: CreateTransitionPlanState["classes"];
	value: string[];
	onChange: (ids: string[]) => void;
	disabled?: boolean;
}) {
	const { t } = useTranslation();
	const [search, setSearch] = useState("");
	const selected = new Set(value);
	const term = search.trim().toLowerCase();
	const visible = term
		? classes.filter((c) => `${c.code} ${c.name}`.toLowerCase().includes(term))
		: classes;
	const toggle = (id: string) =>
		onChange(selected.has(id) ? value.filter((v) => v !== id) : [...value, id]);
	const single = classes.find((k) => k.id === value[0]);
	const label =
		value.length === 0
			? t("admin.academicYearTransitions.scope.allClasses")
			: value.length === 1 && single
				? `${single.code} - ${single.name}`
				: t("admin.academicYearTransitions.scope.classCount", {
						count: value.length,
					});
	return (
		<div className="space-y-2">
			<Label>{t("admin.academicYearTransitions.fields.scope")}</Label>
			<Popover>
				<PopoverTrigger asChild>
					<Button
						type="button"
						variant="outline"
						className="w-full justify-between font-normal"
						disabled={disabled}
					>
						<span className="truncate">{label}</span>
						<ChevronDown className="size-4 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent
					align="start"
					className="w-[--radix-popover-trigger-width] min-w-72 p-2"
				>
					<Input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder={t("admin.academicYearTransitions.scope.search")}
						className="mb-2 h-8"
					/>
					<button
						type="button"
						className="mb-1 w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
						onClick={() => onChange([])}
					>
						{t("admin.academicYearTransitions.scope.allClasses")}
					</button>
					<div className="max-h-64 space-y-0.5 overflow-y-auto">
						{visible.map((klass) => (
							<label
								key={klass.id}
								className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"
							>
								<Checkbox
									checked={selected.has(klass.id)}
									onCheckedChange={() => toggle(klass.id)}
								/>
								<span className="truncate">
									{klass.code} - {klass.name}
								</span>
							</label>
						))}
					</div>
				</PopoverContent>
			</Popover>
			<p className="text-muted-foreground text-xs">
				{t("admin.academicYearTransitions.scope.hint")}
			</p>
		</div>
	);
}

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
		sourceClassIds,
		setSourceClassIds,
		deferredOutcome,
		setDeferredOutcome,
		years,
		classes,
		readiness,
		overlappingPlans,
		otherPlans,
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
				<ClassScopePicker
					classes={classes}
					value={sourceClassIds}
					onChange={setSourceClassIds}
					disabled={!sourceAcademicYearId}
				/>
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

				{overlappingPlans.map((plan) => (
					<div
						key={plan.id}
						className="flex items-start gap-2 rounded-md border border-amber-400/40 bg-amber-50 p-3 text-amber-800 text-xs dark:bg-amber-950/30 dark:text-amber-300"
					>
						<AlertCircle className="mt-0.5 size-3.5 shrink-0" />
						<span>
							{t("admin.academicYearTransitions.overlapWarning", {
								classes: plan.classes.map((c) => c.code).join(", "),
								date: formatDate(plan.generatedAt),
								status: t(
									`admin.academicYearTransitions.status.${plan.status}` as never,
								),
							})}{" "}
							<button
								type="button"
								className="font-medium underline underline-offset-2 hover:no-underline"
								onClick={() => void navigate(`/promotion/${plan.id}`)}
							>
								{t("admin.academicYearTransitions.duplicateWarningLink")}
							</button>
						</span>
					</div>
				))}
				{overlappingPlans.length === 0 && otherPlans.length > 0 && (
					<p className="text-muted-foreground text-xs">
						{t("admin.academicYearTransitions.otherPlansHint", {
							count: otherPlans.length,
						})}
					</p>
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
