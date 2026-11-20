import { UserX } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";

/** Flags a course assignment still waiting for a teacher. */
export function NoTeacherBadge() {
	const { t } = useTranslation();
	return (
		<Badge
			variant="outline"
			className="gap-1 border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300"
		>
			<UserX className="h-3 w-3" />
			{t("admin.classCourses.noTeacher")}
		</Badge>
	);
}
