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

type SemesterSelectProps = {
	value: string | null;
	onChange: (value: string | null) => void;
	disabled?: boolean;
	placeholder?: string;
};

export function SemesterSelect({
	value,
	onChange,
	disabled,
	placeholder,
}: SemesterSelectProps) {
	const { t } = useTranslation();
	const { data, isLoading } = useQuery({
		...trpc.semesters.list.queryOptions({}),
	});
	const options = data?.items ?? [];

	return (
		<Select
			value={value ?? "__all"}
			onValueChange={(next) => onChange(next === "__all" ? null : next)}
			disabled={disabled || isLoading}
		>
			<SelectTrigger>
				<SelectValue
					placeholder={
						placeholder ?? t("admin.exams.filters.semesterPlaceholder")
					}
				/>
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="__all">
					{t("admin.exams.filters.semesterPlaceholder")}
				</SelectItem>
				{options.map((semester) => (
					<SelectItem key={semester.id} value={semester.id}>
						{semester.name}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
