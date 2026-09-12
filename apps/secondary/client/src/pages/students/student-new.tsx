import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useBreadcrumbs } from "@/contexts/breadcrumbs-context";
import { StudentFormDialog } from "./student-form-dialog";

export function StudentNew() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	useBreadcrumbs([
		{ label: t("nav.dashboard", "Dashboard"), href: "/" },
		{ label: t("nav.students", "Students"), href: "/students" },
		{ label: t("students.new", "New Student") },
	]);
	return (
		<StudentFormDialog
			open={true}
			onOpenChange={(open) => {
				if (!open) navigate("/students");
			}}
			onSuccess={() => navigate("/students")}
		/>
	);
}
