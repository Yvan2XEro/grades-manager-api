import { createAccessControl, type Role } from "better-auth/plugins/access";
import {
	adminAc,
	defaultStatements,
	memberAc,
	ownerAc,
} from "better-auth/plugins/organization/access";

export const organizationRoleNames = [
	"owner",
	"super_admin",
	"administrator",
	"dean",
	"teacher",
	"staff",
	"student",
] as const;

export type OrganizationRoleName = (typeof organizationRoleNames)[number];

const accessControl = createAccessControl({
	...defaultStatements,
} as const);

const superAdminRole = accessControl.newRole(ownerAc.statements);
const administratorRole = accessControl.newRole(adminAc.statements);
const readerRole = accessControl.newRole(memberAc.statements);

export const organizationAccessControl = accessControl;

export const organizationRoles: Record<OrganizationRoleName, Role<any>> = {
	owner: ownerAc,
	super_admin: superAdminRole,
	administrator: administratorRole,
	dean: readerRole,
	teacher: readerRole,
	staff: readerRole,
	student: readerRole,
};
