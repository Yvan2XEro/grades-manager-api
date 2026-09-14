import { createAccessControl, type Role } from "better-auth/plugins/access";
import {
	adminAc,
	defaultStatements,
	ownerAc,
} from "better-auth/plugins/organization/access";

export const organizationRoleNames = [
	"owner",
	"super_admin",
	"administrator",
	"dean",
	"teacher",
	"grade_editor",
	"staff",
	"student",
] as const;

export type OrganizationRoleName = (typeof organizationRoleNames)[number];

const statement = {
	...defaultStatements,
	students: ["create", "read", "update", "delete"],
	enrollments: ["create", "read", "update", "delete"],
	subjects: ["create", "read", "update", "delete"],
	assessments: ["create", "read", "update"],
	grades: ["create", "read", "update", "delete"],
	report_cards: ["read", "publish", "print"],
	class_councils: ["create", "read", "update"],
	attendance: ["create", "read", "update"],
	finance: ["create", "read", "update", "delete"],
	timetable: ["create", "read", "update", "delete"],
	staff: ["create", "read", "update", "delete"],
	settings: ["read", "update"],
	notifications: ["create", "read"],
	official_exams: ["create", "read", "update"],
	academic_catalog: ["create", "read", "update", "delete"],
} as const;

const accessControl = createAccessControl(statement);

// owner: full org-level + all resources
const ownerRole = accessControl.newRole({
	...ownerAc.statements,
	students: ["create", "read", "update", "delete"],
	enrollments: ["create", "read", "update", "delete"],
	subjects: ["create", "read", "update", "delete"],
	assessments: ["create", "read", "update"],
	grades: ["create", "read", "update", "delete"],
	report_cards: ["read", "publish", "print"],
	class_councils: ["create", "read", "update"],
	attendance: ["create", "read", "update"],
	finance: ["create", "read", "update", "delete"],
	timetable: ["create", "read", "update", "delete"],
	staff: ["create", "read", "update", "delete"],
	settings: ["read", "update"],
	notifications: ["create", "read"],
	official_exams: ["create", "read", "update"],
	academic_catalog: ["create", "read", "update", "delete"],
});

// super_admin: same as owner (highest internal privilege, no org-delete distinction)
const superAdminRole = accessControl.newRole({
	...ownerAc.statements,
	students: ["create", "read", "update", "delete"],
	enrollments: ["create", "read", "update", "delete"],
	subjects: ["create", "read", "update", "delete"],
	assessments: ["create", "read", "update"],
	grades: ["create", "read", "update", "delete"],
	report_cards: ["read", "publish", "print"],
	class_councils: ["create", "read", "update"],
	attendance: ["create", "read", "update"],
	finance: ["create", "read", "update", "delete"],
	timetable: ["create", "read", "update", "delete"],
	staff: ["create", "read", "update", "delete"],
	settings: ["read", "update"],
	notifications: ["create", "read"],
	official_exams: ["create", "read", "update"],
	academic_catalog: ["create", "read", "update", "delete"],
});

// administrator: full resource access, no org-level delete
const administratorRole = accessControl.newRole({
	...adminAc.statements,
	students: ["create", "read", "update", "delete"],
	enrollments: ["create", "read", "update", "delete"],
	subjects: ["create", "read", "update", "delete"],
	assessments: ["create", "read", "update"],
	grades: ["create", "read", "update", "delete"],
	report_cards: ["read", "publish", "print"],
	class_councils: ["create", "read", "update"],
	attendance: ["create", "read", "update"],
	finance: ["create", "read", "update", "delete"],
	timetable: ["create", "read", "update", "delete"],
	staff: ["create", "read", "update", "delete"],
	settings: ["read", "update"],
	notifications: ["create", "read"],
	official_exams: ["create", "read", "update"],
	academic_catalog: ["create", "read", "update", "delete"],
});

// dean: broad read, can publish report cards, manage class councils
const deanRole = accessControl.newRole({
	students: ["read"],
	enrollments: ["read"],
	assessments: ["read"],
	grades: ["read"],
	report_cards: ["read", "publish", "print"],
	class_councils: ["create", "read", "update"],
	attendance: ["read"],
	timetable: ["read"],
	staff: ["read"],
	finance: ["read"],
	settings: ["read"],
	notifications: ["create", "read"],
	official_exams: ["read"],
	academic_catalog: ["read"],
});

// teacher: grading, attendance, own courses
const teacherRole = accessControl.newRole({
	students: ["read"],
	assessments: ["create", "read", "update"],
	grades: ["create", "read", "update"],
	report_cards: ["read"],
	class_councils: ["read"],
	attendance: ["create", "read", "update"],
	timetable: ["read"],
	notifications: ["read"],
	official_exams: ["read"],
	academic_catalog: ["read"],
});

// grade_editor: grading only
const gradeEditorRole = accessControl.newRole({
	students: ["read"],
	assessments: ["create", "read", "update"],
	grades: ["create", "read", "update"],
	official_exams: ["read"],
});

// staff: read students and finance
const staffRole = accessControl.newRole({
	students: ["read"],
	enrollments: ["read"],
	finance: ["read"],
});

// student: minimal read
const studentRole = accessControl.newRole({
	students: ["read"],
	report_cards: ["read"],
	timetable: ["read"],
	notifications: ["read"],
});

export const organizationAccessControl = accessControl;

export const organizationRoles: Record<OrganizationRoleName, Role<any>> = {
	owner: ownerRole,
	super_admin: superAdminRole,
	administrator: administratorRole,
	dean: deanRole,
	teacher: teacherRole,
	grade_editor: gradeEditorRole,
	staff: staffRole,
	student: studentRole,
};
