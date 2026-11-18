import type { RouterOutputs } from "@/utils/trpc";

export type GuardianRow =
	RouterOutputs["guardians"]["listAll"]["items"][number];

export const RELATIONSHIP_TYPES = [
	"mother",
	"father",
	"guardian",
	"uncle",
	"aunt",
	"other",
] as const;
export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export const DEFAULT_PREFERENCES = {
	resultsPublished: true,
	attendanceThreshold: true,
	feeClearance: true,
	documentsAvailable: true,
};

export type PreferencesType = typeof DEFAULT_PREFERENCES;
