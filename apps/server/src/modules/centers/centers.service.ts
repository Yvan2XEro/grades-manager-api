import type * as schema from "@/db/schema/app-schema";
import { normalizeCode } from "@/lib/strings";
import { notFound } from "@/modules/_shared/errors";
import * as repo from "./centers.repo";
import type {
	AdministrativeInstanceInput,
	CenterBaseInput,
	LegalTextInput,
} from "./centers.zod";

function toCenterRow(
	data: Partial<CenterBaseInput>,
): Partial<schema.NewCenter> {
	const { administrativeInstances, legalTexts, ...rest } = data;
	const result: Partial<schema.NewCenter> = { ...rest };
	if (rest.code !== undefined && rest.code !== null) {
		result.code = normalizeCode(rest.code);
	}
	if (rest.contactEmail !== undefined) {
		result.contactEmail = rest.contactEmail || null;
	}
	return result;
}

function toAdminInstanceRow(
	input: AdministrativeInstanceInput,
	index: number,
): Omit<schema.NewCenterAdministrativeInstance, "centerId" | "id"> {
	return {
		orderIndex: input.orderIndex ?? index,
		nameFr: input.nameFr,
		nameEn: input.nameEn,
		acronymFr: input.acronymFr ?? null,
		acronymEn: input.acronymEn ?? null,
		logoUrl: input.logoUrl ?? null,
		showOnTranscripts: input.showOnTranscripts ?? true,
		showOnCertificates: input.showOnCertificates ?? true,
	};
}

function toLegalTextRow(
	input: LegalTextInput,
	index: number,
): Omit<schema.NewCenterLegalText, "centerId" | "id"> {
	return {
		orderIndex: input.orderIndex ?? index,
		textFr: input.textFr,
		textEn: input.textEn,
	};
}

export async function createCenter(
	data: CenterBaseInput,
	institutionId: string,
) {
	const row = toCenterRow(data);
	const center = await repo.create({
		...row,
		code: normalizeCode(data.code),
		name: data.name,
		institutionId,
	} as schema.NewCenter);

	if (data.administrativeInstances?.length) {
		await repo.replaceAdministrativeInstances(
			center.id,
			data.administrativeInstances.map(toAdminInstanceRow),
		);
	}
	if (data.legalTexts?.length) {
		await repo.replaceLegalTexts(
			center.id,
			data.legalTexts.map(toLegalTextRow),
		);
	}
	return getCenterById(center.id, institutionId);
}

export async function updateCenter(
	id: string,
	institutionId: string,
	data: Partial<CenterBaseInput>,
) {
	const existing = await repo.findById(id, institutionId);
	if (!existing) throw notFound("Center not found");
	const row = toCenterRow(data);
	const updated = await repo.update(id, institutionId, row);
	if (data.administrativeInstances !== undefined) {
		await repo.replaceAdministrativeInstances(
			id,
			data.administrativeInstances.map(toAdminInstanceRow),
		);
	}
	if (data.legalTexts !== undefined) {
		await repo.replaceLegalTexts(id, data.legalTexts.map(toLegalTextRow));
	}
	return getCenterById(updated.id, institutionId);
}

export async function deleteCenter(id: string, institutionId: string) {
	const existing = await repo.findById(id, institutionId);
	if (!existing) throw notFound("Center not found");
	await repo.remove(id, institutionId);
}

export async function listCenters(
	opts: Parameters<typeof repo.list>[1],
	institutionId: string,
) {
	return repo.list(institutionId, opts);
}

export async function getCenterById(id: string, institutionId: string) {
	const center = await repo.findById(id, institutionId);
	if (!center) throw notFound("Center not found");
	const [administrativeInstances, legalTexts] = await Promise.all([
		repo.listAdministrativeInstances(id),
		repo.listLegalTexts(id),
	]);
	return { ...center, administrativeInstances, legalTexts };
}
