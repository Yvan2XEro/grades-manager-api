import { useQueryClient } from "@tanstack/react-query";
import type React from "react";
import { useTranslation } from "react-i18next";
import { PageDialog } from "@/components/callable/page-dialog";
import AcademicYearsPage from "@/modules/academic-years/pages/academic-years-page";
import InstitutionSettingsPage from "@/modules/institution/pages/institution-settings-page";
import StudyCyclesPage from "@/modules/institution/pages/study-cycles-page";
import ProgramsPage from "@/modules/programs/pages/programs-page";
import TeachingUnitsPage from "@/modules/programs/pages/teaching-units-page";
import { trpc } from "@/utils/trpc";
import { G } from "../services/import-steps";

/** Page where each setup step can be done by hand. */
const MANUAL_PAGES = {
	profile: InstitutionSettingsPage,
	"foundation.cycles": StudyCyclesPage,
	"foundation.programs": ProgramsPage,
	"foundation.curriculum": TeachingUnitsPage,
	year: AcademicYearsPage,
} satisfies Record<string, React.ComponentType>;

type ManualKey = keyof typeof MANUAL_PAGES;

/** Tab pages whose title is in their hub header: the dialog shows it. */
const UNTITLED = new Set(["foundation.cycles", "enrollments", "grades"]);

export const hasManualEntry = (key: string): key is ManualKey =>
	key in MANUAL_PAGES;

/**
 * Opens the manual entry page of a step in a large dialog over the import,
 * then refreshes the setup progress when it is closed.
 */
export function useManualEntry() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	return async (key: string) => {
		if (!hasManualEntry(key)) return;
		const Page = MANUAL_PAGES[key];
		await PageDialog.call({
			title: t(`${G}manualTitle.${key}`),
			content: <Page />,
			showTitle: UNTITLED.has(key),
		});
		queryClient.invalidateQueries(trpc.dataImport.overview.queryFilter());
	};
}
