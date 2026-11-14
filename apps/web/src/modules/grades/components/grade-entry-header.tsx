import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import type { CourseInfo } from "../types";

/** Back button, title and "UE / EC • class" of the grade entry page. */
export function GradeEntryHeader({
	courseInfo,
}: {
	courseInfo: CourseInfo | null;
}) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	return (
		<div className="flex items-center gap-4">
			<Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
				<ArrowLeft className="h-5 w-5" />
				<span className="sr-only">Back</span>
			</Button>
			<div>
				<h2 className="text-foreground">{t("teacher.gradeEntry.title")}</h2>
				{courseInfo && (
					<p className="text-muted-foreground text-xs">
						<span className="font-medium">{courseInfo.teaching_unit_code}</span>
						{" / "}
						<span className="font-medium">{courseInfo.course_code}</span>
						{" • "}
						{courseInfo.class_name}
					</p>
				)}
			</div>
		</div>
	);
}
