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

const statusVariants: Record<
	string,
	"default" | "secondary" | "destructive" | "outline"
> = {
	active: "default",
	completed: "secondary",
	failed: "destructive",
	withdrawn: "outline",
};

export default function ProfileResultsTab() {
	const { profileId } = useProfileContext();
	const { t } = useTranslation();

	const { data, isLoading } = useQuery({
		queryKey: ["profiles", profileId, "results"],
		queryFn: () => trpcClient.profiles.results.query({ profileId }),
	});

	if (isLoading) return <TableSkeleton columns={5} rows={5} />;

	const results = data ?? [];

	if (!results.length) {
		return (
			<div className="py-12 text-center text-muted-foreground">
				{t("profileHub.results.empty")}
			</div>
		);
	}

	return (
		<div className="pt-6">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>{t("profileHub.results.course")}</TableHead>
						<TableHead>{t("profileHub.results.teachingUnit")}</TableHead>
						<TableHead>{t("profileHub.results.academicYear")}</TableHead>
						<TableHead className="text-right">
							{t("profileHub.results.credits")}
						</TableHead>
						<TableHead>{t("profileHub.results.status")}</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{results.map((result) => (
						<TableRow key={result.id}>
							<TableCell className="font-medium">
								{result.course?.nameFr ?? result.course?.nameEn ?? "—"}
							</TableCell>
							<TableCell className="text-muted-foreground text-sm">
								{result.course?.teachingUnit?.nameFr ??
									result.course?.teachingUnit?.nameEn ??
									"—"}
							</TableCell>
							<TableCell>{result.academicYear?.name ?? "—"}</TableCell>
							<TableCell className="text-right">
								{result.creditsEarned ?? 0} / {result.creditsAttempted ?? 0}
							</TableCell>
							<TableCell>
								<Badge variant={statusVariants[result.status] ?? "secondary"}>
									{t(`admin.courseEnrollment.status.${result.status}`, {
										defaultValue: result.status,
									})}
								</Badge>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
