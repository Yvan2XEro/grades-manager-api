import type { BusinessRole, DomainUserStatus } from "@/db/schema/app-schema";
import { domainUsersRepo } from "@/modules/domain-users";

type ListOpts = {
	cursor?: string | null;
	limit?: number;
	role?: BusinessRole;
	roles?: BusinessRole[];
	status?: DomainUserStatus;
};

export async function list(opts: ListOpts) {
	return domainUsersRepo.list(opts);
}
