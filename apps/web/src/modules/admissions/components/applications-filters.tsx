import { Search, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	ALL,
	type ApplicationsFilters as Filters,
} from "../hooks/use-applications";
import { APPLICATION_STATUSES } from "../services/application-status";
import type { ProgramOption } from "../types";

/** Search, status, program and year filters of the applications list. */
export function ApplicationsFilters({
	filters: {
		searchInput,
		setSearchInput,
		statusFilter,
		setStatusFilter,
		programFilter,
		setProgramFilter,
		yearFilter,
		setYearFilter,
		hasFilters,
		clearFilters,
	},
	programs,
}: {
	filters: Filters;
	programs: ProgramOption[];
}) {
	const { t } = useTranslation();
	return (
		<div className="flex flex-wrap items-end gap-3">
			<div className="relative min-w-[200px] flex-1">
				<Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
				<Input
					className="pl-9"
					placeholder={t("admissions.admin.searchPlaceholder")}
					value={searchInput}
					onChange={(e) => setSearchInput(e.target.value)}
				/>
			</div>
			<Select value={statusFilter} onValueChange={setStatusFilter}>
				<SelectTrigger className="w-44">
					<SelectValue placeholder={t("admissions.admin.allStatuses")} />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={ALL}>
						{t("admissions.admin.allStatuses")}
					</SelectItem>
					{APPLICATION_STATUSES.map((s) => (
						<SelectItem key={s} value={s}>
							{t(`admissions.statuses.${s}`)}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<Select value={programFilter} onValueChange={setProgramFilter}>
				<SelectTrigger className="w-48">
					<SelectValue placeholder={t("admissions.fields.program")} />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={ALL}>
						{t("admissions.admin.allPrograms")}
					</SelectItem>
					{programs.map((p) => (
						<SelectItem key={p.id} value={p.id}>
							{p.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<AcademicYearSelect
				value={yearFilter}
				onChange={(v) => setYearFilter(v)}
				autoSelectActive={false}
				allowAll
				allLabel={t("admissions.admin.allYears")}
				className="w-44"
			/>
			{hasFilters && (
				<Button
					variant="ghost"
					size="sm"
					className="gap-1.5 text-muted-foreground"
					onClick={clearFilters}
				>
					<XCircle className="size-4" />
					{t("common.clearFilters")}
				</Button>
			)}
		</div>
	);
}
