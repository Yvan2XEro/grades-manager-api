import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown, FileText, Loader2, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { HubLayout } from "@/components/layouts/ListLayout";
import { HubNav } from "@/components/navigation/HubNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBreadcrumbEntity } from "@/hooks/useBreadcrumbs";
import {
	GenerateDocumentDialog,
	STUDENT_DOCUMENT_KINDS,
} from "@/modules/documents/components/generate-document-dialog";
import { trpcClient } from "@/utils/trpc";
import { ProfileContext } from "../../hooks/use-profile-context";

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
	useBreadcrumbEntity(
		profileId,
		profile ? `${profile.firstName} ${profile.lastName}` : null,
	);

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

	const basePath = `/profiles/${profileId}`;
	const isStudent = !!profile.student;
	const fullName = `${profile.firstName} ${profile.lastName}`;
	// Staff (who see the access tab) issue official documents from here.
	const canIssueDocuments =
		!!profile.student && profile.availableTabs.includes("access");

	return (
		<ProfileContext.Provider
			value={{ profileId: profileId!, profile, isStudent }}
		>
			<HubLayout>
				<div className="flex items-start gap-4">
					<Button variant="ghost" size="icon" asChild>
						<Link to={isStudent ? "/students" : "/users/people"}>
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
					{canIssueDocuments && profile.student && (
						// Not modal: the menu must release the page before the
						// dialog it opens takes over (else pointer events stay off).
						<DropdownMenu modal={false}>
							<DropdownMenuTrigger asChild>
								<Button variant="outline">
									<FileText className="mr-2 h-4 w-4" />
									{t("profileHub.documents")}
									<ChevronDown className="ml-1 h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								{STUDENT_DOCUMENT_KINDS.map((kind) => (
									<DropdownMenuItem
										key={kind}
										onClick={() =>
											GenerateDocumentDialog.call({
												studentId: profile.student!.id,
												studentName: fullName,
												initialKind: kind,
											})
										}
									>
										{t(`admin.documents.kinds.${kind}.label`)}
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>
				<HubNav tabs={visibleTabs} basePath={basePath} />
			</HubLayout>
		</ProfileContext.Provider>
	);
}
