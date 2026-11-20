import { describe, expect, it, setDefaultTimeout } from "bun:test";

setDefaultTimeout(180_000);

import {
	createAcademicYear,
	createClass,
	createCycleLevel,
	createProgram,
	createStudent,
	createStudyCycle,
} from "@/lib/test-utils";
import {
	adminContext,
	caller,
	curriculum,
	gradeCourse,
} from "../../academic-year-transitions/__tests__/journey-helpers";

/*
 * A diploma certifies a whole cycle: only a favourable closed jury of the
 * last level of the cycle earns it, and a student who completed several
 * cycles chooses which diploma to issue.
 */

type Api = ReturnType<typeof caller>;

async function cycleWithProgram(
	institutionId: string,
	name: string,
	nameEn: string,
	levels: string[],
) {
	const tag = crypto.randomUUID().slice(0, 4);
	const cycle = await createStudyCycle({
		institutionId,
		code: `${name.slice(0, 3).toUpperCase()}-${tag}`,
		name,
		nameEn,
	});
	const ls = [];
	for (const [i, levelName] of levels.entries()) {
		ls.push(
			await createCycleLevel({
				cycleId: cycle.id,
				orderIndex: i + 1,
				code: `${levelName.slice(0, 1)}${i + 1}`,
				name: levelName,
			}),
		);
	}
	const program = await createProgram({
		institutionId,
		cycleId: cycle.id,
		name: `${name} Informatique ${tag}`,
	});
	return { cycle, levels: ls, program };
}

async function signedJury(
	api: Api,
	classId: string,
	academicYearId: string,
	deliberationDate?: string,
) {
	const jury = await api.deliberations.create({
		classId,
		academicYearId,
		type: "annual",
		...(deliberationDate ? { deliberationDate } : {}),
	});
	await api.deliberations.transition({ id: jury.id, action: "open" });
	await api.deliberations.compute({ id: jury.id });
	await api.deliberations.transition({ id: jury.id, action: "close" });
	await api.deliberations.transition({ id: jury.id, action: "sign" });
	return jury;
}

async function errorOf(promise: Promise<unknown>) {
	try {
		await promise;
	} catch (err) {
		return err as { code?: string; message: string };
	}
	throw new Error("expected an error");
}

describe("diplomas per cycle", () => {
	it("issues a diploma only for the last level of a cycle and lets the registrar choose", async () => {
		const admin = await adminContext();
		const api = caller(admin);
		const institutionId = admin.institution.id;
		const licence = await cycleWithProgram(
			institutionId,
			"Licence",
			"Bachelor",
			["Licence 1", "Licence 2", "Licence 3"],
		);
		const master = await cycleWithProgram(
			institutionId,
			"Master",
			"Master's degree",
			["Master 1", "Master 2"],
		);
		const start = 2300 + Math.floor(Math.random() * 600);
		const year = (i: number) =>
			createAcademicYear({
				institutionId,
				name: `${start + i}-${start + i + 1}-dip`,
				startDate: `${start + i}-09-01`,
				endDate: `${start + i + 1}-06-30`,
			});
		const yearA = await year(0);
		const yearB = await year(1);
		const yearC = await year(2);

		// Year A: Licence 1, admitted.
		const l1 = await createClass({
			program: licence.program.id,
			academicYear: yearA.id,
			cycleLevelId: licence.levels[0].id,
		});
		const student = await createStudent({ class: l1.id });
		const [ueA, ueB] = await curriculum(licence.program.id, l1.id);
		for (const ue of [ueA, ueB]) {
			await gradeCourse(ue.id, institutionId, [
				{ studentId: student.id, cc: 15, ex: 15 },
			]);
		}
		const juryL1 = await signedJury(api, l1.id, yearA.id);

		// An admitted L1 student gets a pass certificate, no Licence diploma.
		const afterL1 = await api.academicDocuments.studentOptions({
			studentId: student.id,
		});
		expect(afterL1.attestation.eligible).toBe(true);
		expect(afterL1.attestation.results).toHaveLength(1);
		expect(afterL1.diploma.eligible).toBe(false);
		expect(afterL1.diploma.reason).toBe("not_final_level");
		expect(afterL1.diploma.earned).toHaveLength(0);
		const refused = await errorOf(
			api.academicDocuments.generate({
				kind: "diploma",
				studentId: student.id,
				format: "html",
				deliberationId: juryL1.id,
			}),
		);
		expect(refused.code).toBe("PRECONDITION_FAILED");
		expect(refused.message).toBe("DOCUMENT_NOT_ELIGIBLE:not_final_level");

		// The L1 pass certificate keeps the level wording.
		const l1Attestation = await api.academicDocuments.generate({
			kind: "attestation",
			studentId: student.id,
			format: "html",
			deliberationId: juryL1.id,
		});
		expect(l1Attestation.data).toContain("ATTESTATION DE REUSSITE — Licence 1");

		// Year B: Licence 3, admitted (jury of 10 July).
		const l3 = await createClass({
			program: licence.program.id,
			academicYear: yearB.id,
			cycleLevelId: licence.levels[2].id,
		});
		await api.students.update({ id: student.id, classId: l3.id });
		const [ueC, ueD] = await curriculum(licence.program.id, l3.id);
		for (const ue of [ueC, ueD]) {
			await gradeCourse(ue.id, institutionId, [
				{ studentId: student.id, cc: 15, ex: 15 },
			]);
		}
		const juryL3 = await signedJury(
			api,
			l3.id,
			yearB.id,
			new Date(Date.UTC(start + 2, 6, 10, 12)).toISOString(),
		);

		// Year C: Master 2, admitted.
		const m2 = await createClass({
			program: master.program.id,
			academicYear: yearC.id,
			cycleLevelId: master.levels[1].id,
		});
		await api.students.update({ id: student.id, classId: m2.id });
		const [ueE] = await curriculum(master.program.id, m2.id, [30]);
		await gradeCourse(ueE.id, institutionId, [
			{ studentId: student.id, cc: 13, ex: 13 },
		]);
		const juryM2 = await signedJury(api, m2.id, yearC.id);

		// Two diplomas earned, latest first; three years of pass certificates.
		const options = await api.academicDocuments.studentOptions({
			studentId: student.id,
		});
		expect(options.diploma.eligible).toBe(true);
		expect(options.diploma.earned.map((d) => d.deliberationId)).toEqual([
			juryM2.id,
			juryL3.id,
		]);
		expect(options.diploma.earned[1]).toMatchObject({
			cycleName: "Licence",
			programName: licence.program.name,
			classId: l3.id,
			academicYearId: yearB.id,
		});
		expect(options.attestation.results).toHaveLength(3);

		// Without a choice, the latest diploma (Master) is issued.
		const latest = await api.academicDocuments.generate({
			kind: "diploma",
			studentId: student.id,
			format: "html",
		});
		expect(latest.data).toContain(master.program.name.toUpperCase());

		// The Licence diploma, chosen explicitly.
		const licenceDiploma = await api.academicDocuments.generate({
			kind: "diploma",
			studentId: student.id,
			format: "html",
			deliberationId: juryL3.id,
		});
		const html = licenceDiploma.data;
		expect(html).toContain(licence.program.name.toUpperCase());
		expect(html).not.toContain(master.program.name.toUpperCase());
		// The auto-created option is not printed.
		expect(html).not.toContain("Default option");
		// The mention in French and in English (15/20 → Bien / Good).
		expect(html).toContain("Bien");
		expect(html).toContain("<em>Good</em>");
		// The jury session is the jury's date, not today.
		const juryDate = new Date(
			Date.UTC(start + 2, 6, 10, 12),
		).toLocaleDateString("fr-FR");
		expect(html).toContain(
			`session du <strong class="jury-date-value">${juryDate}`,
		);
		expect(html).not.toContain(
			`session du <strong class="jury-date-value">${new Date().toLocaleDateString("fr-FR")}`,
		);

		// The final-level pass certificate attests the degree, not "Licence 3".
		const l3Attestation = await api.academicDocuments.generate({
			kind: "attestation",
			studentId: student.id,
			format: "html",
			deliberationId: juryL3.id,
		});
		expect(l3Attestation.data).toContain("ATTESTATION DE REUSSITE — Licence<");
		expect(l3Attestation.data).toContain(
			"CERTIFICATE OF COMPLETION — Bachelor<",
		);
		expect(l3Attestation.data).not.toContain("Licence 3");
	});
});
