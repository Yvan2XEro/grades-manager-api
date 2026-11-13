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
	withdrawn: "outline",
	transferred: "outline",
	excluded: "destructive",
};

export default function ProfileEnrollmentsTab() {
	const { profileId } = useProfileContext();
	const { t } = useTranslation();

	const { data, isLoading } = useQuery({
		queryKey: ["profiles", profileId, "enrollments"],
		queryFn: () => trpcClient.profiles.enrollments.query({ profileId }),
	});

	if (isLoading) return <TableSkeleton columns={4} rows={4} />;

	const enrollments = data ?? [];

	if (!enrollments.length) {
		return (
			<div className="py-12 text-center text-muted-foreground">
				{t("profileHub.enrollments.empty")}
			</div>
		);
	}

	return (
		<div className="pt-6">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>{t("profileHub.enrollments.academicYear")}</TableHead>
						<TableHead>{t("profileHub.enrollments.class")}</TableHead>
						<TableHead>{t("profileHub.enrollments.enrolledAt")}</TableHead>
						<TableHead>{t("profileHub.enrollments.status")}</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{enrollments.map((enrollment) => (
						<TableRow key={enrollment.id}>
							<TableCell className="font-medium">
								{enrollment.academicYearName}
							</TableCell>
							<TableCell>{enrollment.className}</TableCell>
							<TableCell>
								{enrollment.enrolledAt
									? new Date(enrollment.enrolledAt).toLocaleDateString()
									: "—"}
							</TableCell>
							<TableCell>
								<Badge
									variant={statusVariants[enrollment.status] ?? "secondary"}
								>
									{t(`admin.enrollment.status.${enrollment.status}`, {
										defaultValue: enrollment.status,
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
