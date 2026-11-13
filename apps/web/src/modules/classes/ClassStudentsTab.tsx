import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
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
import { useClassContext } from "./ClassContext";

export default function ClassStudentsTab() {
	const { t } = useTranslation();
	const { cls } = useClassContext();

	const { data, isLoading } = useQuery({
		queryKey: ["students", "byClass", cls.id],
		queryFn: () =>
			trpcClient.students.list.query({ classId: cls.id, limit: 200 }),
	});
	const students = data?.items ?? [];

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					{t("classes.hub.tabs.students", { defaultValue: "Students" })}
					{students.length > 0 && (
						<span className="ml-2 font-normal text-muted-foreground text-sm">
							({students.length})
						</span>
					)}
				</CardTitle>
			</CardHeader>
			<CardContent>
				{isLoading ? null : students.length === 0 ? (
					<Empty>
						<EmptyHeader>
							<EmptyContent>
								<EmptyTitle>
									{t("admin.classes.students.empty.title", {
										defaultValue: "No students enrolled",
									})}
								</EmptyTitle>
								<EmptyDescription>
									{t("admin.classes.students.empty.description", {
										defaultValue: "Enroll students via the Enrollments tab.",
									})}
								</EmptyDescription>
							</EmptyContent>
						</EmptyHeader>
					</Empty>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>
									{t("admin.students.table.lastName", {
										defaultValue: "Last Name",
									})}
								</TableHead>
								<TableHead>
									{t("admin.students.table.firstName", {
										defaultValue: "First Name",
									})}
								</TableHead>
								<TableHead>
									{t("admin.students.table.registrationNumber", {
										defaultValue: "Reg. #",
									})}
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
											<Button variant="ghost" size="icon" asChild>
												<Link to={`/admin/profiles/${student.domainUserId}`}>
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
