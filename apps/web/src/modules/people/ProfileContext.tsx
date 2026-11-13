import { createContext, useContext } from "react";
import type { RouterOutputs } from "@/utils/trpc";

export type ProfileData = RouterOutputs["profiles"]["get"];

export interface ProfileContextValue {
	profileId: string;
	profile: ProfileData;
	isStudent: boolean;
}

export const ProfileContext = createContext<ProfileContextValue | null>(null);

export function useProfileContext(): ProfileContextValue {
	const ctx = useContext(ProfileContext);
	if (!ctx) throw new Error("useProfileContext must be used within ProfileHub");
	return ctx;
}
