import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { ClassSelect } from "@/components/inputs/ClassSelect";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { type PeopleFilters as Filters, ROLES } from "../types";

interface PeopleFiltersProps {
	filters: Filters;
	onChange: (patch: Partial<Filters>) => void;
}

/** Search, status, role chips and (for students) class / year filters. */
export function PeopleFilters({ filters, onChange }: PeopleFiltersProps) {
	const { t } = useTranslation();
	const isStudent = filters.role === "student";

	return (
		<div className="space-y-3">
			{/* Search + Status row */}
			<div className="flex flex-wrap gap-2">
				<div className="relative min-w-48 flex-1">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						className="pl-9"
						placeholder={t("usersHub.people.searchPlaceholder", {
							defaultValue: "Search by name or email…",
						})}
						value={filters.search}
						onChange={(e) => onChange({ search: e.target.value })}
					/>
				</div>
				<Select
					value={filters.status}
					onValueChange={(status: Filters["status"]) => onChange({ status })}
				>
					<SelectTrigger className="w-36">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">
							{t("common.filters.allStatuses", {
								defaultValue: "All statuses",
							})}
						</SelectItem>
						<SelectItem value="active">
							{t("common.active", { defaultValue: "Active" })}
						</SelectItem>
						<SelectItem value="inactive">
							{t("common.inactive", { defaultValue: "Inactive" })}
						</SelectItem>
						<SelectItem value="suspended">
							{t("common.suspended", { defaultValue: "Suspended" })}
						</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Role chips */}
			<div className="flex flex-wrap gap-2">
				{(["all", ...ROLES] as const).map((r) => (
					<button
						key={r}
						type="button"
						onClick={() => onChange({ role: r })}
						className={cn(
							"rounded-full border px-3 py-1 text-sm transition",
							filters.role === r
								? "border-primary bg-primary text-primary-foreground"
								: "border-border hover:border-primary",
						)}
					>
						{r === "all"
							? t("common.filters.all", { defaultValue: "All" })
							: t(`roles.${r}`, { defaultValue: r })}
					</button>
				))}
			</div>

			{/* Student-specific filters */}
			{isStudent && (
				<div className="flex flex-wrap gap-2">
					<div className="w-48">
						<ClassSelect
							value={filters.classId}
							onChange={(classId) => onChange({ classId })}
						/>
					</div>
					<AcademicYearSelect
						value={filters.academicYearId}
						onChange={(academicYearId) => onChange({ academicYearId })}
						allowAll
						autoSelectActive={false}
						className="w-48"
					/>
				</div>
			)}
		</div>
	);
}
