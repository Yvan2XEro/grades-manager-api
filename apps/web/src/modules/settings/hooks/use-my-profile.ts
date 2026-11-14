import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import type { DomainProfile } from "../types";

export const MY_PROFILE_KEY = ["myProfile"];

/** Domain profile of the signed-in user, with its avatar initials. */
export function useMyProfile() {
	const query = useQuery({
		queryKey: MY_PROFILE_KEY,
		queryFn: () => trpcClient.users.getMyProfile.query(),
	});
	const profile = query.data as DomainProfile | null | undefined;
	const initials =
		`${profile?.firstName?.[0] ?? ""}${profile?.lastName?.[0] ?? ""}`.trim() ||
		"?";
	return { profile, initials };
}
