import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
	AcademicYearSelect,
	ClassSelect,
	DebouncedSearchField,
	SemesterSelect,
} from "@/components/inputs";
import { DatePicker } from "@/components/ui/date-picker";
import { FilterBar } from "@/components/ui/filter-bar";
import type { ExamFilters as ExamFilterValues } from "../hooks/use-exams";

function Field({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="space-y-1.5">
			<p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
				{label}
			</p>
			{children}
		</div>
	);
}

interface ExamFiltersProps {
	filters: ExamFilterValues;
	setFilter: <K extends keyof ExamFilterValues>(
		key: K,
		value: ExamFilterValues[K],
	) => void;
	onReset: () => void;
	isLoading: boolean;
}

/** Collapsible filter bar of the exams list. */
export function ExamFilters({
	filters,
	setFilter,
	onReset,
	isLoading,
}: ExamFiltersProps) {
	const { t } = useTranslation();
	const noYear = !filters.academicYearId;
	return (
		<FilterBar
			activeCount={Object.values(filters).filter(Boolean).length}
			onReset={onReset}
		>
			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				<Field label={t("admin.exams.filters.search")}>
					<DebouncedSearchField
						value={filters.searchTerm}
						onChange={(value) => setFilter("searchTerm", value)}
						placeholder={t("admin.exams.filters.searchPlaceholder")}
						disabled={noYear}
					/>
				</Field>
				<Field label={t("admin.exams.filters.academicYear")}>
					<AcademicYearSelect
						value={filters.academicYearId}
						onChange={(value) => setFilter("academicYearId", value)}
						disabled={isLoading}
					/>
				</Field>
				<Field label={t("admin.exams.filters.class")}>
					<ClassSelect
						academicYearId={filters.academicYearId}
						value={filters.classId}
						onChange={(value) => setFilter("classId", value)}
						disabled={noYear}
					/>
				</Field>
				<Field label={t("admin.exams.filters.semester")}>
					<SemesterSelect
						value={filters.semesterId}
						onChange={(value) => setFilter("semesterId", value)}
					/>
				</Field>
				<Field label={t("admin.exams.filters.dateFrom")}>
					<DatePicker
						value={filters.dateFrom ?? undefined}
						onChange={(d) => setFilter("dateFrom", d ?? null)}
						placeholder={t("admin.exams.filters.dateFromPlaceholder")}
						disabled={noYear}
					/>
				</Field>
				<Field label={t("admin.exams.filters.dateTo")}>
					<DatePicker
						value={filters.dateTo ?? undefined}
						onChange={(d) => setFilter("dateTo", d ?? null)}
						placeholder={t("admin.exams.filters.dateToPlaceholder")}
						disabled={noYear}
					/>
				</Field>
			</div>
		</FilterBar>
	);
}
