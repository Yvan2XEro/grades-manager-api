import { describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import {
	asAdmin,
	asSuperAdmin,
	createAcademicYear,
	createClass,
	createCourse,
	createCycleLevel,
	createDomainUser,
	createExamType,
	createOrganization,
	createProgram,
	createStudyCycle,
	createTeachingUnit,
	createUser,
} from "@/lib/test-utils";
import { appRouter } from "@/routers";

/*
 * Multi-tenant isolation of the academic structure modules: every procedure
 * must refuse (NOT_FOUND) or filter out the records of another institution,
 * and no write may attach a record to another institution's data.
 */

const admin = () => appRouter.createCaller(asAdmin());
const superAdmin = () => appRouter.createCaller(asSuperAdmin());
const ownInstitutionId = () => asAdmin().institution.id;

const NOT_FOUND = ["code", "NOT_FOUND"] as const;

/** A second institution (in its own organization) with its own structure. */
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
	const institutionId = institution.id;
	const cycle = await createStudyCycle({ institutionId });
	const level = await createCycleLevel({ cycleId: cycle.id, code: "FL1" });
	const [center] = await db
		.insert(schema.centers)
		.values({ institutionId, code: "FCTR", name: "Foreign center" })
		.returning();
	const program = await createProgram({
		institutionId,
		code: "FPRG",
		name: "Foreign program",
		cycleId: cycle.id,
	});
	const option = await db.query.programOptions.findFirst({
		where: eq(schema.programOptions.programId, program.id),
	});
	if (!option) throw new Error("option missing");
	const unit = await createTeachingUnit({
		programId: program.id,
		code: "FUE",
		name: "Foreign unit",
	});
	const teacher = await createDomainUser({ institutionId });
	const course = await createCourse({
		program: program.id,
		teachingUnitId: unit.id,
		code: "FCRS",
		name: "Foreign course",
		defaultTeacher: teacher.id,
	});
	const year = await createAcademicYear({ institutionId, name: "F-2024" });
	const klass = await createClass({
		program: program.id,
		academicYear: year.id,
		institutionId,
	});
	const examType = await createExamType({
		institutionId,
		name: "Foreign exam type",
	});
	const [room] = await db
		.insert(schema.rooms)
		.values({ institutionId, code: "FROOM", name: "Foreign room" })
		.returning();
	const [format] = await db
		.insert(schema.registrationNumberFormats)
		.values({
			institutionId,
			name: "Foreign format",
			definition: { segments: [{ kind: "literal", value: "FOR" }] },
			isActive: true,
		})
		.returning();
	const [template] = await db
		.insert(schema.exportTemplates)
		.values({
			institutionId,
			name: "Foreign template",
			type: "pv",
			templateBody: "<p>secret</p>",
		})
		.returning();
	const [gradeScale] = await db
		.insert(schema.gradeScales)
		.values({ institutionId, programId: program.id })
		.returning();
	return {
		institution,
		cycle,
		level,
		center,
		program,
		option,
		unit,
		teacher,
		course,
		year,
		klass,
		examType,
		room,
		format,
		template,
		gradeScale,
	};
}

describe("tenant isolation: programs", () => {
	it("filters and refuses foreign programs", async () => {
		const f = await foreignWorld();
		const own = await createProgram({ code: "OWN1", name: "Own program" });
		const api = admin();

		const list = await api.programs.list({ limit: 100 });
		expect(list.items.map((p) => p.id)).not.toContain(f.program.id);
		const found = await api.programs.search({ query: "Foreign" });
		expect(found.map((p) => p.id)).not.toContain(f.program.id);
		await expect(
			api.programs.getById({ id: f.program.id }),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.programs.getByCode({ code: "FPRG" }),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.programs.update({ id: f.program.id, name: "Hijacked" }),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.programs.delete({ id: f.program.id }),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.programs.listExportTemplates({ programId: f.program.id }),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.programs.setExportTemplates({
				programId: f.program.id,
				templates: [],
			}),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.programs.cloneCurriculum({
				targetProgramId: own.id,
				sourceProgramId: f.program.id,
			}),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.programs.duplicateForCycles({
				sourceProgramIds: [own.id],
				targetCycleIds: [f.cycle.id],
			}),
		).rejects.toHaveProperty(...NOT_FOUND);
		expect(
			await db.query.programs.findFirst({
				where: eq(schema.programs.id, f.program.id),
			}),
		).toBeTruthy();
	});

	it("refuses foreign cycles, centers and export templates on writes", async () => {
		const f = await foreignWorld();
		const own = await createProgram();
		const api = admin();

		await expect(
			api.programs.create({
				code: "X1",
				name: "Injected",
				cycleId: f.cycle.id,
			}),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.programs.create({
				code: "X2",
				name: "Injected 2",
				centerId: f.center.id,
			}),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.programs.create({
				code: "X3",
				name: "Injected 3",
				exportTemplates: [{ templateType: "pv", templateId: f.template.id }],
			}),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.programs.update({ id: own.id, cycleId: f.cycle.id }),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.programs.update({ id: own.id, centerId: f.center.id }),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.programs.setExportTemplates({
				programId: own.id,
				templates: [{ templateType: "pv", templateId: f.template.id }],
			}),
		).rejects.toHaveProperty(...NOT_FOUND);
		const after = await db.query.programs.findFirst({
			where: eq(schema.programs.id, own.id),
		});
		expect(after?.cycleId).not.toBe(f.cycle.id);
		expect(after?.centerId).not.toBe(f.center.id);
	});
});

describe("tenant isolation: program options", () => {
	it("filters and refuses foreign options and programs", async () => {
		const f = await foreignWorld();
		const own = await createProgram();
		const ownOption = await db.query.programOptions.findFirst({
			where: eq(schema.programOptions.programId, own.id),
		});
		if (!ownOption) throw new Error("own option missing");
		const api = admin();

		const list = await api.programOptions.list({ limit: 100 });
		expect(list.items.map((o) => o.id)).not.toContain(f.option.id);
		expect(
			(await api.programOptions.list({ programId: f.program.id })).items,
		).toHaveLength(0);
		const found = await api.programOptions.search({ query: "default" });
		expect(found.map((o) => o.id)).not.toContain(f.option.id);
		await expect(
			api.programOptions.getById({ id: f.option.id }),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.programOptions.update({ id: f.option.id, name: "Hijacked" }),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.programOptions.delete({ id: f.option.id }),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.programOptions.create({
				programId: f.program.id,
				name: "Injected",
				code: "inj",
			}),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.programOptions.update({ id: ownOption.id, programId: f.program.id }),
		).rejects.toHaveProperty(...NOT_FOUND);
	});
});

describe("tenant isolation: teaching units", () => {
	it("filters and refuses foreign units, programs and levels", async () => {
		const f = await foreignWorld();
		const own = await createProgram();
		const ownUnit = await createTeachingUnit({ programId: own.id });
		const api = admin();

		const list = await api.teachingUnits.list({ limit: 100 });
		expect(list.items.map((u) => u.id)).not.toContain(f.unit.id);
		const paged = await api.teachingUnits.listPaged({
			programId: f.program.id,
		});
		expect(paged.items).toHaveLength(0);
		await expect(
			api.teachingUnits.getById({ id: f.unit.id }),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.teachingUnits.update({ id: f.unit.id, name: "Hijacked" }),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.teachingUnits.delete({ id: f.unit.id }),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.teachingUnits.create({
				programId: f.program.id,
				name: "Injected",
				code: "INJ",
			}),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.teachingUnits.update({ id: ownUnit.id, programId: f.program.id }),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.teachingUnits.update({ id: ownUnit.id, cycleLevelId: f.level.id }),
		).rejects.toThrow();
	});
});

describe("tenant isolation: courses", () => {
	it("filters and refuses foreign courses", async () => {
		const f = await foreignWorld();
		const api = admin();

		const list = await api.courses.list({ limit: 100 });
		expect(list.items.map((c) => c.id)).not.toContain(f.course.id);
		const paged = await api.courses.listPaged({ programId: f.program.id });
		expect(paged.items).toHaveLength(0);
		const found = await api.courses.search({ query: "Foreign" });
		expect(found.map((c) => c.id)).not.toContain(f.course.id);
		await expect(
			api.courses.getById({ id: f.course.id }),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.courses.getByCode({ code: "FCRS", programId: f.program.id }),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.courses.update({ id: f.course.id, name: "Hijacked" }),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.courses.delete({ id: f.course.id }),
		).rejects.toHaveProperty(...NOT_FOUND);
		const ownTeacher = (await createUser()).profile;
		await expect(
			api.courses.assignDefaultTeacher({
				courseId: f.course.id,
				teacherId: ownTeacher.id,
			}),
		).rejects.toHaveProperty(...NOT_FOUND);
		expect(
			await db.query.courses.findFirst({
				where: eq(schema.courses.id, f.course.id),
			}),
		).toBeTruthy();
	});

	it("refuses foreign programs, units, teachers and prerequisites on writes", async () => {
		const f = await foreignWorld();
		const ownProgram = await createProgram();
		const ownUnit = await createTeachingUnit({ programId: ownProgram.id });
		const ownTeacher = (await createUser()).profile;
		const ownCourse = await createCourse({
			program: ownProgram.id,
			teachingUnitId: ownUnit.id,
			defaultTeacher: ownTeacher.id,
		});
		const api = admin();
		const base = {
			code: "INJ",
			name: "Injected",
			hours: 10,
			program: ownProgram.id,
			teachingUnitId: ownUnit.id,
		};

		await expect(
			api.courses.create({
				...base,
				program: f.program.id,
				teachingUnitId: f.unit.id,
			}),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.courses.create({ ...base, defaultTeacher: f.teacher.id }),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.courses.create({ ...base, prerequisiteCourseIds: [f.course.id] }),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.courses.update({ id: ownCourse.id, program: f.program.id }),
		).rejects.toThrow();
		await expect(
			api.courses.update({ id: ownCourse.id, defaultTeacher: f.teacher.id }),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.courses.update({
				id: ownCourse.id,
				prerequisiteCourseIds: [f.course.id],
			}),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.courses.assignDefaultTeacher({
				courseId: ownCourse.id,
				teacherId: f.teacher.id,
			}),
		).rejects.toHaveProperty(...NOT_FOUND);

		const after = await db.query.courses.findFirst({
			where: eq(schema.courses.id, ownCourse.id),
		});
		expect(after?.program).toBe(ownProgram.id);
		expect(after?.defaultTeacher).toBe(ownTeacher.id);
		const prereqs = await db.query.coursePrerequisites.findMany({
			where: eq(schema.coursePrerequisites.courseId, ownCourse.id),
		});
		expect(prereqs).toHaveLength(0);
	});
});

describe("tenant isolation: study cycles", () => {
	it("filters and refuses foreign cycles and levels", async () => {
		const f = await foreignWorld();
		const own = await createStudyCycle({ institutionId: ownInstitutionId() });
		const ownLevel = await createCycleLevel({ cycleId: own.id });
		const api = admin();

		const list = await api.studyCycles.listCycles({ limit: 100 });
		expect(list.items.map((c) => c.id)).not.toContain(f.cycle.id);
		expect(
			(await api.studyCycles.listCycles({ institutionId: f.institution.id }))
				.items,
		).toHaveLength(0);
		const paged = await api.studyCycles.listPaged({});
		expect(paged.items.map((c) => c.id)).not.toContain(f.cycle.id);
		await expect(
			api.studyCycles.getCycle({ id: f.cycle.id }),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.studyCycles.updateCycle({ id: f.cycle.id, name: "Hijacked" }),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.studyCycles.deleteCycle({ id: f.cycle.id }),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.studyCycles.listLevels({ cycleId: f.cycle.id }),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.studyCycles.getLevel({ id: f.level.id }),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.studyCycles.updateLevel({ id: f.level.id, name: "Hijacked" }),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.studyCycles.deleteLevel({ id: f.level.id }),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.studyCycles.createLevel({
				cycleId: f.cycle.id,
				code: "X1",
				name: "Injected",
			}),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.studyCycles.updateLevel({ id: ownLevel.id, cycleId: f.cycle.id }),
		).rejects.toHaveProperty(...NOT_FOUND);
	});

	it("cannot move a cycle into another institution", async () => {
		const f = await foreignWorld();
		const own = await createStudyCycle({ institutionId: ownInstitutionId() });
		const api = admin();
		await api.studyCycles
			.updateCycle({ id: own.id, institutionId: f.institution.id })
			.catch(() => undefined);
		const created = await api.studyCycles.createCycle({
			code: "INJ",
			name: "Injected",
			institutionId: f.institution.id,
		});
		const rows = await db.query.studyCycles.findMany({
			where: eq(schema.studyCycles.institutionId, ownInstitutionId()),
		});
		expect(rows.map((c) => c.id)).toContain(own.id);
		expect(rows.map((c) => c.id)).toContain(created.id);
	});

	it("does not expose cycles of a sister institution of the same organization", async () => {
		const [sister] = await db
			.insert(schema.institutions)
			.values({
				code: `SIS-${randomUUID().slice(0, 6)}`,
				nameFr: "Soeur",
				nameEn: "Sister",
				organizationId: asAdmin().institution.organizationId,
			})
			.returning();
		const cycle = await createStudyCycle({ institutionId: sister.id });
		const api = admin();
		await expect(
			api.studyCycles.getCycle({ id: cycle.id }),
		).rejects.toHaveProperty(...NOT_FOUND);
		const list = await api.studyCycles.listCycles({ limit: 100 });
		expect(list.items.map((c) => c.id)).not.toContain(cycle.id);
	});
});

describe("tenant isolation: academic years", () => {
	it("filters and refuses foreign academic years", async () => {
		const f = await foreignWorld();
		const api = admin();
		const list = await api.academicYears.list({ limit: 100 });
		expect(list.items.map((y) => y.id)).not.toContain(f.year.id);
		const paged = await api.academicYears.listPaged({});
		expect(paged.items.map((y) => y.id)).not.toContain(f.year.id);
		await expect(
			api.academicYears.getById({ id: f.year.id }),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.academicYears.update({ id: f.year.id, name: "Hijacked" }),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.academicYears.delete({ id: f.year.id }),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.academicYears.activationChecklist({ id: f.year.id }),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.academicYears.createNextYear({ sourceYearId: f.year.id }),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			superAdmin().academicYears.setActive({ id: f.year.id, isActive: true }),
		).rejects.toHaveProperty(...NOT_FOUND);
	});
});

describe("tenant isolation: grade scales", () => {
	it("refuses foreign programs", async () => {
		const f = await foreignWorld();
		const api = admin();
		await expect(
			api.gradeScales.get({ programId: f.program.id }),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.gradeScales.upsert({
				programId: f.program.id,
				passThreshold: 12,
				compensationThreshold: 9,
				mentionRanges: [
					{ key: "p", label: "P", labelEn: "P", gradeLetter: "P", min: 10 },
				],
			}),
		).rejects.toHaveProperty(...NOT_FOUND);
		const foreignScale = await db.query.gradeScales.findFirst({
			where: eq(schema.gradeScales.id, f.gradeScale.id),
		});
		expect(Number(foreignScale?.passThreshold)).toBe(10);
		const injected = await db.query.gradeScales.findMany({
			where: eq(schema.gradeScales.programId, f.program.id),
		});
		expect(injected).toHaveLength(1);
	});
});

describe("tenant isolation: exam types", () => {
	it("filters and refuses foreign exam types", async () => {
		const f = await foreignWorld();
		const api = admin();
		const list = await api.examTypes.list({ limit: 100 });
		expect(list.items.map((t) => t.id)).not.toContain(f.examType.id);
		const paged = await api.examTypes.listPaged({});
		expect(paged.items.map((t) => t.id)).not.toContain(f.examType.id);
		await expect(
			api.examTypes.getById({ id: f.examType.id }),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.examTypes.update({ id: f.examType.id, name: "Hijacked" }),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.examTypes.delete({ id: f.examType.id }),
		).rejects.toHaveProperty(...NOT_FOUND);
	});
});

describe("tenant isolation: registration numbers", () => {
	it("filters and refuses foreign formats and classes", async () => {
		const f = await foreignWorld();
		const api = admin();
		const list = await api.registrationNumbers.list({ includeInactive: true });
		expect(list.map((x) => x.id)).not.toContain(f.format.id);
		const active = await api.registrationNumbers.getActive();
		expect(active?.id).not.toBe(f.format.id);
		await expect(
			api.registrationNumbers.update({ id: f.format.id, name: "Hijacked" }),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.registrationNumbers.delete({ id: f.format.id }),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.registrationNumbers.preview({
				classId: f.klass.id,
				formatId: f.format.id,
			}),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.registrationNumbers.preview({
				classId: f.klass.id,
				definition: { segments: [{ kind: "literal", value: "X" }] },
			}),
		).rejects.toHaveProperty(...NOT_FOUND);
		const ownClass = await createClass();
		await expect(
			api.registrationNumbers.preview({
				classId: ownClass.id,
				formatId: f.format.id,
			}),
		).rejects.toHaveProperty(...NOT_FOUND);
	});
});

describe("tenant isolation: centers", () => {
	it("filters and refuses foreign centers", async () => {
		const f = await foreignWorld();
		const api = admin();
		const list = await api.centers.list({});
		expect(list.items.map((c) => c.id)).not.toContain(f.center.id);
		await expect(
			api.centers.getById({ id: f.center.id }),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.centers.update({ id: f.center.id, name: "Hijacked" }),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.centers.delete({ id: f.center.id }),
		).rejects.toHaveProperty(...NOT_FOUND);
	});
});

describe("tenant isolation: rooms", () => {
	it("filters and refuses foreign rooms", async () => {
		const f = await foreignWorld();
		const api = admin();
		const list = await api.rooms.list({});
		expect(list.map((r) => r.id)).not.toContain(f.room.id);
		await expect(
			api.rooms.update({ id: f.room.id, name: "Hijacked" }),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(api.rooms.delete({ id: f.room.id })).rejects.toHaveProperty(
			...NOT_FOUND,
		);
	});
});

describe("tenant isolation: semesters", () => {
	it("is a read-only platform catalog", async () => {
		const list = await admin().semesters.list();
		expect(list.items.length).toBeGreaterThan(0);
		expect(
			Object.keys(appRouter._def.procedures).filter((k) =>
				k.startsWith("semesters."),
			),
		).toEqual(["semesters.list"]);
	});
});

describe("tenant isolation: institutions", () => {
	it("get returns the caller's own institution", async () => {
		const f = await foreignWorld();
		// Make the foreign institution the platform "main" one.
		await db.update(schema.institutions).set({ isMain: false });
		await db
			.update(schema.institutions)
			.set({ isMain: true })
			.where(eq(schema.institutions.id, f.institution.id));
		const read = await admin().institutions.get();
		expect(read?.id).toBe(ownInstitutionId());
	});

	it("lists and reads only institutions of the caller's organization", async () => {
		const f = await foreignWorld();
		const api = admin();
		const list = await api.institutions.list();
		const ids = list.map((i) => i?.id);
		expect(ids).toContain(ownInstitutionId());
		expect(ids).not.toContain(f.institution.id);
		await expect(
			api.institutions.getById({ id: f.institution.id }),
		).rejects.toHaveProperty(...NOT_FOUND);
	});

	it("refuses to change or delete a foreign institution", async () => {
		const f = await foreignWorld();
		const api = admin();
		await expect(
			api.institutions.update({
				id: f.institution.id,
				data: { nameEn: "Hijacked" },
			}),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.institutions.upsert({
				id: f.institution.id,
				code: "HIJ",
				nameFr: "Hijacked",
				nameEn: "Hijacked",
			}),
		).rejects.toHaveProperty(...NOT_FOUND);
		await expect(
			api.institutions.delete({ id: f.institution.id }),
		).rejects.toHaveProperty(...NOT_FOUND);
		const after = await db.query.institutions.findFirst({
			where: eq(schema.institutions.id, f.institution.id),
		});
		expect(after?.nameEn).toBe("Foreign Institution");
	});

	it("upsert without id updates the caller's institution, never the main one", async () => {
		const f = await foreignWorld();
		await db.update(schema.institutions).set({ isMain: false });
		await db
			.update(schema.institutions)
			.set({ isMain: true })
			.where(eq(schema.institutions.id, f.institution.id));
		const saved = await admin().institutions.upsert({
			code: "OWNUP",
			nameFr: "Mine",
			nameEn: "Mine",
		});
		expect(saved?.id).toBe(ownInstitutionId());
		const foreign = await db.query.institutions.findFirst({
			where: eq(schema.institutions.id, f.institution.id),
		});
		expect(foreign?.nameEn).toBe("Foreign Institution");
	});

	it("cannot move an institution into another organization or under a foreign parent", async () => {
		const f = await foreignWorld();
		const api = admin();
		const orgId = asAdmin().institution.organizationId;
		await api.institutions
			.update({
				id: ownInstitutionId(),
				data: { organizationId: f.institution.organizationId ?? undefined },
			})
			.catch(() => undefined);
		const own = await db.query.institutions.findFirst({
			where: eq(schema.institutions.id, ownInstitutionId()),
		});
		expect(own?.organizationId).toBe(orgId);

		await expect(
			api.institutions.update({
				id: ownInstitutionId(),
				data: { parentInstitutionId: f.institution.id },
			}),
		).rejects.toHaveProperty(...NOT_FOUND);

		const created = await api.institutions.create({
			code: `NEW-${randomUUID().slice(0, 4)}`,
			nameFr: "Nouvelle faculté",
			nameEn: "New faculty",
			// Administrators create faculties; other types are for super admins.
			type: "faculty",
			organizationId: f.institution.organizationId ?? undefined,
		});
		expect(created?.organizationId).toBe(orgId);
		await expect(
			api.institutions.create({
				code: `NEW-${randomUUID().slice(0, 4)}`,
				nameFr: "Injectée",
				nameEn: "Injected",
				type: "faculty",
				parentInstitutionId: f.institution.id,
			}),
		).rejects.toHaveProperty(...NOT_FOUND);
	});
});
