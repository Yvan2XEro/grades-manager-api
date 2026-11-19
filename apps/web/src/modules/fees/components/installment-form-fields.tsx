import { useTranslation } from "react-i18next";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface InstallmentFormValues {
	label: string;
	amount: string;
	dueDate: string;
}

/** Label, amount and due date of an installment (add and edit dialogs). */
export function InstallmentFormFields({
	value,
	onChange,
	currency,
}: {
	value: InstallmentFormValues;
	onChange: (patch: Partial<InstallmentFormValues>) => void;
	/** Shown next to the amount label when given. */
	currency?: string;
}) {
	const { t } = useTranslation();
	return (
		<>
			<div>
				<Label>{t("feeClearance.structures.installments.label")}</Label>
				<Input
					value={value.label}
					onChange={(e) => onChange({ label: e.target.value })}
				/>
			</div>
			<div>
				<Label>
					{t("feeClearance.structures.installments.amount")}
					{currency && ` (${currency})`}
				</Label>
				<Input
					type="number"
					min={0}
					value={value.amount}
					onChange={(e) => onChange({ amount: e.target.value })}
				/>
			</div>
			<div>
				<Label>{t("feeClearance.structures.installments.dueDate")}</Label>
				<DatePicker
					value={value.dueDate}
					onChange={(dueDate) => onChange({ dueDate })}
				/>
			</div>
		</>
	);
}
