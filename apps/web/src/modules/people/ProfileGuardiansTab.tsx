import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { trpcClient } from "@/utils/trpc";
import { useProfileContext } from "./ProfileContext";

export default function ProfileGuardiansTab() {
	const { profileId } = useProfileContext();
	const { t } = useTranslation();

	const { data, isLoading } = useQuery({
		queryKey: ["profiles", profileId, "guardians"],
		queryFn: () => trpcClient.profiles.guardians.query({ profileId }),
	});

	if (isLoading) return <TableSkeleton columns={5} rows={3} />;

	const guardians = data ?? [];

	if (!guardians.length) {
		return (
			<div className="py-12 text-center text-muted-foreground">
				{t("profileHub.guardians.empty")}
			</div>
		);
	}

	return (
		<div className="pt-6">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>{t("profileHub.guardians.name")}</TableHead>
						<TableHead>{t("profileHub.guardians.relationship")}</TableHead>
						<TableHead>{t("profileHub.guardians.email")}</TableHead>
						<TableHead>{t("profileHub.guardians.phone")}</TableHead>
						<TableHead>{t("profileHub.guardians.flags")}</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{guardians.map((guardian) => (
						<TableRow key={guardian.id}>
							<TableCell className="font-medium">
								{guardian.firstName} {guardian.lastName}
							</TableCell>
							<TableCell>
								{t(
									`admin.guardians.relationship.${guardian.relationshipType}`,
									{ defaultValue: guardian.relationshipType },
								)}
							</TableCell>
							<TableCell>{guardian.email}</TableCell>
							<TableCell>{guardian.phone ?? "—"}</TableCell>
							<TableCell className="flex gap-1">
								{guardian.isPrimary && (
									<Badge variant="default">
										{t("profileHub.guardians.primary")}
									</Badge>
								)}
								{guardian.isEmergencyContact && (
									<Badge variant="secondary">
										{t("profileHub.guardians.emergency")}
									</Badge>
								)}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
