import { useTranslation } from "react-i18next";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { SemesterSelect } from "@/components/inputs/SemesterSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { CreateDeliberationState } from "../hooks/use-create-deliberation";
import { DELIBERATION_TYPES } from "../services/deliberation-status";

/** Fields shared by single and multi-class creation: year, type, semester, date, jury. */
export function CreateDeliberationFields({
	state: { fields, patch, setAcademicYear },
}: {
	state: CreateDeliberationState;
}) {
	const { t } = useTranslation();
	return (
		<>
			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label>{t("admin.deliberations.form.academicYear")}</Label>
					<AcademicYearSelect
						value={fields.academicYearId}
						onChange={setAcademicYear}
						autoSelectActive
					/>
				</div>
				<div className="space-y-2">
					<Label>{t("admin.deliberations.form.type")}</Label>
					<Select
						value={fields.type}
						onValueChange={(v) => patch({ type: v, semesterId: null })}
					>
						<SelectTrigger>
							<SelectValue
								placeholder={t("admin.deliberations.form.typePlaceholder")}
							/>
						</SelectTrigger>
						<SelectContent>
							{DELIBERATION_TYPES.map((ty) => (
								<SelectItem key={ty} value={ty}>
									{t(`admin.deliberations.type.${ty}`)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-4">
				{fields.type === "semester" && (
					<div className="space-y-2">
						<Label>{t("admin.deliberations.form.semester")}</Label>
						<SemesterSelect
							value={fields.semesterId}
							onChange={(v) => patch({ semesterId: v })}
							placeholder={t("admin.deliberations.form.semesterPlaceholder")}
						/>
					</div>
				)}
				<div className="space-y-2">
					<Label>{t("admin.deliberations.form.deliberationDate")}</Label>
					<Input
						type="date"
						value={fields.deliberationDate}
						onChange={(e) => patch({ deliberationDate: e.target.value })}
					/>
				</div>
				<div className="space-y-2">
					<Label>
						{t("admin.deliberations.form.juryNumber", {
							defaultValue: "Numéro de jury",
						})}
					</Label>
					<Input
						value={fields.juryNumber}
						onChange={(e) => patch({ juryNumber: e.target.value })}
						placeholder={t("admin.deliberations.form.juryNumberPlaceholder", {
							defaultValue: "ex: J2024-001",
						})}
					/>
				</div>
			</div>
		</>
	);
}
