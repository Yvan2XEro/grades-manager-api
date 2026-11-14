import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/utils/trpc";
import { ALL_FILTER_VALUE, ASSIGNMENT_STATUSES } from "../types";

export interface FeeAssignmentsFilterValues {
	search: string;
	yearId: string;
	classId: string;
	status: string;
}

/** Search, academic year, class and status filters of the assignments list. */
export function FeeAssignmentsFilters({
	value,
	onChange,
}: {
	value: FeeAssignmentsFilterValues;
	onChange: (patch: Partial<FeeAssignmentsFilterValues>) => void;
}) {
	const { t } = useTranslation();
	const { data: classes } = useQuery(
		trpc.classes.list.queryOptions(
			value.yearId ? { academicYearId: value.yearId } : {},
		),
	);

	return (
		<div className="flex flex-wrap gap-2">
			<div className="relative max-w-xs flex-1">
				<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
				<Input
					className="pl-9"
					placeholder={t("common.search")}
					value={value.search}
					onChange={(e) => onChange({ search: e.target.value })}
				/>
			</div>
			<div>
				<label className="mb-1 block text-muted-foreground text-xs">
					{t("feeClearance.structures.fields.academicYear")}
				</label>
				<AcademicYearSelect
					value={value.yearId || null}
					onChange={(v) => onChange({ yearId: v ?? "", classId: "" })}
					allowAll
					autoSelectActive={false}
					className="w-48"
				/>
			</div>
			{classes && classes.length > 0 && (
				<Select
					value={value.classId || ALL_FILTER_VALUE}
					onValueChange={(v) =>
						onChange({ classId: v === ALL_FILTER_VALUE ? "" : v })
					}
				>
					<SelectTrigger className="w-44">
						<SelectValue
							placeholder={t("feeClearance.assignments.fields.class")}
						/>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={ALL_FILTER_VALUE}>{t("common.all")}</SelectItem>
						{classes.map((c) => (
							<SelectItem key={c.id} value={c.id}>
								{c.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			)}
			<Select
				value={value.status || ALL_FILTER_VALUE}
				onValueChange={(v) =>
					onChange({ status: v === ALL_FILTER_VALUE ? "" : v })
				}
			>
				<SelectTrigger className="w-36">
					<SelectValue
						placeholder={t("feeClearance.assignments.fields.status")}
					/>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={ALL_FILTER_VALUE}>{t("common.all")}</SelectItem>
					{ASSIGNMENT_STATUSES.map((s) => (
						<SelectItem key={s} value={s}>
							{t(`feeClearance.assignments.status.${s}`)}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
