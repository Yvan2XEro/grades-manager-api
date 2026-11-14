import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useActiveStructures } from "../hooks/use-fee-options";

/** Labelled select of the active fee structures of an academic year. */
export function FeeStructureSelect({
	academicYearId,
	value,
	onChange,
	triggerClassName,
}: {
	academicYearId: string;
	value: string;
	onChange: (value: string) => void;
	triggerClassName?: string;
}) {
	const { t } = useTranslation();
	const { data: structures } = useActiveStructures(academicYearId);
	return (
		<div>
			<Label>{t("feeClearance.assignments.fields.structure")}</Label>
			<Select value={value} onValueChange={onChange} disabled={!academicYearId}>
				<SelectTrigger className={cn(triggerClassName)}>
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{structures?.map((s) => (
						<SelectItem key={s.id} value={s.id}>
							{s.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
