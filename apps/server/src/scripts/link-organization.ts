import "dotenv/config";
import { randomUUID } from "node:crypto";
import { and, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import { db } from "../db";
import * as appSchema from "../db/schema/app-schema";
import * as authSchema from "../db/schema/auth";

/**
 * Script to link the seeded institution to a Better Auth organization.
 * Run this after seeding to enable the multi-tenant context.
 */
async function linkOrganization() {
	console.log("[link-org] Starting organization linkage...");

	// Step 1: Create a Better Auth organization
	const orgSlug = "sgn-institution";
	let org = await db.query.organization.findFirst({
		where: eq(authSchema.organization.slug, orgSlug),
	});

	if (!org) {
		[org] = await db
			.insert(authSchema.organization)
			.values({
				id: randomUUID(),
				name: "SGN Institution",
				slug: orgSlug,
				createdAt: new Date(),
			})
			.returning();
		console.log(`[link-org] ✓ Created organization: ${org.name} (${org.slug})`);
	} else {
		console.log(
			`[link-org] ✓ Organization already exists: ${org.name} (${org.slug})`,
		);
	}

	// Step 2: Link institutions to the organization
	const institutions = await db.query.institutions.findMany({
		where: isNull(appSchema.institutions.organizationId),
	});

	if (institutions.length > 0) {
		for (const inst of institutions) {
			await db
				.update(appSchema.institutions)
				.set({ organizationId: org.id })
				.where(eq(appSchema.institutions.id, inst.id));
		}
		console.log(
			`[link-org] ✓ Linked ${institutions.length} institution(s) to organization`,
		);
	} else {
		console.log(
			"[link-org] ✓ All institutions already linked to organizations",
		);
	}

	// Step 3: Create members for existing domain users (staff only, not students)
	const domainUsers = await db.query.domainUsers.findMany({
		where: and(
			isNotNull(appSchema.domainUsers.authUserId),
			inArray(appSchema.domainUsers.businessRole, [
				"super_admin",
				"administrator",
				"dean",
				"teacher",
				"staff",
			]),
			isNull(appSchema.domainUsers.memberId),
		),
	});

	let membersCreated = 0;
	for (const du of domainUsers) {
		if (!du.authUserId) continue;

		// Check if member already exists
		const existingMember = await db.query.member.findFirst({
			where: eq(authSchema.member.userId, du.authUserId),
		});

		if (existingMember) {
			// Link to existing member
			await db
				.update(appSchema.domainUsers)
				.set({ memberId: existingMember.id })
				.where(eq(appSchema.domainUsers.id, du.id));
			continue;
		}

		// Create new member
		const memberRole = du.businessRole;
		const [member] = await db
			.insert(authSchema.member)
			.values({
				id: randomUUID(),
				organizationId: org.id,
				userId: du.authUserId,
				role: memberRole,
				createdAt: new Date(),
			})
			.returning();

		// Link domain user to member
		await db
			.update(appSchema.domainUsers)
			.set({ memberId: member.id })
			.where(eq(appSchema.domainUsers.id, du.id));

		membersCreated++;
	}

	console.log(`[link-org] ✓ Created ${membersCreated} new member(s)`);

	// Verification
	const orgs = await db.select().from(authSchema.organization);
	const institutionsWithOrg = await db
		.select()
		.from(appSchema.institutions)
		.where(isNotNull(appSchema.institutions.organizationId));
	const members = await db.select().from(authSchema.member);
	const linkedDomainUsers = await db
		.select()
		.from(appSchema.domainUsers)
		.where(isNotNull(appSchema.domainUsers.memberId));

	console.log("\n[link-org] Verification:");
	console.log(`  - Organizations: ${orgs.length}`);
	console.log(`  - Institutions with org: ${institutionsWithOrg.length}`);
	console.log(`  - Members: ${members.length}`);
	console.log(`  - Domain users linked: ${linkedDomainUsers.length}`);
	console.log("\n[link-org] ✓ Organization linkage completed!");
}

linkOrganization()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error("[link-org] Failed:", error);
		process.exit(1);
	});
