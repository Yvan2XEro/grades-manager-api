import { useTranslation } from "react-i18next";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { ClassSelect } from "@/components/inputs/ClassSelect";
import { ExamSearchInput } from "./exam-search-input";

/** Search, year and class filters ("all" = no filter). */
export function ExamFilters({
	search,
	setSearch,
	yearFilter,
	setYearFilter,
	classFilter,
	setClassFilter,
	searchPlaceholder,
	children,
}: {
	search: string;
	setSearch: (v: string) => void;
	yearFilter: string;
	setYearFilter: (v: string) => void;
	classFilter: string;
	setClassFilter: (v: string) => void;
	searchPlaceholder?: string;
	/** Extra filters appended to the row. */
	children?: React.ReactNode;
}) {
	const { t } = useTranslation();
	return (
		<div className="flex flex-wrap items-center gap-3">
			<ExamSearchInput
				value={search}
				onChange={setSearch}
				placeholder={searchPlaceholder ?? t("dean.approvals.searchPlaceholder")}
			/>
			<AcademicYearSelect
				value={yearFilter === "all" ? null : yearFilter}
				onChange={(v) => setYearFilter(v ?? "all")}
				autoSelectActive
				className="w-[170px]"
			/>
			<ClassSelect
				academicYearId={yearFilter !== "all" ? yearFilter : null}
				value={classFilter === "all" ? null : classFilter}
				onChange={(v) => setClassFilter(v ?? "all")}
			/>
			{children}
		</div>
	);
}
