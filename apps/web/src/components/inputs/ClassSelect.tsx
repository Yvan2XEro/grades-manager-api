import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { trpc } from "@/utils/trpc";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

type ClassSelectProps = {
	academicYearId: string | null;
	value: string | null;
	onChange: (value: string | null) => void;
	disabled?: boolean;
	placeholder?: string;
};

export function ClassSelect({
	academicYearId,
	value,
	onChange,
	disabled,
	placeholder,
}: ClassSelectProps) {
	const { t } = useTranslation();
	const { data, isLoading } = useQuery({
		queryKey: ["class-select", academicYearId],
		enabled: Boolean(academicYearId),
		queryFn: async () => {
			if (!academicYearId) return [];
			const { items } = await trpc.classes.list.query({
				academicYearId,
				limit: 200,
			});
			return items;
		},
	});

	useEffect(() => {
		if (!academicYearId) {
			onChange(null);
		}
	}, [academicYearId, onChange]);

	return (
		<Select
			value={value ?? "__all"}
			onValueChange={(next) => onChange(next === "__all" ? null : next)}
			disabled={disabled || !academicYearId || isLoading}
		>
			<SelectTrigger>
				<SelectValue
					placeholder={
						placeholder ?? t("admin.exams.filters.classPlaceholder")
					}
				/>
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="__all">
					{t("admin.exams.filters.classPlaceholder")}
				</SelectItem>
				{data?.map((klass) => (
					<SelectItem key={klass.id} value={klass.id}>
						{klass.name}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
