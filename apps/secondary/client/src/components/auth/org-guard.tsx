import { Building2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient, useSession } from "@/lib/auth-client";

interface Props {
	children: React.ReactNode;
}

export function OrgGuard({ children }: Props) {
	const { t } = useTranslation();
	const { data: session, isPending } = useSession();
	const [orgs, setOrgs] = useState<
		{
			id: string;
			name: string;
			slug: string;
			createdAt: Date;
			logo?: string | null | undefined;
			metadata?: any;
		}[]
	>([]);
	const [loadingOrgs, setLoadingOrgs] = useState(false);
	const [activating, setActivating] = useState(false);
	const [creating, setCreating] = useState(false);
	const [createError, setCreateError] = useState<string | null>(null);
	const [institutionName, setInstitutionName] = useState("");

	const activeOrgId = session?.session?.activeOrganizationId;
	const isSysAdmin =
		(session?.user as { role?: string } | undefined)?.role === "admin";

	useEffect(() => {
		// System admins don't belong to any institution org — skip org loading
		if (!session || activeOrgId || loadingOrgs || orgs.length > 0 || isSysAdmin)
			return;
		setLoadingOrgs(true);
		authClient.organization
			.list()
			.then(({ data }) => {
				const list = data ?? [];
				setOrgs(list);
				if (list.length === 1) {
					handleActivate(list[0].id);
				}
			})
			.finally(() => setLoadingOrgs(false));
	}, [session, activeOrgId]);

	async function handleActivate(orgId: string) {
		setActivating(true);
		await authClient.organization.setActive({ organizationId: orgId });
		window.location.reload();
	}

	async function handleCreateInstitution(e: React.FormEvent) {
		e.preventDefault();
		const name = institutionName.trim();
		if (!name) return;
		setCreating(true);
		setCreateError(null);

		const resp = await fetch("/api/setup/institution", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ name }),
		});

		if (!resp.ok) {
			const body = await resp.json().catch(() => ({}));
			setCreateError((body as any).error ?? "Error");
			setCreating(false);
			return;
		}

		const { id } = (await resp.json()) as { id: string };
		await authClient.organization.setActive({ organizationId: id });
		window.location.reload();
	}

	// System admin bypasses org requirement entirely
	if (session && isSysAdmin) return <>{children}</>;

	if (isPending || activating || (session && !activeOrgId && loadingOrgs)) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
			</div>
		);
	}

	if (activeOrgId) return <>{children}</>;

	if (orgs.length > 1) {
		return (
			<div className="flex h-screen flex-col items-center justify-center gap-6 p-6">
				<div className="flex flex-col items-center gap-2 text-center">
					<Building2 className="h-10 w-10 text-primary" />
					<h1 className="font-bold text-xl">
						{t("setup.select_institution_title")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{t("setup.select_institution_desc")}
					</p>
				</div>
				<div className="flex w-full max-w-sm flex-col gap-2">
					{orgs.map((org) => (
						<Button
							key={org.id}
							variant="ghost"
							className="h-auto justify-start gap-3 py-3"
							onClick={() => handleActivate(org.id)}
						>
							<Building2 className="h-4 w-4 shrink-0" />
							<span className="font-medium">{org.name}</span>
						</Button>
					))}
				</div>
			</div>
		);
	}

	if (!loadingOrgs && orgs.length === 0) {
		return (
			<div className="flex h-screen flex-col items-center justify-center gap-6 p-6">
				<div className="flex flex-col items-center gap-2 text-center">
					<Building2 className="h-10 w-10 text-primary" />
					<h1 className="font-bold text-xl">
						{t("setup.create_institution_title")}
					</h1>
					<p className="max-w-xs text-muted-foreground text-sm">
						{t("setup.create_institution_desc")}
					</p>
				</div>
				<form
					onSubmit={handleCreateInstitution}
					className="flex w-full max-w-sm flex-col gap-3"
				>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="inst-name">
							{t("setup.institution_name_label")}
						</Label>
						<Input
							id="inst-name"
							placeholder={t("setup.institution_name_placeholder")}
							value={institutionName}
							onChange={(e) => setInstitutionName(e.target.value)}
							disabled={creating}
							required
						/>
					</div>
					{createError && (
						<p className="text-destructive text-sm">{createError}</p>
					)}
					<Button type="submit" disabled={creating || !institutionName.trim()}>
						{creating ? t("setup.creating") : t("setup.create_button")}
					</Button>
				</form>
			</div>
		);
	}

	return null;
}
