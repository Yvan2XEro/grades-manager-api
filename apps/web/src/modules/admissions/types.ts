import type { UseFormReturn } from "react-hook-form";
import type { RouterOutputs } from "@/utils/trpc";
import type { WizardValues } from "./services/application-schema";

/** Form of the public application wizard, passed to each step. */
export type ApplicationWizardForm = UseFormReturn<WizardValues>;

export type ApplicationDetail = RouterOutputs["admissions"]["get"];
export type ApplicationChecklist = RouterOutputs["admissions"]["getChecklist"];
export type ApplicationListRow =
	RouterOutputs["admissions"]["list"]["rows"][number];

export type ReviewStatus = "accepted" | "rejected" | "waitlisted";
export type DocumentReviewStatus = "valid" | "invalid";

export type ProgramOption = { id: string; name: string; code: string };
export type ClassOption = {
	id: string;
	name: string;
	code: string;
	program: string;
	academicYear: string;
};
