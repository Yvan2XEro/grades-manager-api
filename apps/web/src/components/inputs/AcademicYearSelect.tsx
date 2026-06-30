import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { trpc } from "@/utils/trpc";

type AcademicYearSelectProps = {
	value: string | null;
	onChange: (value: string | null) => void;
	disabled?: boolean;
	placeholder?: string;
	autoSelectActive?: boolean;
	allowAll?: boolean;
	allLabel?: string;
	className?: string;
	excludeIds?: string[];
};

const ALL_SENTINEL = "__all_years__";

export function AcademicYearSelect({
	value,
	onChange,
	disabled,
	placeholder,
	autoSelectActive = true,
	allowAll = false,
	allLabel,
	className,
	excludeIds,
}: AcademicYearSelectProps) {
	const { t } = useTranslation();
	const yearQuery = useQuery({
		...trpc.academicYears.list.queryOptions({}),
	});
	const allYears = yearQuery.data?.items ?? [];
	const years = excludeIds
		? allYears.filter((y) => !excludeIds.includes(y.id))
		: allYears;
	const activeYearId = useMemo(
		() => years.find((year) => year.isActive)?.id ?? null,
		[years],
	);

	useEffect(() => {
		if (autoSelectActive && !value && activeYearId) {
			onChange(activeYearId);
		}
	}, [activeYearId, autoSelectActive, onChange, value]);

	return (
		<div className={className}>
			<Select
				value={value ?? (allowAll ? ALL_SENTINEL : undefined)}
				onValueChange={(v) => onChange(v === ALL_SENTINEL ? null : v)}
				disabled={disabled || yearQuery.isLoading}
			>
				<SelectTrigger>
					<SelectValue
						placeholder={placeholder ?? t("admin.exams.filters.academicYear")}
					/>
				</SelectTrigger>
				<SelectContent>
					{yearQuery.isLoading ? (
						<div className="flex items-center justify-center py-2">
							<Spinner className="h-4 w-4" />
						</div>
					) : (
						<>
							{allowAll && (
								<SelectItem value={ALL_SENTINEL}>
									{allLabel ?? t("common.all")}
								</SelectItem>
							)}
							{years.map((year) => (
								<SelectItem key={year.id} value={year.id}>
									{year.name}{" "}
									{year.isActive ? `(${t("common.status.active")})` : ""}
								</SelectItem>
							))}
						</>
					)}
				</SelectContent>
			</Select>
		</div>
	);
}
