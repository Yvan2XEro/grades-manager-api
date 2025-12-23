import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

type AcademicYearSelectProps = {
	value: string | null;
	onChange: (value: string) => void;
	disabled?: boolean;
	placeholder?: string;
	autoSelectActive?: boolean;
	className?: string;
};

export function AcademicYearSelect({
	value,
	onChange,
	disabled,
	placeholder,
	autoSelectActive = true,
	className,
}: AcademicYearSelectProps) {
	const { t } = useTranslation();
	const yearQuery = useQuery({
		...trpc.academicYears.list.queryOptions({}),
	});
	const years = yearQuery.data?.items ?? [];
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
				value={value ?? undefined}
				onValueChange={onChange}
				disabled={disabled || yearQuery.isLoading}
			>
				<SelectTrigger>
					<SelectValue
						placeholder={
							placeholder ?? t("admin.exams.filters.academicYear")
						}
					/>
				</SelectTrigger>
				<SelectContent>
					{yearQuery.isLoading ? (
						<div className="flex items-center justify-center py-2">
							<Spinner className="h-4 w-4" />
						</div>
					) : (
						years.map((year) => (
							<SelectItem key={year.id} value={year.id}>
								{year.name} {year.isActive ? `(${t("common.status.active")})` : ""}
							</SelectItem>
						))
					)}
				</SelectContent>
			</Select>
		</div>
	);
}
