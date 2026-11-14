import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { QuickCreate } from "@/components/callable/quick-create";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { SemesterSelect } from "@/components/inputs/SemesterSelect";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { ScheduleExamsState } from "../hooks/use-exam-scheduler";
import type { ScoringPolicy } from "../types";

const ALL = "__all__";

function Section({ title, children }: { title: string; children: ReactNode }) {
	return (
		<div className="space-y-3">
			<p className="font-medium text-foreground text-sm">{title}</p>
			{children}
		</div>
	);
}

function Field({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="space-y-1.5">
			<Label className="text-xs">{label}</Label>
			{children}
		</div>
	);
}

/** Left sidebar of the scheduler dialog: period, configuration, date range. */
export function ScheduleExamsSettings({
	state,
}: {
	state: ScheduleExamsState;
}) {
	const { t } = useTranslation();
	return (
		<div className="flex flex-col gap-5 overflow-y-auto border-r bg-muted/30 px-5 py-5">
			<Section
				title={t("admin.examScheduler.form.periodSection", {
					defaultValue: "Période",
				})}
			>
				<Field label={t("admin.examScheduler.form.academicYearLabel")}>
					<AcademicYearSelect
						value={state.academicYearId || null}
						onChange={(v) => state.setAcademicYearId(v ?? "")}
						autoSelectActive
						placeholder={t("admin.examScheduler.form.academicYearPlaceholder")}
					/>
				</Field>
				<Field label={t("admin.examScheduler.form.semesterLabel")}>
					<SemesterSelect
						value={state.semesterId || null}
						onChange={(v) => state.setSemesterId(v ?? "")}
						placeholder={t("admin.examScheduler.form.semesterPlaceholder")}
					/>
				</Field>
			</Section>

			<div className="h-px bg-border" />

			<Section
				title={t("admin.examScheduler.form.configSection", {
					defaultValue: "Configuration",
				})}
			>
				{state.sessionMode === "normal" ? (
					<>
						<Field label={t("admin.examScheduler.form.examTypeLabel")}>
							<QuickCreate
								onCreate={state.createExamType}
								label={t("admin.examTypes.form.createTitle")}
							>
								<Select
									value={state.examTypeId}
									onValueChange={state.selectExamType}
								>
									<SelectTrigger>
										<SelectValue
											placeholder={t(
												"admin.examScheduler.form.examTypePlaceholder",
											)}
										/>
									</SelectTrigger>
									<SelectContent>
										{state.examTypes.map((type) => (
											<SelectItem key={type.id} value={type.id}>
												{type.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</QuickCreate>
						</Field>
						<Field label={t("admin.examScheduler.form.percentageLabel")}>
							<Input
								type="number"
								min={1}
								max={100}
								value={state.percentage}
								onChange={(event) =>
									state.setPercentage(Number(event.target.value) || 0)
								}
							/>
						</Field>
					</>
				) : (
					<>
						<Field label={t("admin.examScheduler.form.scoringPolicyLabel")}>
							<Select
								value={state.scoringPolicy}
								onValueChange={(v) =>
									state.setScoringPolicy(v as ScoringPolicy)
								}
							>
								<SelectTrigger>
									<SelectValue
										placeholder={t(
											"admin.examScheduler.form.scoringPolicyPlaceholder",
										)}
									/>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="replace">
										{t("admin.examScheduler.form.scoringPolicyReplace")}
									</SelectItem>
									<SelectItem value="best_of">
										{t("admin.examScheduler.form.scoringPolicyBestOf")}
									</SelectItem>
								</SelectContent>
							</Select>
						</Field>
						<Field label={t("admin.examScheduler.form.classFilterLabel")}>
							<Select
								value={state.classFilter || ALL}
								onValueChange={(v) => state.setClassFilter(v === ALL ? "" : v)}
							>
								<SelectTrigger>
									<SelectValue
										placeholder={t(
											"admin.examScheduler.form.classFilterPlaceholder",
										)}
									/>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={ALL}>
										{t("admin.examScheduler.form.classFilterPlaceholder")}
									</SelectItem>
									{state.classes.map((cls) => (
										<SelectItem key={cls.id} value={cls.id}>
											{cls.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</Field>
						<Field label={t("admin.examScheduler.form.examTypeFilterLabel")}>
							<Select
								value={state.examTypeFilter || ALL}
								onValueChange={(v) =>
									state.setExamTypeFilter(v === ALL ? "" : v)
								}
							>
								<SelectTrigger>
									<SelectValue
										placeholder={t(
											"admin.examScheduler.form.examTypeFilterPlaceholder",
										)}
									/>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={ALL}>
										{t("admin.examScheduler.form.examTypeFilterPlaceholder")}
									</SelectItem>
									{state.examTypes.map((type) => (
										<SelectItem key={type.id} value={type.id}>
											{type.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</Field>
					</>
				)}
			</Section>

			<div className="h-px bg-border" />

			<Section
				title={t("admin.examScheduler.form.dateRangeSection", {
					defaultValue: "Plage de dates",
				})}
			>
				<Field label={t("admin.examScheduler.form.dateStartLabel")}>
					<DatePicker value={state.dateStart} onChange={state.setDateStart} />
				</Field>
				<Field label={t("admin.examScheduler.form.dateEndLabel")}>
					<DatePicker value={state.dateEnd} onChange={state.setDateEnd} />
				</Field>
			</Section>
		</div>
	);
}
