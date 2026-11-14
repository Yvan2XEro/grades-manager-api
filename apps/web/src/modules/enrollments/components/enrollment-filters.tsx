import { useTranslation } from "react-i18next";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { SemesterSelect } from "@/components/inputs/SemesterSelect";
import { FilterBar } from "@/components/ui/filter-bar";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { EnrollmentFilters as Filters } from "../hooks/use-enrollments";
import type { EnrollmentStatusFilter } from "../types";

interface EnrollmentFiltersProps {
	filters: Filters;
	onChange: (patch: Partial<Filters>) => void;
	onReset: () => void;
	classes: Array<{
		id: string;
		name: string;
		programOption?: { name?: string | null } | null;
	}>;
	studentsCount: number;
	selectedClass?: {
		cycle?: { name?: string | null } | null;
		cycleLevel?: { name?: string | null } | null;
		programOption?: { name?: string | null } | null;
	};
	windowStatus?: string | null;
}

/** Year / class / semester / status filters, with a summary of the selected class. */
export function EnrollmentFilters({
	filters,
	onChange,
	onReset,
	classes,
	studentsCount,
	selectedClass: selectedClassDetails,
	windowStatus,
}: EnrollmentFiltersProps) {
	const { t } = useTranslation();
	const {
		academicYearId: selectedAcademicYear,
		classId: selectedClass,
		semesterId: selectedSemester,
		status: statusFilter,
	} = filters;

	return (
		<FilterBar
			activeCount={
				[
					!!selectedAcademicYear,
					!!selectedClass,
					!!selectedSemester,
					statusFilter !== "all",
				].filter(Boolean).length
			}
			onReset={onReset}
			defaultOpen
		>
			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				<div className="space-y-1.5">
					<p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
						{t("admin.enrollments.filters.year", {
							defaultValue: "Année académique",
						})}
					</p>
					<AcademicYearSelect
						value={selectedAcademicYear || null}
						onChange={(value) =>
							onChange({
								academicYearId: value ?? "",
								classId: "",
								semesterId: "",
							})
						}
						placeholder={t("admin.enrollments.selectYear", {
							defaultValue: "Sélectionner une année",
						})}
					/>
				</div>
				<div className="space-y-1.5">
					<p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
						{t("admin.enrollments.filters.class", { defaultValue: "Classe" })}
					</p>
					<Select
						value={selectedClass}
						onValueChange={(value) => onChange({ classId: value })}
						disabled={!selectedAcademicYear}
					>
						<SelectTrigger data-testid="class-select" className="w-full">
							<SelectValue
								placeholder={t("admin.enrollments.selectClass", {
									defaultValue: "Sélectionner une classe",
								})}
							/>
						</SelectTrigger>
						<SelectContent>
							{classes.map((klass) => (
								<SelectItem key={klass.id} value={klass.id}>
									{klass.name}
									{klass.programOption?.name
										? ` • ${klass.programOption.name}`
										: ""}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-1.5">
					<p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
						{t("admin.enrollments.filters.semester", {
							defaultValue: "Semestre",
						})}
					</p>
					<SemesterSelect
						value={selectedSemester || null}
						onChange={(v) => onChange({ semesterId: v ?? "" })}
						disabled={!selectedClass}
						placeholder={t("admin.enrollments.selectSemester", {
							defaultValue: "Sélectionner un semestre",
						})}
					/>
				</div>
				<div className="space-y-1.5">
					<p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
						{t("admin.enrollments.fields.status")}
					</p>
					<Select
						value={statusFilter}
						onValueChange={(v) =>
							onChange({ status: v as EnrollmentStatusFilter })
						}
						disabled={!selectedClass}
					>
						<SelectTrigger>
							<SelectValue placeholder={t("admin.enrollments.status.all")} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">
								{t("admin.enrollments.status.all")}
							</SelectItem>
							<SelectItem value="active">
								{t("admin.enrollments.status.active")}
							</SelectItem>
							<SelectItem value="pending">
								{t("admin.enrollments.status.pending")}
							</SelectItem>
							<SelectItem value="completed">
								{t("admin.enrollments.status.completed")}
							</SelectItem>
							<SelectItem value="withdrawn">
								{t("admin.enrollments.status.withdrawn")}
							</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>
			{selectedClass && (
				<div className="mt-3 flex flex-wrap gap-4 rounded-lg border border-dashed bg-muted/30 px-4 py-2.5 text-muted-foreground text-xs">
					<span>
						<span className="font-medium text-foreground">{studentsCount}</span>{" "}
						étudiant(s)
					</span>
					{selectedClassDetails?.cycle?.name && (
						<span>
							Cycle:{" "}
							<span className="font-medium text-foreground">
								{selectedClassDetails.cycle.name}
							</span>
						</span>
					)}
					{selectedClassDetails?.cycleLevel?.name && (
						<span>
							Niveau:{" "}
							<span className="font-medium text-foreground">
								{selectedClassDetails.cycleLevel.name}
							</span>
						</span>
					)}
					{selectedClassDetails?.programOption?.name && (
						<span>
							Option:{" "}
							<span className="font-medium text-foreground">
								{selectedClassDetails.programOption.name}
							</span>
						</span>
					)}
					{windowStatus && (
						<span>
							Fenêtre:{" "}
							<span className="font-medium text-foreground">
								{windowStatus}
							</span>
						</span>
					)}
				</div>
			)}
		</FilterBar>
	);
}
