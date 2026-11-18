import { auth } from "../../lib/auth";
import { conflict, notFound } from "../../lib/errors";
import * as repo from "./staff.repo";

const ROLE_TO_ORG_ROLE: Record<string, string> = {
	teacher: "teacher",
	admin: "admin",
	principal: "principal",
	vice_principal: "teacher",
	staff: "teacher",
};

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
	headers: Headers,
) {
	const existing = await repo.findByEmail(data.email, institutionId);
	if (existing) throw conflict("STAFF_EMAIL_EXISTS");

	const staffRow = await repo.insert({
		institutionId,
		firstName: data.firstName,
		lastName: data.lastName,
		email: data.email,
		phone: data.phone,
		role: data.role ?? "teacher",
	});

	try {
		const inv = await auth.api.createInvitation({
			body: {
				email: data.email,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				role: (ROLE_TO_ORG_ROLE[data.role ?? "teacher"] ?? "teacher") as any,
				organizationId: orgId,
			},
			headers,
		});
		const invId = (inv as { id: string }).id;
		await repo.updateInvitationId(staffRow.id, institutionId, invId);
		return { ...staffRow, invitationId: invId };
	} catch (err) {
		console.error("[staff] invitation failed", err);
		return { ...staffRow, invitationId: null };
	}
}

export async function get(id: string, institutionId: string) {
	const member = await repo.findById(id, institutionId);
	if (!member) throw notFound("STAFF_NOT_FOUND");
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
	if (!existing) throw notFound("STAFF_NOT_FOUND");
	if (data.email && data.email !== existing.email) {
		const duplicate = await repo.findByEmail(data.email, institutionId);
		if (duplicate) throw conflict("STAFF_EMAIL_EXISTS");
	}
	const updated = await repo.update(id, institutionId, data);
	return updated!;
}

export async function resendInvite(
	id: string,
	institutionId: string,
	orgId: string,
	headers: Headers,
) {
	const staffRow = await repo.findById(id, institutionId);
	if (!staffRow) throw notFound("STAFF_NOT_FOUND");
	if (staffRow.authUserId) {
		throw conflict("STAFF_ACCOUNT_EXISTS");
	}

	const inv = await auth.api.createInvitation({
		body: {
			email: staffRow.email,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			role: (ROLE_TO_ORG_ROLE[staffRow.role ?? "teacher"] ?? "teacher") as any,
			organizationId: orgId,
			resend: true,
		},
		headers,
	});
	const invId = (inv as { id: string }).id;
	await repo.updateInvitationId(id, institutionId, invId);

	return { invitationId: invId };
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
