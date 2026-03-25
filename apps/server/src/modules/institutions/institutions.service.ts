import { TRPCError } from "@trpc/server";
import type { NewInstitution } from "@/db/schema/app-schema";
import * as academicYearsRepo from "../academic-years/academic-years.repo";
import * as registrationNumbersRepo from "../registration-numbers/registration-numbers.repo";
import * as repo from "./institutions.repo";

type UpdatableFields = Omit<NewInstitution, "id" | "createdAt" | "updatedAt">;
type PersistedInstitutionFields = Omit<
	UpdatableFields,
	"defaultAcademicYearId" | "registrationFormatId"
>;

type InstitutionRecord = Awaited<ReturnType<typeof repo.getById>>;

function toPersistedInstitutionFields(
	data: Partial<UpdatableFields>,
): Partial<PersistedInstitutionFields> {
	const {
		defaultAcademicYearId: _defaultAcademicYearId,
		registrationFormatId: _registrationFormatId,
		...fields
	} = data;
	return fields;
}

async function attachDerivedSettings<T extends InstitutionRecord>(
	institution: T,
) {
	if (!institution) return null;
	const [activeAcademicYear, activeRegistrationFormat] = await Promise.all([
		academicYearsRepo.findActive(institution.id),
		registrationNumbersRepo.findActive(institution.id),
	]);
	return {
		...institution,
		defaultAcademicYearId: activeAcademicYear?.id ?? null,
		registrationFormatId: activeRegistrationFormat?.id ?? null,
	};
}

export async function getInstitution() {
	const existing = await repo.getFirst();
	return attachDerivedSettings(existing);
}

export async function getInstitutionById(id: string) {
	const institution = await repo.getById(id);
	if (!institution) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Institution not found",
		});
	}
	return attachDerivedSettings(institution);
}

export async function listInstitutions() {
	const institutions = await repo.list();
	return Promise.all(
		institutions.map((institution) => attachDerivedSettings(institution)),
	);
}

export async function upsertInstitution(
	data: UpdatableFields & { id?: string },
) {
	const { id, ...fields } = data;
	const payload = {
		...toPersistedInstitutionFields(fields),
		isMain: true,
	};
	if (id) {
		const updated = await repo.update(id, payload);
		return attachDerivedSettings(updated);
	}
	const existing = await repo.getFirst();
	if (existing) {
		const updated = await repo.update(existing.id, payload);
		return attachDerivedSettings(updated);
	}
	const created = await repo.create(payload);
	return attachDerivedSettings(created);
}

export async function createInstitution(data: UpdatableFields) {
	const created = await repo.create(
		toPersistedInstitutionFields(data) as PersistedInstitutionFields,
	);
	return attachDerivedSettings(created);
}

export async function updateInstitution(
	id: string,
	data: Partial<UpdatableFields>,
) {
	const existing = await repo.getById(id);
	if (!existing) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Institution not found",
		});
	}
	const updated = await repo.update(id, toPersistedInstitutionFields(data));
	return attachDerivedSettings(updated);
}

export async function deleteInstitution(id: string) {
	const existing = await repo.getById(id);
	if (!existing) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Institution not found",
		});
	}
	return repo.deleteById(id);
}
