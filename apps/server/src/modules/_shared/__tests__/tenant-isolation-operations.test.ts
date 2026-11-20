import { describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import type { Context } from "@/lib/context";
import {
	logoUrlToBase64,
	recordDiplomationDocument,
} from "@/lib/diplomation-rest";
import {
	asAdmin,
	createAcademicYear,
	createClass,
	createClassCourse,
	createCourse,
	createDomainUser,
	createOrganization,
	createProgram,
	createStudent,
	createUser,
	ensureStudentCourseEnrollment,
	makeTestContext,
} from "@/lib/test-utils";
import { appRouter } from "@/routers";

/**
 * A second institution (with its own organization) holding a complete set of
 * operational data. Every test calls the API as an administrator of the
 * default test institution and must never reach these records.
 */
async function foreignWorld() {
	const org = await createOrganization();
	const [institution] = await db
		.insert(schema.institutions)
		.values({
			code: `OTH-${randomUUID().slice(0, 6)}`,
			shortName: "OTHER",
			nameFr: "Institution étrangère",
			nameEn: "Foreign Institution",
			organizationId: org.id,
		})
		.returning();
	const program = await createProgram({ institutionId: institution.id });
	const year = await createAcademicYear({ institutionId: institution.id });
	const klass = await createClass({
		program: program.id,
		academicYear: year.id,
	});
	const course = await createCourse({ program: program.id });
	const classCourse = await createClassCourse({
		class: klass.id,
		course: course.id,
	});
	const student = await createStudent({
		class: klass.id,
		profile: { institutionId: institution.id },
	});
	await ensureStudentCourseEnrollment(student.id, classCourse.id);
	const profile = await createDomainUser({ institutionId: institution.id });
	return {
		institution,
		program,
		year,
		klass,
		course,
		classCourse,
		student,
		profile,
	};
}

/** An administrator with a stored profile, of the test institution or another one. */
async function adminContext(
	institution?: schema.Institution,
): Promise<Context> {
	const user = await createUser({
		organizationId: institution?.organizationId ?? undefined,
	});
	const ctx = makeTestContext({
		role: "administrator",
		profileOverrides: { id: user.profile.id, memberId: user.profile.memberId },
	});
	return institution
		? ({
				...ctx,
				institution,
				organizationId: institution.organizationId,
			} as Context)
		: ctx;
}

const adminOf = async (institution: schema.Institution) =>
	appRouter.createCaller(await adminContext(institution));

const api = async () => appRouter.createCaller(await adminContext());

const expectNotFound = (promise: Promise<unknown>) =>
	expect(promise).rejects.toHaveProperty("code", "NOT_FOUND");

describe("notifications are scoped to the institution", () => {
	it("lists, counts and changes only the institution's notifications", async () => {
		const foreign = await foreignWorld();
		const own = await createUser();
		const [mine, theirs] = await db
			.insert(schema.notifications)
			.values([
				{
					recipientId: own.profile.id,
					type: "own.event",
					status: "failed",
				},
				{
					recipientId: foreign.profile.id,
					type: "foreign.event",
					status: "failed",
					payload: { grade: 12 },
				},
			])
			.returning();
		const caller = await api();

		// A workflow alert of the other institution, without recipient
		const [theirAlert] = await db
			.insert(schema.notifications)
			.values({
				institutionId: foreign.institution.id,
				type: "exam_locked",
				status: "sent",
			})
			.returning();
		const listed = await caller.notifications.list({});
		expect(listed.items.map((n) => n.id)).toContain(mine.id);
		expect(listed.items.map((n) => n.id)).not.toContain(theirs.id);
		expect(listed.items.map((n) => n.id)).not.toContain(theirAlert.id);
		const paged = await caller.notifications.listPaged({});
		expect(paged.items.map((n) => n.id)).not.toContain(theirs.id);
		expect(paged.total).toBe(1);
		expect((await caller.notifications.stats()).failed).toBe(1);

		await expectNotFound(caller.notifications.retry({ id: theirs.id }));
		await expectNotFound(caller.notifications.acknowledge({ id: theirs.id }));
		await expectNotFound(
			caller.notifications.queue({
				recipientId: foreign.profile.id,
				type: "phishing",
				payload: {},
			}),
		);
		const untouched = await db.query.notifications.findFirst({
			where: eq(schema.notifications.id, theirs.id),
		});
		expect(untouched?.status).toBe("failed");

		expect((await caller.notifications.retry({ id: mine.id }))?.status).toBe(
			"pending",
		);
	});
});

describe("export templates are scoped to the institution", () => {
	it("refuses another institution's templates and assignments", async () => {
		const foreign = await foreignWorld();
		const [template] = await db
			.insert(schema.exportTemplates)
			.values({
				institutionId: foreign.institution.id,
				name: "Foreign PV",
				type: "pv",
				templateBody: "<p>secret</p>",
			})
			.returning();
		await db.insert(schema.classExportTemplates).values({
			institutionId: foreign.institution.id,
			classId: foreign.klass.id,
			templateType: "pv",
			templateId: template.id,
		});
		await db.insert(schema.programExportTemplates).values({
			institutionId: foreign.institution.id,
			programId: foreign.program.id,
			templateType: "pv",
			templateId: template.id,
		});
		const caller = await api();
		const ownTemplate = await caller.exportTemplates.create({
			name: "Own PV",
			type: "pv",
			templateBody: "<p>own</p>",
		});

		await expectNotFound(caller.exportTemplates.getById({ id: template.id }));
		await expectNotFound(
			caller.exportTemplates.update({ id: template.id, name: "Hijacked" }),
		);
		await expectNotFound(caller.exportTemplates.delete({ id: template.id }));
		await expectNotFound(
			caller.exportTemplates.assignToClass({
				classId: foreign.klass.id,
				templateType: "pv",
				templateId: ownTemplate.id,
			}),
		);
		await expectNotFound(
			caller.exportTemplates.updateClassAssignment({
				classId: foreign.klass.id,
				templateType: "pv",
				templateId: ownTemplate.id,
			}),
		);
		await expectNotFound(
			caller.exportTemplates.removeClassAssignment({
				classId: foreign.klass.id,
				templateType: "pv",
			}),
		);
		await expectNotFound(
			caller.exportTemplates.assignToProgram({
				programId: foreign.program.id,
				templateType: "pv",
				templateId: ownTemplate.id,
			}),
		);
		await expectNotFound(
			caller.exportTemplates.removeProgramAssignment({
				programId: foreign.program.id,
				templateType: "pv",
			}),
		);

		const stored = await db.query.exportTemplates.findFirst({
			where: eq(schema.exportTemplates.id, template.id),
		});
		expect(stored?.name).toBe("Foreign PV");
		const classAssignment = await db.query.classExportTemplates.findFirst({
			where: eq(schema.classExportTemplates.classId, foreign.klass.id),
		});
		expect(classAssignment?.templateId).toBe(template.id);
		const programAssignment = await db.query.programExportTemplates.findFirst({
			where: eq(schema.programExportTemplates.programId, foreign.program.id),
		});
		expect(programAssignment?.templateId).toBe(template.id);
	});
});

describe("student course enrollments are scoped to the institution", () => {
	it("refuses foreign students, class courses and classes", async () => {
		const foreign = await foreignWorld();
		const ownClassCourse = await createClassCourse();
		const ownStudent = await createStudent({
			class: ownClassCourse.class,
		});
		const caller = await api();

		await expectNotFound(
			caller.studentCourseEnrollments.create({
				studentId: foreign.student.id,
				classCourseId: foreign.classCourse.id,
			}),
		);
		await expectNotFound(
			caller.studentCourseEnrollments.create({
				studentId: ownStudent.id,
				classCourseId: foreign.classCourse.id,
			}),
		);
		await expectNotFound(
			caller.studentCourseEnrollments.bulkEnroll({
				studentId: foreign.student.id,
				classCourseIds: [foreign.classCourse.id],
			}),
		);
		await expectNotFound(
			caller.studentCourseEnrollments.autoEnrollClass({
				classId: foreign.klass.id,
				academicYearId: foreign.year.id,
			}),
		);
		await expectNotFound(
			caller.studentCourseEnrollments.closeForStudent({
				studentId: foreign.student.id,
			}),
		);
		const record = await db.query.studentCourseEnrollments.findFirst({
			where: eq(schema.studentCourseEnrollments.studentId, foreign.student.id),
		});
		expect(record?.status).toBe("active");
	});
});

describe("student credit ledgers are scoped to the institution", () => {
	it("refuses another institution's student", async () => {
		const foreign = await foreignWorld();
		const caller = await api();
		await expectNotFound(
			caller.studentCreditLedger.summary({ studentId: foreign.student.id }),
		);
		await expectNotFound(
			caller.studentCreditLedger.list({ studentId: foreign.student.id }),
		);
	});
});

describe("grade access grants are scoped to the institution", () => {
	it("refuses to grant access to another institution's profile", async () => {
		const foreign = await foreignWorld();
		await expectNotFound(
			(await api()).gradeAccessGrants.grant({ profileId: foreign.profile.id }),
		);
	});
});

describe("fee payments cannot reference another institution's installments", () => {
	it("refuses foreign installments on payments and orders", async () => {
		const foreign = await foreignWorld();
		const foreignApi = await adminOf(foreign.institution);
		const foreignStructure = await foreignApi.feeClearance.createStructure({
			academicYearId: foreign.year.id,
			name: "Foreign fees",
			totalAmount: 1000,
		});
		const foreignInstallment = await foreignApi.feeClearance.addInstallment({
			feeStructureId: foreignStructure.id,
			label: "Foreign T1",
			amount: 500,
		});

		const caller = await api();
		const klass = await createClass();
		const student = await createStudent({ class: klass.id });
		const structure = await caller.feeClearance.createStructure({
			academicYearId: klass.academicYear,
			name: "Own fees",
			totalAmount: 1000,
		});
		const assignment = await caller.feeClearance.assignStudent({
			studentId: student.id,
			academicYearId: klass.academicYear,
			feeStructureId: structure.id,
		});

		await expectNotFound(
			caller.feeClearance.recordPayment({
				feeAssignmentId: assignment.id,
				amount: 100,
				paymentDate: "2024-03-01",
				paymentMethod: "cash",
				installmentId: foreignInstallment.id,
			}),
		);
		await expectNotFound(
			caller.feeClearance.createOrder({
				feeAssignmentId: assignment.id,
				amount: 100,
				installmentIds: [foreignInstallment.id],
			}),
		);
		const payments = await db.query.feePayments.findMany({
			where: eq(schema.feePayments.feeAssignmentId, assignment.id),
		});
		expect(payments).toHaveLength(0);
	});
});

describe("batch jobs only touch the institution's data", () => {
	it("refuses previews targeting another institution", async () => {
		const foreign = await foreignWorld();
		const ownYear = await createAcademicYear();
		const ownClass = await createClass({ academicYear: ownYear.id });
		const caller = await api();

		await expectNotFound(
			caller.batchJobs.preview({
				type: "creditLedger.recompute",
				params: { academicYearId: foreign.year.id },
			}),
		);
		await expectNotFound(
			caller.batchJobs.preview({
				type: "studentFacts.refreshClass",
				params: {
					classId: foreign.klass.id,
					academicYearId: foreign.year.id,
				},
			}),
		);
		await expectNotFound(
			caller.batchJobs.preview({
				type: "academicYear.setup",
				params: {
					sourceAcademicYearId: ownYear.id,
					targetAcademicYearId: foreign.year.id,
				},
			}),
		);
		await expectNotFound(
			caller.batchJobs.preview({
				type: "promotion.applyBatch",
				params: {
					ruleId: randomUUID(),
					sourceClassId: ownClass.id,
					targetClassId: foreign.klass.id,
					academicYearId: ownYear.id,
					studentIds: [foreign.student.id],
					executedBy: "test",
				},
			}),
		);
	});

	it("re-checks the scope when a job runs", async () => {
		const foreign = await foreignWorld();
		const ownYear = await createAcademicYear();
		const caller = await api();
		const job = await caller.batchJobs.preview({
			type: "creditLedger.recompute",
			params: { academicYearId: ownYear.id },
		});
		// Params tampered with after the preview (e.g. directly in the table)
		await db
			.update(schema.batchJobs)
			.set({ params: { academicYearId: foreign.year.id } })
			.where(eq(schema.batchJobs.id, job.id));
		const ledger = await db.query.studentCreditLedgers.findFirst({
			where: and(
				eq(schema.studentCreditLedgers.studentId, foreign.student.id),
				eq(schema.studentCreditLedgers.academicYearId, foreign.year.id),
			),
		});
		expect(ledger).toBeDefined();
		await db
			.update(schema.studentCreditLedgers)
			.set({ creditsEarned: 42 })
			.where(eq(schema.studentCreditLedgers.id, ledger?.id ?? ""));
		await caller.batchJobs.run({ jobId: job.id }).catch(() => undefined);
		const after = await db.query.studentCreditLedgers.findFirst({
			where: eq(schema.studentCreditLedgers.id, ledger?.id ?? ""),
		});
		expect(after?.creditsEarned).toBe(42);
	});
});

describe("guided import files are scoped to the institution", () => {
	it("cannot read a workbook uploaded by another institution", async () => {
		const foreign = await foreignWorld();
		const foreignApi = await adminOf(foreign.institution);
		const ExcelJS = (await import("exceljs")).default;
		const wb = new ExcelJS.Workbook();
		wb.addWorksheet("Etudiants").addRow(["secret"]);
		const data = Buffer.from(await wb.xlsx.writeBuffer()).toString("base64");
		const { fileId } = await foreignApi.dataImport.upload({
			name: "students.xlsx",
			data,
		});

		const caller = await api();
		await expectNotFound(caller.dataImport.annotate({ fileId, notes: [] }));
		const ownYear = await createAcademicYear();
		await expectNotFound(
			caller.dataImport.workbookSteps({ fileId, academicYearId: ownYear.id }),
		);
		await expectNotFound(
			caller.batchJobs.preview({
				type: "import.step",
				params: { step: "year.students", fileId, academicYearId: ownYear.id },
			}),
		);
		// The owner still reads it
		const own = await foreignApi.dataImport.annotate({ fileId, notes: [] });
		expect(own.data.length).toBeGreaterThan(0);
	});
});

describe("uploaded files are scoped to the institution", () => {
	it("refuses to delete another institution's file or a path outside uploads", async () => {
		const foreign = await foreignWorld();
		const foreignApi = await adminOf(foreign.institution);
		const stored = await foreignApi.files.upload({
			filename: "logo.png",
			mimeType: "image/png",
			base64: Buffer.from("png").toString("base64"),
		});
		const caller = await api();
		await expectNotFound(caller.files.delete({ key: stored.key }));
		await expectNotFound(
			caller.files.delete({ key: "../../../does-not-exist.txt" }),
		);
		const own = await caller.files.upload({
			filename: "logo.png",
			mimeType: "image/png",
			base64: Buffer.from("png").toString("base64"),
		});
		expect((await caller.files.delete({ key: own.key })).success).toBe(true);
		await foreignApi.files.delete({ key: stored.key });
	});
});

describe("Diplomation REST API stays inside the API key's institution", () => {
	it("refuses to log a document for another institution's student", async () => {
		const foreign = await foreignWorld();
		const own = asAdmin().institution;
		const [apiKey] = await db
			.insert(schema.diplomationApiKeys)
			.values({
				institutionId: own.id,
				keyHash: randomUUID(),
				label: "test",
			})
			.returning();
		const refused = await recordDiplomationDocument(apiKey, {
			sourceId: "delib-1",
			documentType: "diploma",
			studentId: foreign.student.id,
		});
		expect(refused.status).toBe(404);
		expect(
			(await recordDiplomationDocument(apiKey, { documentType: "x" })).status,
		).toBe(400);
		const ownStudent = await createStudent();
		const accepted = await recordDiplomationDocument(apiKey, {
			sourceId: "delib-1",
			documentType: "diploma",
			studentId: ownStudent.id,
		});
		expect(accepted.status).toBe(200);
		const logged = await db.query.diplomationDocuments.findMany({
			where: eq(schema.diplomationDocuments.generatedByApiKeyId, apiKey.id),
		});
		expect(logged.map((d) => d.studentId)).toEqual([ownStudent.id]);
	});

	it("never reads a logo outside the uploads folder", async () => {
		expect(await logoUrlToBase64("/uploads/../../package.json")).toBeNull();
		expect(await logoUrlToBase64("../../../../etc/passwd")).toBeNull();
		expect(await logoUrlToBase64("/uploads/imports/x/y.xlsx")).toBeNull();
	});
});
