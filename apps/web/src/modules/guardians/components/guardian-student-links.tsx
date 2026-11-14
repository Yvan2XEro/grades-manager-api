import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import type { GuardianRow } from "../types";

/** Students linked to a guardian (expanded row of the directory). */
export function GuardianStudentLinks({
	guardian: g,
}: {
	guardian: GuardianRow;
}) {
	const { t } = useTranslation();
	return (
		<div className="space-y-1 py-1">
			{g.studentLinks.map((link) => (
				<div key={link.id} className="flex items-center gap-3 text-sm">
					<span className="text-muted-foreground">→</span>
					<span className="font-medium">
						{link.student.firstName} {link.student.lastName}
					</span>
					{link.student.registrationNumber && (
						<span className="text-muted-foreground">
							{link.student.registrationNumber}
						</span>
					)}
					{link.isPrimary && (
						<Badge variant="default" className="text-xs">
							{t("guardians.fields.isPrimary")}
						</Badge>
					)}
					{link.isEmergencyContact && (
						<Badge variant="outline" className="text-xs">
							{t("guardians.fields.isEmergencyContact")}
						</Badge>
					)}
				</div>
			))}
		</div>
	);
}
