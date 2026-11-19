/** A jury member as stored on a deliberation (free-text name and role). */
export type JuryMember = {
	domainUserId?: string | null;
	name: string;
	role: string;
};

/** Role of the jury president inside `juryMembers` (mirrors the server). */
export const JURY_PRESIDENT_ROLE = "president";
/** Default role of a member without a specific title. */
export const JURY_MEMBER_ROLE = "member";

/** Separates the president from the other members of a jury. */
export function splitJury(juryMembers: JuryMember[] | null | undefined) {
	const all = juryMembers ?? [];
	return {
		president: all.find((m) => m.role === JURY_PRESIDENT_ROLE) ?? null,
		members: all.filter((m) => m.role !== JURY_PRESIDENT_ROLE),
	};
}
