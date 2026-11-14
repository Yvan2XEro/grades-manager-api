import type { RouterOutputs } from "@/utils/trpc";

/** A login session as returned by Better-Auth `listSessions`. */
export type SessionInfo = {
	token?: string | null;
	createdAt?: string | Date | null;
	userAgent?: string | null;
	ipAddress?: string | null;
	current?: boolean;
	[key: string]: unknown;
};

export type SessionResponse =
	| SessionInfo[]
	| {
			sessions?: SessionInfo[];
			currentSessionToken?: string | null;
	  };

export type DomainProfile = RouterOutputs["users"]["getMyProfile"];
