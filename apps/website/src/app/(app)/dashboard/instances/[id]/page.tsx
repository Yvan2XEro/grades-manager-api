import configPromise from "@payload-config";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import { InstanceDetailClient } from "@/dashboard/InstanceDetailClient";
import { getDict, getLocale } from "@/i18n";
import { getMeUser } from "@/utilities/getMeUser";

export default async function InstanceDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const { user } = await getMeUser({ nullUserRedirect: "/login" });
	const locale = await getLocale();
	const dict = getDict(locale);

	const payload = await getPayload({ config: configPromise });

	let record: Record<string, unknown>;
	try {
		record = (await payload.findByID({
			collection: "instance-requests",
			id,
		})) as unknown as Record<string, unknown>;
	} catch {
		notFound();
	}

	const clientField = record.client as
		| { id?: string }
		| string
		| null
		| undefined;
	const clientId =
		typeof clientField === "object" ? clientField?.id : clientField;
	if (clientId && clientId !== String(user.id)) notFound();

	const { docs: rawEvents } = await payload.find({
		collection: "instance-events",
		where: { instance: { equals: id } },
		sort: "-createdAt",
		limit: 50,
	});

	const events = rawEvents.map((e) => ({
		id: String(e.id),
		eventType: e.eventType as string,
		actorEmail: e.actorEmail as string | undefined,
		createdAt: e.createdAt as string,
	}));

	return (
		<InstanceDetailClient
			instance={{
				id: String(record.id),
				orgName: (record.orgName as string) ?? null,
				subdomain: (record.subdomain as string) ?? null,
				institutionType: (record.institutionType as string) ?? null,
				country: (record.country as string) ?? null,
				status: (record.status as string) ?? "pending",
				progressStep: (record.progressStep as number) ?? null,
				instanceUrl: (record.instanceUrl as string) ?? null,
				errorMessage: (record.errorMessage as string) ?? null,
				adminName: (record.adminName as string) ?? null,
				adminEmail: (record.adminEmail as string) ?? null,
				createdAt: (record.createdAt as string) ?? null,
				seedMode: (record.seedMode as string) ?? "empty",
				seedFoundationYaml: (record.seedFoundationYaml as string) ?? null,
				seedAcademicsYaml: (record.seedAcademicsYaml as string) ?? null,
				seedUsersYaml: (record.seedUsersYaml as string) ?? null,
				dokployAppId: (record.dokployAppId as string) ?? null,
				dokployPostgresId: (record.dokployPostgresId as string) ?? null,
				dokployProjectId: (record.dokployProjectId as string) ?? null,
				imageTag: (record.imageTag as string) ?? null,
			}}
			events={events}
			dict={dict}
		/>
	);
}

export const metadata: Metadata = { title: "Instance — TKAMS" };
