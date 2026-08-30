import { Building2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient, useSession } from "@/lib/auth-client";

interface Props {
	children: React.ReactNode;
}

export function OrgGuard({ children }: Props) {
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

	const activeOrgId = session?.session?.activeOrganizationId;

	useEffect(() => {
		if (!session || activeOrgId || loadingOrgs || orgs.length > 0) return;
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
		// Better-Auth will emit a session-update signal; force a page refresh
		// so the new session (with member role) is picked up cleanly.
		window.location.reload();
	}

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
					<h1 className="font-bold text-xl">Select an institution</h1>
					<p className="text-muted-foreground text-sm">
						You belong to multiple institutions. Choose one to continue.
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
			<div className="flex h-screen flex-col items-center justify-center gap-3 text-muted-foreground">
				<Building2 className="h-10 w-10 opacity-30" />
				<p className="font-medium">No institution found for your account.</p>
				<p className="text-sm">Contact your system administrator.</p>
			</div>
		);
	}

	return null;
}
