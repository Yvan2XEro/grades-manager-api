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
import { enrollmentStatusLabel, roleLabel } from "@/lib/enum-labels";
import { cn } from "@/lib/utils";
import {
	ENROLLMENT_STATUSES,
	type PeopleFilters as Filters,
	type PeopleAudience,
	STAFF_ROLES,
} from "../types";

interface PeopleFiltersProps {
	audience: PeopleAudience;
	filters: Filters;
	onChange: (patch: Partial<Filters>) => void;
}

/**
 * Search plus, for staff, account status and role chips; for students,
 * academic year, class and enrollment status.
 */
export function PeopleFilters({
	audience,
	filters,
	onChange,
}: PeopleFiltersProps) {
	const { t } = useTranslation();
	const isStudent = audience === "students";
	const searching = isStudent && filters.search.trim().length > 0;

	return (
		<div className="space-y-3">
			<div className="flex flex-wrap gap-2">
				<div className="relative min-w-48 flex-1">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						className="pl-9"
						placeholder={
							isStudent
								? t("usersHub.students.searchPlaceholder")
								: t("usersHub.people.searchPlaceholder")
						}
						value={filters.search}
						onChange={(e) => onChange({ search: e.target.value })}
					/>
				</div>
				{!isStudent && (
					<Select
						value={filters.status}
						onValueChange={(status: Filters["status"]) => onChange({ status })}
					>
						<SelectTrigger className="w-40">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">
								{t("common.filters.allStatuses")}
							</SelectItem>
							<SelectItem value="active">{t("common.active")}</SelectItem>
							<SelectItem value="inactive">{t("common.inactive")}</SelectItem>
							<SelectItem value="suspended">{t("common.suspended")}</SelectItem>
						</SelectContent>
					</Select>
				)}
			</div>

			{isStudent ? (
				<div className="space-y-1.5">
					<div
						className={cn(
							"flex flex-wrap gap-2",
							searching && "pointer-events-none opacity-50",
						)}
						aria-disabled={searching}
					>
						<AcademicYearSelect
							value={filters.academicYearId}
							onChange={(academicYearId) =>
								onChange({ academicYearId, classId: null })
							}
							allowAll
							className="w-full sm:w-48"
						/>
						<div className="w-full sm:w-56">
							<ClassSelect
								academicYearId={filters.academicYearId ?? undefined}
								value={filters.classId}
								onChange={(classId) => onChange({ classId })}
							/>
						</div>
						<Select
							value={filters.enrollmentStatus}
							onValueChange={(enrollmentStatus: Filters["enrollmentStatus"]) =>
								onChange({ enrollmentStatus })
							}
						>
							<SelectTrigger className="w-full sm:w-56">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">
									{t("usersHub.students.allEnrollmentStatuses")}
								</SelectItem>
								{ENROLLMENT_STATUSES.map((status) => (
									<SelectItem key={status} value={status}>
										{enrollmentStatusLabel(status)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					{searching && (
						<p className="text-muted-foreground text-xs">
							{t("usersHub.students.searchEverywhere")}
						</p>
					)}
				</div>
			) : (
				<div className="flex flex-wrap gap-2">
					{(["all", ...STAFF_ROLES] as const).map((r) => (
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
							{r === "all" ? t("common.filters.all") : roleLabel(r)}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
