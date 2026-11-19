import { useQuery } from "@tanstack/react-query";
import { ExternalLink, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { trpcClient } from "@/utils/trpc";
import { EnrollStudentDialog } from "../../components/enroll-student-dialog";
import { useClassContext } from "../../hooks/use-class-context";

export default function ClassDetailStudents() {
	const { t } = useTranslation();
	const { cls } = useClassContext();

	const { data, isLoading } = useQuery({
		queryKey: ["students", "byClass", cls.id],
		queryFn: () =>
			trpcClient.students.list.query({ classId: cls.id, limit: 200 }),
	});
	const students = [...(data?.items ?? [])].sort(
		(a, b) =>
			(a.profile?.lastName ?? "").localeCompare(b.profile?.lastName ?? "") ||
			(a.profile?.firstName ?? "").localeCompare(b.profile?.firstName ?? ""),
	);

	return (
		<Card className="flex min-h-64 flex-1 flex-col">
			<CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
				<CardTitle>
					{t("classes.hub.tabs.students")}
					{students.length > 0 && (
						<span className="ml-2 font-normal text-muted-foreground text-sm">
							({students.length})
						</span>
					)}
				</CardTitle>
				<Button
					size="sm"
					onClick={() =>
						EnrollStudentDialog.call({
							classId: cls.id,
							academicYearId: cls.academicYear,
						})
					}
				>
					<UserPlus className="mr-2 h-4 w-4" />
					{t("admin.students.enroll.title")}
				</Button>
			</CardHeader>
			<CardContent className="flex min-h-0 flex-1 flex-col">
				{isLoading ? null : students.length === 0 ? (
					<Empty>
						<EmptyHeader>
							<EmptyContent>
								<EmptyTitle>
									{t("admin.classes.studentsEmpty.title")}
								</EmptyTitle>
								<EmptyDescription>
									{t("admin.classes.studentsEmpty.description")}
								</EmptyDescription>
							</EmptyContent>
						</EmptyHeader>
					</Empty>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{t("admin.students.table.lastName")}</TableHead>
								<TableHead>{t("admin.students.table.firstName")}</TableHead>
								<TableHead>
									{t("admin.students.table.registrationNumber")}
								</TableHead>
								<TableHead className="w-16" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{students.map((student) => (
								<TableRow key={student.id}>
									<TableCell className="font-medium">
										{student.profile?.lastName ?? "—"}
									</TableCell>
									<TableCell>{student.profile?.firstName ?? "—"}</TableCell>
									<TableCell className="font-mono text-sm">
										{student.registrationNumber ?? "—"}
									</TableCell>
									<TableCell>
										{student.domainUserId && (
											<Button
												variant="ghost"
												size="icon"
												asChild
												title={t("navigation.pages.openProfile")}
											>
												<Link
													to={`/profiles/${student.domainUserId}`}
													aria-label={t("navigation.pages.openProfile")}
												>
													<ExternalLink className="h-4 w-4" />
												</Link>
											</Button>
										)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</CardContent>
		</Card>
	);
}
