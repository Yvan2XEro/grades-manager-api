import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { HubNav } from "@/components/navigation/HubNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpcClient } from "@/utils/trpc";
import { ProfileContext } from "./ProfileContext";

const ALL_TABS = [
	{ path: "identity", labelKey: "profileHub.tabs.identity" },
	{ path: "enrollments", labelKey: "profileHub.tabs.enrollments" },
	{ path: "results", labelKey: "profileHub.tabs.results" },
	{ path: "finances", labelKey: "profileHub.tabs.finances" },
	{ path: "guardians", labelKey: "profileHub.tabs.guardians" },
	{ path: "access", labelKey: "profileHub.tabs.access" },
] as const;

export default function ProfileHub() {
	const { profileId } = useParams<{ profileId: string }>();
	const { t } = useTranslation();

	const { data: profile, isLoading } = useQuery({
		queryKey: ["profiles", profileId],
		queryFn: () => trpcClient.profiles.get.query({ profileId: profileId! }),
		enabled: !!profileId,
	});

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!profile) {
		return (
			<div className="py-12 text-center text-muted-foreground">
				{t("common.notFound")}
			</div>
		);
	}

	const visibleTabs = ALL_TABS.filter((tab) =>
		profile.availableTabs.includes(tab.path),
	);

	const basePath = `/admin/profiles/${profileId}`;
	const isStudent = !!profile.student;
	const fullName = `${profile.firstName} ${profile.lastName}`;

	return (
		<ProfileContext.Provider
			value={{ profileId: profileId!, profile, isStudent }}
		>
			<div className="space-y-6">
				<div className="flex items-start gap-4">
					<Button variant="ghost" size="icon" asChild>
						<Link to="/admin/users/accounts">
							<ArrowLeft className="h-4 w-4" />
						</Link>
					</Button>
					<div className="flex-1">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
								<User className="h-5 w-5 text-primary" />
							</div>
							<div>
								<h1 className="font-semibold text-xl">{fullName}</h1>
								<p className="text-muted-foreground text-sm">
									{profile.primaryEmail}
								</p>
							</div>
							{isStudent && (
								<Badge variant="secondary">
									{t("profileHub.studentBadge")}
								</Badge>
							)}
						</div>
					</div>
				</div>
				<HubNav tabs={visibleTabs} basePath={basePath} />
			</div>
		</ProfileContext.Provider>
	);
}
