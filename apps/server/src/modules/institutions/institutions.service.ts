import type { Institution, NewInstitution } from "@/db/schema/app-schema";
import { conflict, notFound } from "../_shared/errors";
import * as academicYearsRepo from "../academic-years/academic-years.repo";
import * as registrationNumbersRepo from "../registration-numbers/registration-numbers.repo";
import * as repo from "./institutions.repo";

/*
 * Institutions are scoped to the caller's organization: an organization may
 * hold a university and its faculties (linked by `parentInstitutionId`), and
 * its admins manage that set. Institutions of other organizations read as
 * missing. The organization link itself is never writable from here — it is
 * what routes requests to a tenant, so changing it would hand an institution
 * (or a foothold) to another tenant.
 */

type UpdatableFields = Omit<NewInstitution, "id" | "createdAt" | "updatedAt">;
type WritableFields = Omit<UpdatableFields, "organizationId">;

type InstitutionRecord = Awaited<ReturnType<typeof repo.getById>>;

type TenantScope = Pick<Institution, "id" | "organizationId">;

async function attachDerivedSettings(institution: InstitutionRecord) {
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

function isVisible(
	institution: NonNullable<InstitutionRecord>,
	scope: TenantScope,
) {
	if (institution.id === scope.id) return true;
	return (
		scope.organizationId !== null &&
		institution.organizationId === scope.organizationId
	);
}

async function requireVisible(id: string, scope: TenantScope) {
	const institution = await repo.getById(id);
	if (!institution || !isVisible(institution, scope)) {
		throw notFound("Institution not found");
	}
	return institution;
}

/** Drops the organization link and checks the parent stays in scope. */
async function sanitizeWrite(
	data: Partial<UpdatableFields>,
	scope: TenantScope,
	selfId?: string,
): Promise<Partial<WritableFields>> {
	const { organizationId: _ignored, ...fields } = data;
	if (fields.parentInstitutionId) {
		if (fields.parentInstitutionId === selfId) {
			throw conflict("An institution cannot be its own parent");
		}
		await requireVisible(fields.parentInstitutionId, scope);
	}
	return fields;
}

/** The institution of the caller's organization (the request's tenant). */
export async function getInstitution(scope: TenantScope) {
	return attachDerivedSettings(await repo.getById(scope.id));
}

export async function getInstitutionById(id: string, scope: TenantScope) {
	return attachDerivedSettings(await requireVisible(id, scope));
}

export async function listInstitutions(scope: TenantScope) {
	const institutions = scope.organizationId
		? await repo.listByOrganization(scope.organizationId)
		: [await repo.getById(scope.id)].filter((i) => i !== null);
	return Promise.all(
		institutions.map((institution) => attachDerivedSettings(institution)),
	);
}

/**
 * Saves the settings page: updates the given institution (default: the
 * caller's own). It never creates one any more — the tenant institution
 * always exists once the request is resolved.
 */
export async function upsertInstitution(
	data: UpdatableFields & { id?: string },
	scope: TenantScope,
) {
	const { id, ...fields } = data;
	const target = await requireVisible(id ?? scope.id, scope);
	const payload = await sanitizeWrite(fields, scope, target.id);
	return attachDerivedSettings(await repo.update(target.id, payload));
}

export async function createInstitution(
	data: UpdatableFields,
	scope: TenantScope,
) {
	const fields = await sanitizeWrite(data, scope);
	const created = await repo.create({
		...(fields as WritableFields),
		organizationId: scope.organizationId,
	});
	return attachDerivedSettings(created);
}

export async function updateInstitution(
	id: string,
	data: Partial<UpdatableFields>,
	scope: TenantScope,
) {
	await requireVisible(id, scope);
	const payload = await sanitizeWrite(data, scope, id);
	return attachDerivedSettings(await repo.update(id, payload));
}

export async function deleteInstitution(id: string, scope: TenantScope) {
	await requireVisible(id, scope);
	if (id === scope.id) {
		throw conflict("The institution you are working in cannot be deleted");
	}
	return repo.deleteById(id);
}
