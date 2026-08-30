import { createAccessControl } from "better-auth/plugins/access";

const statement = {
	students: ["create", "read", "update", "delete"],
	enrollments: ["create", "read", "update", "delete"],
	subjects: ["create", "read", "update", "delete"],
	assessments: ["create", "read", "update"],
	report_cards: ["read", "publish", "print"],
	class_councils: ["create", "read", "update"],
	attendance: ["create", "read", "update"],
	finance: ["create", "read", "update", "delete"],
	timetable: ["create", "read", "update", "delete"],
	staff: ["create", "read", "update", "delete"],
	settings: ["read", "update"],
	notifications: ["create", "read"],
	official_exams: ["create", "read", "update"],
} as const;

export const ac = createAccessControl(statement);

export const teacher = ac.newRole({
	students: ["read"],
	assessments: ["create", "read", "update"],
	report_cards: ["read"],
	attendance: ["create", "read", "update"],
	timetable: ["read"],
	notifications: ["read"],
});

export const principal = ac.newRole({
	students: ["read"],
	enrollments: ["read"],
	assessments: ["read"],
	report_cards: ["read", "publish", "print"],
	class_councils: ["read", "update"],
	attendance: ["read"],
	timetable: ["read"],
	staff: ["read"],
	finance: ["read"],
	settings: ["read"],
	notifications: ["create", "read"],
	official_exams: ["read"],
});

export const admin = ac.newRole({
	students: ["create", "read", "update", "delete"],
	enrollments: ["create", "read", "update", "delete"],
	subjects: ["create", "read", "update", "delete"],
	assessments: ["create", "read", "update"],
	report_cards: ["read", "publish", "print"],
	class_councils: ["create", "read", "update"],
	attendance: ["create", "read", "update"],
	finance: ["create", "read", "update", "delete"],
	timetable: ["create", "read", "update", "delete"],
	staff: ["create", "read", "update", "delete"],
	settings: ["read", "update"],
	notifications: ["create", "read"],
	official_exams: ["create", "read", "update"],
});
