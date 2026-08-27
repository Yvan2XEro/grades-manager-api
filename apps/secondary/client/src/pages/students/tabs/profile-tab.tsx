import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router";

type StudentData = {
	id: string;
	firstName: string;
	lastName: string;
	registrationNumber?: string | null;
	mnu?: string | null;
	gender?: string | null;
	dateOfBirth?: Date | string | null;
	placeOfBirth?: string | null;
	contactName?: string | null;
	contactPhone?: string | null;
	contactEmail?: string | null;
	contactRelation?: string | null;
	reportCardLanguage?: string | null;
};

function InfoRow({
	label,
	value,
}: {
	label: string;
	value: string | null | undefined;
}) {
	return (
		<div className="flex flex-col gap-0.5">
			<span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
				{label}
			</span>
			<span className="text-foreground text-sm">{value || "—"}</span>
		</div>
	);
}

export function StudentProfileTab() {
	const { t } = useTranslation();
	const student = useOutletContext<StudentData>();

	const formatDate = (value: Date | string | null | undefined) => {
		if (!value) return "—";
		return new Date(value).toLocaleDateString();
	};

	const genderLabel = (g: string | null | undefined) => {
		if (!g) return "—";
		if (g === "M") return t("students.gender_m");
		if (g === "F") return t("students.gender_f");
		return g;
	};

	const langLabel = (l: string | null | undefined) => {
		if (!l) return "—";
		if (l === "fr") return "Français";
		if (l === "en") return "English";
		return l;
	};

	return (
		<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
			<div className="space-y-5 rounded-xl border border-border p-5">
				<InfoRow
					label={t("students.registration_number")}
					value={student.registrationNumber}
				/>
				<InfoRow label={t("students.mnu")} value={student.mnu} />
				<InfoRow
					label={t("students.gender")}
					value={genderLabel(student.gender)}
				/>
				<InfoRow
					label={t("students.dob")}
					value={formatDate(student.dateOfBirth)}
				/>
				<InfoRow label={t("students.pob")} value={student.placeOfBirth} />
			</div>

			<div className="space-y-5 rounded-xl border border-border p-5">
				<InfoRow
					label={t("students.contact_name")}
					value={student.contactName}
				/>
				<InfoRow
					label={t("students.contact_phone")}
					value={student.contactPhone}
				/>
				<InfoRow
					label={t("students.contact_email")}
					value={student.contactEmail}
				/>
				<InfoRow
					label={t("students.contact_relation")}
					value={student.contactRelation}
				/>
				<InfoRow
					label={t("students.report_card_language")}
					value={langLabel(student.reportCardLanguage)}
				/>
			</div>
		</div>
	);
}
