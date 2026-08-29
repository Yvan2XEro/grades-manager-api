import {
	boolean,
	index,
	integer,
	jsonb,
	numeric,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const id = () => uuid("id").primaryKey().defaultRandom();
const timestamps = () => ({
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

// ─── Institutions ─────────────────────────────────────────────────────────────
// Maps 1-to-1 with Better-Auth organization. id = org.id

export const institutions = pgTable("institutions", {
	id: uuid("id").primaryKey(),
	name: varchar("name", { length: 255 }).notNull(),
	minesecCode: varchar("minesec_code", { length: 50 }),
	type: varchar("type", { length: 20 }).notNull().default("lycee"), // lycee | college | mixed
	address: text("address"),
	city: varchar("city", { length: 100 }),
	phone: varchar("phone", { length: 30 }),
	email: varchar("email", { length: 255 }),
	logoUrl: text("logo_url"),
	assessmentMode: varchar("assessment_mode", { length: 20 })
		.notNull()
		.default("six_sequence"), // six_sequence | composition
	...timestamps(),
});

// ─── Academic years ───────────────────────────────────────────────────────────

export const academicYears = pgTable(
	"academic_years",
	{
		id: id(),
		institutionId: uuid("institution_id")
			.notNull()
			.references(() => institutions.id, { onDelete: "cascade" }),
		name: varchar("name", { length: 50 }).notNull(), // e.g. "2025-2026"
		startDate: timestamp("start_date", { withTimezone: true }).notNull(),
		endDate: timestamp("end_date", { withTimezone: true }).notNull(),
		status: varchar("status", { length: 20 }).notNull().default("active"), // active | closed | archived
		assessmentMode: varchar("assessment_mode", { length: 20 })
			.notNull()
			.default("six_sequence"),
		...timestamps(),
	},
	(t) => [index("ay_inst_idx").on(t.institutionId)],
);

// ─── Terms ────────────────────────────────────────────────────────────────────

export const terms = pgTable(
	"terms",
	{
		id: id(),
		institutionId: uuid("institution_id")
			.notNull()
			.references(() => institutions.id, { onDelete: "cascade" }),
		academicYearId: uuid("academic_year_id")
			.notNull()
			.references(() => academicYears.id, { onDelete: "cascade" }),
		termNumber: integer("term_number").notNull(), // 1, 2, or 3
		startDate: timestamp("start_date", { withTimezone: true }).notNull(),
		endDate: timestamp("end_date", { withTimezone: true }).notNull(),
		status: varchar("status", { length: 20 }).notNull().default("open"), // open | closed | archived
		...timestamps(),
	},
	(t) => [uniqueIndex("terms_uniq").on(t.academicYearId, t.termNumber)],
);

// ─── Tracks (filières) ────────────────────────────────────────────────────────

export const tracks = pgTable(
	"tracks",
	{
		id: id(),
		institutionId: uuid("institution_id")
			.notNull()
			.references(() => institutions.id, { onDelete: "cascade" }),
		name: varchar("name", { length: 100 }).notNull(), // "Terminale C"
		code: varchar("code", { length: 20 }).notNull(), // "TLE-C"
		cycleLevel: varchar("cycle_level", { length: 20 }).notNull(), // first_cycle | second_cycle | technical
		isOfficial: boolean("is_official").notNull().default(false),
		...timestamps(),
	},
	(t) => [uniqueIndex("tracks_code_uniq").on(t.institutionId, t.code)],
);

// ─── Subjects ─────────────────────────────────────────────────────────────────

export const subjects = pgTable(
	"subjects",
	{
		id: id(),
		institutionId: uuid("institution_id")
			.notNull()
			.references(() => institutions.id, { onDelete: "cascade" }),
		name: varchar("name", { length: 100 }).notNull(), // English name
		nameFr: varchar("name_fr", { length: 100 }).notNull(), // French name
		code: varchar("code", { length: 30 }).notNull(),
		minesecCode: varchar("minesec_code", { length: 30 }),
		subjectGroup: varchar("subject_group", { length: 50 }), // languages | sciences | humanities | arts | pe
		...timestamps(),
	},
	(t) => [uniqueIndex("subjects_code_uniq").on(t.institutionId, t.code)],
);

// ─── Track × Subject coefficients ────────────────────────────────────────────

export const trackSubjectCoefficients = pgTable(
	"track_subject_coefficients",
	{
		id: id(),
		trackId: uuid("track_id")
			.notNull()
			.references(() => tracks.id, { onDelete: "cascade" }),
		subjectId: uuid("subject_id")
			.notNull()
			.references(() => subjects.id, { onDelete: "cascade" }),
		coefficient: integer("coefficient").notNull().default(1),
		isOfficialExamSubject: boolean("is_official_exam_subject")
			.notNull()
			.default(false),
		...timestamps(),
	},
	(t) => [uniqueIndex("tsc_uniq").on(t.trackId, t.subjectId)],
);

// ─── Staff ────────────────────────────────────────────────────────────────────

export const staff = pgTable(
	"staff",
	{
		id: id(),
		institutionId: uuid("institution_id")
			.notNull()
			.references(() => institutions.id, { onDelete: "cascade" }),
		authUserId: varchar("auth_user_id", { length: 36 }), // Better-Auth user.id (null until account linked)
		firstName: varchar("first_name", { length: 100 }).notNull(),
		lastName: varchar("last_name", { length: 100 }).notNull(),
		email: varchar("email", { length: 255 }).notNull(),
		phone: varchar("phone", { length: 30 }),
		role: varchar("role", { length: 30 }).notNull().default("teacher"), // teacher | admin | principal | vice_principal | staff
		...timestamps(),
	},
	(t) => [
		uniqueIndex("staff_email_inst_uniq").on(t.institutionId, t.email),
		index("staff_auth_user_idx").on(t.authUserId),
	],
);

// ─── Classes ──────────────────────────────────────────────────────────────────

export const classes = pgTable(
	"classes",
	{
		id: id(),
		institutionId: uuid("institution_id")
			.notNull()
			.references(() => institutions.id, { onDelete: "cascade" }),
		academicYearId: uuid("academic_year_id")
			.notNull()
			.references(() => academicYears.id, { onDelete: "cascade" }),
		trackId: uuid("track_id").references(() => tracks.id),
		classMasterId: uuid("class_master_id").references(() => staff.id),
		name: varchar("name", { length: 50 }).notNull(), // "Terminale D"
		code: varchar("code", { length: 20 }).notNull(), // "TLE-D"
		level: varchar("level", { length: 30 }).notNull(), // "6e" | "5e" | "4e" | "3e" | "2nde" | "1re" | "Tle"
		room: varchar("room", { length: 50 }),
		maxCapacity: integer("max_capacity"),
		...timestamps(),
	},
	(t) => [
		uniqueIndex("classes_code_uniq").on(t.academicYearId, t.code),
		index("classes_year_idx").on(t.academicYearId),
	],
);

// ─── Students ─────────────────────────────────────────────────────────────────

export const students = pgTable(
	"students",
	{
		id: id(),
		institutionId: uuid("institution_id")
			.notNull()
			.references(() => institutions.id, { onDelete: "cascade" }),
		firstName: varchar("first_name", { length: 100 }).notNull(),
		lastName: varchar("last_name", { length: 100 }).notNull(),
		dateOfBirth: timestamp("date_of_birth", { withTimezone: true }),
		placeOfBirth: varchar("place_of_birth", { length: 100 }),
		gender: varchar("gender", { length: 10 }), // M | F
		mnu: varchar("mnu", { length: 50 }), // Matricule National Unique
		registrationNumber: varchar("registration_number", { length: 50 }),
		photoUrl: text("photo_url"),
		contactName: varchar("contact_name", { length: 200 }),
		contactPhone: varchar("contact_phone", { length: 30 }),
		contactEmail: varchar("contact_email", { length: 255 }),
		contactRelation: varchar("contact_relation", { length: 50 }), // father | mother | guardian
		reportCardLanguage: varchar("report_card_language", { length: 5 })
			.notNull()
			.default("fr"), // fr | en
		...timestamps(),
	},
	(t) => [
		index("students_inst_idx").on(t.institutionId),
		index("students_mnu_idx").on(t.mnu),
	],
);

// ─── Enrollments ──────────────────────────────────────────────────────────────

export const enrollments = pgTable(
	"enrollments",
	{
		id: id(),
		institutionId: uuid("institution_id")
			.notNull()
			.references(() => institutions.id, { onDelete: "cascade" }),
		studentId: uuid("student_id")
			.notNull()
			.references(() => students.id, { onDelete: "cascade" }),
		academicYearId: uuid("academic_year_id")
			.notNull()
			.references(() => academicYears.id, { onDelete: "cascade" }),
		classId: uuid("class_id")
			.notNull()
			.references(() => classes.id),
		admissionType: varchar("admission_type", { length: 20 })
			.notNull()
			.default("new"), // new | transfer | repeat | promoted
		status: varchar("status", { length: 20 }).notNull().default("active"), // active | transferred | withdrawn | graduated
		...timestamps(),
	},
	(t) => [
		uniqueIndex("enrollments_student_year_uniq").on(
			t.studentId,
			t.academicYearId,
		),
		index("enrollments_class_idx").on(t.classId),
	],
);

// ─── Subject assignments ──────────────────────────────────────────────────────

export const subjectAssignments = pgTable(
	"subject_assignments",
	{
		id: id(),
		institutionId: uuid("institution_id")
			.notNull()
			.references(() => institutions.id, { onDelete: "cascade" }),
		staffId: uuid("staff_id")
			.notNull()
			.references(() => staff.id, { onDelete: "cascade" }),
		subjectId: uuid("subject_id")
			.notNull()
			.references(() => subjects.id, { onDelete: "cascade" }),
		classId: uuid("class_id")
			.notNull()
			.references(() => classes.id, { onDelete: "cascade" }),
		academicYearId: uuid("academic_year_id")
			.notNull()
			.references(() => academicYears.id, { onDelete: "cascade" }),
		...timestamps(),
	},
	(t) => [
		uniqueIndex("sa_uniq").on(
			t.staffId,
			t.subjectId,
			t.classId,
			t.academicYearId,
		),
		index("sa_class_idx").on(t.classId),
	],
);

// ─── Assessments (grades) ─────────────────────────────────────────────────────

export const assessments = pgTable(
	"assessments",
	{
		id: id(),
		institutionId: uuid("institution_id")
			.notNull()
			.references(() => institutions.id, { onDelete: "cascade" }),
		studentId: uuid("student_id")
			.notNull()
			.references(() => students.id, { onDelete: "cascade" }),
		classId: uuid("class_id")
			.notNull()
			.references(() => classes.id, { onDelete: "cascade" }),
		subjectId: uuid("subject_id")
			.notNull()
			.references(() => subjects.id, { onDelete: "cascade" }),
		termId: uuid("term_id")
			.notNull()
			.references(() => terms.id, { onDelete: "cascade" }),
		assessmentType: varchar("assessment_type", { length: 30 }).notNull(),
		// Six-sequence: sequence_1 | sequence_2 | sequence_3 | sequence_4 | sequence_5 | sequence_6
		// Composition: end_of_term_exam | class_test | quiz
		value: numeric("value", { precision: 4, scale: 2 }), // 0.00 - 20.00, null = absent
		enteredById: uuid("entered_by_id").references(() => staff.id),
		...timestamps(),
	},
	(t) => [
		uniqueIndex("assessments_uniq").on(
			t.studentId,
			t.subjectId,
			t.termId,
			t.assessmentType,
		),
		index("assessments_class_term_idx").on(t.classId, t.termId),
	],
);

// ─── Term averages (computed, cached) ────────────────────────────────────────

export const termAverages = pgTable(
	"term_averages",
	{
		id: id(),
		institutionId: uuid("institution_id")
			.notNull()
			.references(() => institutions.id, { onDelete: "cascade" }),
		enrollmentId: uuid("enrollment_id")
			.notNull()
			.references(() => enrollments.id, { onDelete: "cascade" }),
		termId: uuid("term_id")
			.notNull()
			.references(() => terms.id, { onDelete: "cascade" }),
		weightedAverage: numeric("weighted_average", { precision: 4, scale: 2 }),
		totalPoints: numeric("total_points", { precision: 8, scale: 2 }),
		totalCoefficients: integer("total_coefficients"),
		subjectAverages: jsonb("subject_averages"), // { [subjectId]: { avg, points, coeff, rank } }
		rank: integer("rank"),
		mentionCode: varchar("mention_code", { length: 30 }), // below_average | passing | good | very_good | excellent | outstanding
		...timestamps(),
	},
	(t) => [uniqueIndex("ta_uniq").on(t.enrollmentId, t.termId)],
);

// ─── Annual averages (computed at year-end) ───────────────────────────────────

export const annualAverages = pgTable(
	"annual_averages",
	{
		id: id(),
		institutionId: uuid("institution_id")
			.notNull()
			.references(() => institutions.id, { onDelete: "cascade" }),
		enrollmentId: uuid("enrollment_id")
			.notNull()
			.references(() => enrollments.id, { onDelete: "cascade" }),
		t1Average: numeric("t1_average", { precision: 4, scale: 2 }),
		t2Average: numeric("t2_average", { precision: 4, scale: 2 }),
		t3Average: numeric("t3_average", { precision: 4, scale: 2 }),
		annualAverage: numeric("annual_average", { precision: 4, scale: 2 }),
		councilDecision: varchar("council_decision", { length: 40 }),
		// admitted | admitted_commendation | admitted_distinction | honour_roll |
		// conditional_pass | deferred | repeat_authorized | repeat_mandatory | expelled | warning | reprimand
		councilDecisionId: uuid("council_decision_id"), // bare varchar — no .references() to avoid circular FK
		...timestamps(),
	},
	(t) => [uniqueIndex("aa_uniq").on(t.enrollmentId)],
);

// ─── Student comments ─────────────────────────────────────────────────────────

export const studentComments = pgTable(
	"student_comments",
	{
		id: id(),
		institutionId: uuid("institution_id")
			.notNull()
			.references(() => institutions.id, { onDelete: "cascade" }),
		studentId: uuid("student_id")
			.notNull()
			.references(() => students.id, { onDelete: "cascade" }),
		subjectId: uuid("subject_id")
			.notNull()
			.references(() => subjects.id, { onDelete: "cascade" }),
		termId: uuid("term_id")
			.notNull()
			.references(() => terms.id, { onDelete: "cascade" }),
		classId: uuid("class_id")
			.notNull()
			.references(() => classes.id, { onDelete: "cascade" }),
		comment: varchar("comment", { length: 200 }).notNull(),
		...timestamps(),
	},
	(t) => [
		uniqueIndex("sc_uniq").on(t.studentId, t.subjectId, t.termId, t.classId),
	],
);

// ─── Report cards ─────────────────────────────────────────────────────────────

export const reportCards = pgTable(
	"report_cards",
	{
		id: id(),
		institutionId: uuid("institution_id")
			.notNull()
			.references(() => institutions.id, { onDelete: "cascade" }),
		enrollmentId: uuid("enrollment_id")
			.notNull()
			.references(() => enrollments.id, { onDelete: "cascade" }),
		termId: uuid("term_id")
			.notNull()
			.references(() => terms.id, { onDelete: "cascade" }),
		status: varchar("status", { length: 30 }).notNull().default("draft"),
		// draft | generated | validated_admin | validated_vice_principal | signed_principal | published
		snapshotData: jsonb("snapshot_data"), // frozen copy of all data at publish time
		language: varchar("language", { length: 5 }).notNull().default("fr"), // fr | en
		...timestamps(),
	},
	(t) => [
		uniqueIndex("rc_enrollment_term_uniq").on(t.enrollmentId, t.termId),
		index("rc_status_inst_idx").on(t.status, t.institutionId),
	],
);

// ─── Class councils ───────────────────────────────────────────────────────────

export const classCouncils = pgTable(
	"class_councils",
	{
		id: id(),
		institutionId: uuid("institution_id")
			.notNull()
			.references(() => institutions.id, { onDelete: "cascade" }),
		classId: uuid("class_id")
			.notNull()
			.references(() => classes.id, { onDelete: "cascade" }),
		termId: uuid("term_id")
			.notNull()
			.references(() => terms.id, { onDelete: "cascade" }),
		status: varchar("status", { length: 20 }).notNull().default("draft"), // draft | scheduled | held | signed
		presidentId: uuid("president_id").references(() => staff.id),
		secretaryId: uuid("secretary_id").references(() => staff.id),
		scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
		heldAt: timestamp("held_at", { withTimezone: true }),
		pvPath: text("pv_path"),
		globalNote: text("global_note"),
		...timestamps(),
	},
	(t) => [uniqueIndex("cc_class_term_uniq").on(t.classId, t.termId)],
);

// ─── Council decisions ────────────────────────────────────────────────────────

export const councilDecisions = pgTable(
	"council_decisions",
	{
		id: id(),
		institutionId: uuid("institution_id")
			.notNull()
			.references(() => institutions.id, { onDelete: "cascade" }),
		councilId: uuid("council_id")
			.notNull()
			.references(() => classCouncils.id, { onDelete: "cascade" }),
		enrollmentId: uuid("enrollment_id")
			.notNull()
			.references(() => enrollments.id, { onDelete: "cascade" }),
		decision: varchar("decision", { length: 40 }).notNull(),
		// admitted | admitted_commendation | admitted_distinction | honour_roll |
		// conditional_pass | deferred | repeat_authorized | repeat_mandatory | expelled | warning | reprimand
		note: text("note"),
		...timestamps(),
	},
	(t) => [uniqueIndex("cd_uniq").on(t.councilId, t.enrollmentId)],
);

// ─── Fee schedules ────────────────────────────────────────────────────────────

export const feeSchedules = pgTable("fee_schedules", {
	id: id(),
	institutionId: uuid("institution_id")
		.notNull()
		.references(() => institutions.id, { onDelete: "cascade" }),
	academicYearId: uuid("academic_year_id")
		.notNull()
		.references(() => academicYears.id, { onDelete: "cascade" }),
	classId: uuid("class_id").references(() => classes.id), // null = applies to all classes
	tuitionAmount: integer("tuition_amount").notNull().default(0), // XAF
	apeAmount: integer("ape_amount").notNull().default(0), // XAF
	instalments: jsonb("instalments"), // [{ dueDate, amount, label }]
	...timestamps(),
});

// ─── Payments ─────────────────────────────────────────────────────────────────

export const payments = pgTable(
	"payments",
	{
		id: id(),
		institutionId: uuid("institution_id")
			.notNull()
			.references(() => institutions.id, { onDelete: "cascade" }),
		enrollmentId: uuid("enrollment_id")
			.notNull()
			.references(() => enrollments.id, { onDelete: "cascade" }),
		amount: integer("amount").notNull(), // XAF
		feeType: varchar("fee_type", { length: 20 }).notNull().default("tuition"), // tuition | ape | other
		paymentMethod: varchar("payment_method", { length: 30 })
			.notNull()
			.default("cash"),
		// cash | mtn_momo | orange_money | bank_transfer | campost
		reference: varchar("reference", { length: 100 }),
		paidAt: timestamp("paid_at", { withTimezone: true }).notNull(),
		recordedById: uuid("recorded_by_id").references(() => staff.id),
		note: text("note"),
		...timestamps(),
	},
	(t) => [index("payments_enrollment_idx").on(t.enrollmentId)],
);

// ─── Attendance sessions ──────────────────────────────────────────────────────

export const attendanceSessions = pgTable(
	"attendance_sessions",
	{
		id: id(),
		institutionId: uuid("institution_id")
			.notNull()
			.references(() => institutions.id, { onDelete: "cascade" }),
		classId: uuid("class_id")
			.notNull()
			.references(() => classes.id, { onDelete: "cascade" }),
		subjectId: uuid("subject_id").references(() => subjects.id),
		termId: uuid("term_id")
			.notNull()
			.references(() => terms.id, { onDelete: "cascade" }),
		conductedById: uuid("conducted_by_id").references(() => staff.id),
		sessionDate: timestamp("session_date", { withTimezone: true }).notNull(),
		startTime: varchar("start_time", { length: 10 }), // "08:00"
		endTime: varchar("end_time", { length: 10 }),
		...timestamps(),
	},
	(t) => [index("as_class_term_idx").on(t.classId, t.termId)],
);

// ─── Attendance records ───────────────────────────────────────────────────────

export const attendanceRecords = pgTable(
	"attendance_records",
	{
		id: id(),
		institutionId: uuid("institution_id")
			.notNull()
			.references(() => institutions.id, { onDelete: "cascade" }),
		sessionId: uuid("session_id")
			.notNull()
			.references(() => attendanceSessions.id, { onDelete: "cascade" }),
		studentId: uuid("student_id")
			.notNull()
			.references(() => students.id, { onDelete: "cascade" }),
		status: varchar("status", { length: 20 }).notNull().default("present"), // present | absent | late | excused
		justification: text("justification"),
		...timestamps(),
	},
	(t) => [uniqueIndex("ar_session_student_uniq").on(t.sessionId, t.studentId)],
);

// ─── Official exam sessions ───────────────────────────────────────────────────

export const officialExamSessions = pgTable("official_exam_sessions", {
	id: id(),
	institutionId: uuid("institution_id")
		.notNull()
		.references(() => institutions.id, { onDelete: "cascade" }),
	academicYearId: uuid("academic_year_id")
		.notNull()
		.references(() => academicYears.id, { onDelete: "cascade" }),
	examType: varchar("exam_type", { length: 20 }).notNull(), // BEPC | PROBATOIRE | BAC
	series: varchar("series", { length: 10 }), // A4 | C | D | TI | etc. — required for BAC/PROB
	sessionYear: integer("session_year").notNull(),
	centerCode: varchar("center_code", { length: 30 }),
	registrationDeadline: timestamp("registration_deadline", {
		withTimezone: true,
	}),
	...timestamps(),
});

// ─── Official exam registrations ──────────────────────────────────────────────

export const officialExamRegistrations = pgTable(
	"official_exam_registrations",
	{
		id: id(),
		institutionId: uuid("institution_id")
			.notNull()
			.references(() => institutions.id, { onDelete: "cascade" }),
		examSessionId: uuid("exam_session_id")
			.notNull()
			.references(() => officialExamSessions.id, { onDelete: "cascade" }),
		enrollmentId: uuid("enrollment_id")
			.notNull()
			.references(() => enrollments.id, { onDelete: "cascade" }),
		candidateNumber: varchar("candidate_number", { length: 30 }),
		isEligible: boolean("is_eligible").notNull().default(true),
		hasPaidFee: boolean("has_paid_fee").notNull().default(false),
		feeAmount: numeric("fee_amount", { precision: 10, scale: 2 }),
		feePaidAt: timestamp("fee_paid_at", { withTimezone: true }),
		feeTransactionRef: varchar("fee_transaction_ref", { length: 100 }),
		isAdmitted: boolean("is_admitted"),
		mention: varchar("mention", { length: 30 }),
		...timestamps(),
	},
	(t) => [uniqueIndex("oer_uniq").on(t.examSessionId, t.enrollmentId)],
);
