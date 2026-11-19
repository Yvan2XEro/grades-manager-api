import i18n from "@/i18n";

/**
 * Labels of the enum values the API returns (roles, genders, statuses), so
 * no raw English value ever reaches the screen. Unknown values fall back to
 * the value itself, `—` when missing.
 */

const ROLES = [
	"guest",
	"student",
	"staff",
	"grade_editor",
	"dean",
	"teacher",
	"administrator",
	"super_admin",
	"owner",
	"member",
] as const;
type Role = (typeof ROLES)[number];

/** "Administrateur", "Étudiant"… of a business or account role. */
export function roleLabel(role: string | null | undefined) {
	if (!role) return "—";
	return (ROLES as readonly string[]).includes(role)
		? i18n.t(`navigation.roles.${role as Role}`)
		: role;
}

const GENDERS = ["male", "female", "other"] as const;
type Gender = (typeof GENDERS)[number];

/** "Femme", "Homme", "Autre"; imported data may be upper-case ("FEMALE", "F"). */
export function genderLabel(gender: string | null | undefined) {
	if (!gender) return "—";
	const value = gender.trim().toLowerCase();
	const normalized = value === "f" ? "female" : value === "m" ? "male" : value;
	return (GENDERS as readonly string[]).includes(normalized)
		? i18n.t(`admin.users.gender.${normalized as Gender}`)
		: gender;
}

const ENROLLMENT_STATUSES = [
	"active",
	"pending",
	"completed",
	"withdrawn",
	"graduated",
] as const;
type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

/** Status of a class enrollment ("Actif", "Terminé"…). */
export function enrollmentStatusLabel(status: string | null | undefined) {
	if (!status) return "—";
	return (ENROLLMENT_STATUSES as readonly string[]).includes(status)
		? i18n.t(`admin.enrollments.status.${status as EnrollmentStatus}`)
		: status;
}

const COURSE_STATUSES = [
	"planned",
	"active",
	"completed",
	"failed",
	"withdrawn",
] as const;
type CourseStatus = (typeof COURSE_STATUSES)[number];

/** Status of a student's attempt at a course ("En cours", "Échoué"…). */
export function courseStatusLabel(status: string | null | undefined) {
	if (!status) return "—";
	return (COURSE_STATUSES as readonly string[]).includes(status)
		? i18n.t(`common.courseStatus.${status as CourseStatus}`)
		: status;
}

const PROFILE_STATUSES = ["active", "inactive", "suspended"] as const;
type ProfileStatus = (typeof PROFILE_STATUSES)[number];

/** Status of a person's profile ("Actif", "Suspendu"…). */
export function profileStatusLabel(status: string | null | undefined) {
	if (!status) return "—";
	return (PROFILE_STATUSES as readonly string[]).includes(status)
		? i18n.t(`common.${status as ProfileStatus}`)
		: status;
}
