import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useBreadcrumbs } from "@/contexts/breadcrumbs-context";
import { trpc } from "@/utils/trpc";
import { StudentFormDialog } from "./student-form-dialog";

export function StudentNew() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	useBreadcrumbs([
		{ label: t("nav.dashboard", "Dashboard"), href: "/" },
		{ label: t("nav.students", "Students"), href: "/students" },
		{ label: t("students.new", "New Student") },
	]);

	const { data: years, isSuccess } = trpc.academicYears.list.useQuery();
	const activeYearId = (years?.find((y) => y.status === "active") ?? years?.[0])
		?.id;

	useEffect(() => {
		if (!isSuccess) return;
		let cancelled = false;
		const promise = StudentFormDialog.call({ activeYearId });
		promise.then(() => {
			if (!cancelled) navigate("/students");
		});
		// Leaving the route (or StrictMode's re-run) closes this Call.
		return () => {
			cancelled = true;
			StudentFormDialog.end(promise, undefined);
		};
	}, [isSuccess, activeYearId, navigate]);

	return null;
}
