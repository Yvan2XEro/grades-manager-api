import { generateId } from "better-auth";
import { invitation } from "../../db/auth";
import { db } from "../../db/index";
import { conflict, notFound } from "../../lib/errors";
import * as repo from "./staff.repo";

const ROLE_TO_ORG_ROLE: Record<string, string> = {
	teacher: "teacher",
	admin: "admin",
	principal: "principal",
	vice_principal: "teacher",
	staff: "teacher",
};

async function createInvitation(opts: {
	email: string;
	role: string;
	organizationId: string;
	inviterId: string;
}): Promise<string> {
	const id = generateId();
	const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h
	await db.insert(invitation).values({
		id,
		organizationId: opts.organizationId,
		email: opts.email,
		role: ROLE_TO_ORG_ROLE[opts.role] ?? "teacher",
		status: "pending",
		expiresAt,
		inviterId: opts.inviterId,
	});
	return id;
}

function buildInviteUrl(
	origin: string,
	invitationId: string,
	email: string,
): string {
	const base =
		origin ||
		process.env.CORS_ORIGINS?.split(",")[0]?.trim() ||
		"http://localhost:5173";
	// HashRouter: frontend routes are prefixed with /#/
	return `${base}/#/accept-invitation/${invitationId}?email=${encodeURIComponent(email)}`;
}

export async function list(
	institutionId: string,
	opts: {
		search?: string;
		role?: string;
		orderBy?: string;
		orderDir?: string;
		page?: number;
		pageSize?: number;
	} = {},
) {
	const { items, total } = await repo.findAll(institutionId, opts);
	return { items, total, page: opts.page ?? 1, pageSize: opts.pageSize ?? 25 };
}

export async function create(
	data: {
		firstName: string;
		lastName: string;
		email: string;
		phone?: string;
		role?: string;
	},
	institutionId: string,
	orgId: string,
	inviterId: string,
	origin: string,
) {
	const existing = await repo.findByEmail(data.email, institutionId);
	if (existing) throw conflict(`Staff email "${data.email}" already exists`);

	const staffRow = await repo.insert({
		institutionId,
		firstName: data.firstName,
		lastName: data.lastName,
		email: data.email,
		phone: data.phone,
		role: data.role ?? "teacher",
	});

	let inviteUrl: string | null = null;
	try {
		const invId = await createInvitation({
			email: data.email,
			role: data.role ?? "teacher",
			organizationId: orgId,
			inviterId,
		});
		await repo.updateInvitationId(staffRow.id, institutionId, invId);
		inviteUrl = buildInviteUrl(origin, invId, data.email);
		return { ...staffRow, invitationId: invId, inviteUrl };
	} catch {
		// Invitation creation failed (e.g. email already invited) — staff is created, no link
		return { ...staffRow, invitationId: null, inviteUrl: null };
	}
}

export async function get(id: string, institutionId: string) {
	const member = await repo.findById(id, institutionId);
	if (!member) throw notFound("Staff member not found");
	return member;
}

export async function updateStaff(
	id: string,
	institutionId: string,
	data: {
		firstName?: string;
		lastName?: string;
		email?: string;
		phone?: string;
		role?: string;
	},
) {
	const existing = await repo.findById(id, institutionId);
	if (!existing) throw notFound("Staff member not found");
	if (data.email && data.email !== existing.email) {
		const duplicate = await repo.findByEmail(data.email, institutionId);
		if (duplicate) throw conflict(`Email "${data.email}" already taken`);
	}
	const updated = await repo.update(id, institutionId, data);
	return updated!;
}

export async function resendInvite(
	id: string,
	institutionId: string,
	orgId: string,
	inviterId: string,
	origin: string,
) {
	const staffRow = await repo.findById(id, institutionId);
	if (!staffRow) throw notFound("Staff member not found");
	if (staffRow.authUserId) {
		throw conflict("Staff member already has an active account");
	}

	const invId = await createInvitation({
		email: staffRow.email,
		role: staffRow.role ?? "teacher",
		organizationId: orgId,
		inviterId,
	});
	await repo.updateInvitationId(id, institutionId, invId);
	const inviteUrl = buildInviteUrl(origin, invId, staffRow.email);
	return { invitationId: invId, inviteUrl };
}

export async function count(institutionId: string) {
	return repo.countAll(institutionId);
}

export async function bulkCreate(
	rows: {
		firstName: string;
		lastName: string;
		email: string;
		phone?: string;
		role?: string;
	}[],
	institutionId: string,
) {
	const values = rows.map((r) => ({
		institutionId,
		firstName: r.firstName,
		lastName: r.lastName,
		email: r.email,
		phone: r.phone,
		role: r.role ?? "teacher",
	}));
	return repo.bulkInsert(values);
}
