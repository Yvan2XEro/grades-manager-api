import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { confirmAction } from "@/components/callable/confirm";
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
import { toast } from "@/lib/toast";
import type { RouterOutputs } from "@/utils/trpc";
import { trpcClient } from "@/utils/trpc";
import { useClassContext } from "../../hooks/use-class-context";

type ClassCourse = RouterOutputs["classCourses"]["list"]["items"][number];

function teacherName(cc: ClassCourse): string {
	const first = cc.teacherFirstName ?? "";
	const last = cc.teacherLastName ?? "";
	const full = `${first} ${last}`.trim();
	return full || "—";
}

export default function ClassDetailCourses() {
	const { t } = useTranslation();
	const { cls } = useClassContext();
	const queryClient = useQueryClient();

	const queryKey = ["classCourses", "byClass", cls.id];

	const { data, isLoading } = useQuery({
		queryKey,
		queryFn: () =>
			trpcClient.classCourses.list.query({ classId: cls.id, limit: 200 }),
	});
	const courses = data?.items ?? [];

	const invalidate = () => queryClient.invalidateQueries({ queryKey });

	const deleteMutation = useMutation({
		mutationFn: (id: string) => trpcClient.classCourses.delete.mutate({ id }),
		onSuccess: () => {
			toast.success(
				t("admin.classCourses.toast.deleteSuccess", {
					defaultValue: "Course assignment removed",
				}),
			);
			invalidate();
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const confirmDelete = (id: string) =>
		confirmAction({
			title: t("admin.classCourses.deleteConfirm.title", {
				defaultValue: "Remove course assignment?",
			}),
			message: t("admin.classCourses.deleteConfirm.description", {
				defaultValue: "This cannot be undone.",
			}),
			confirmText: t("common.actions.delete", { defaultValue: "Delete" }),
			onConfirm: () => deleteMutation.mutateAsync(id).catch(() => undefined),
		});

	return (
		<Card className="flex min-h-64 flex-1 flex-col">
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle>
					{t("classes.hub.tabs.courses", { defaultValue: "Courses" })}
				</CardTitle>
				<Button size="sm" asChild>
					<Link to="/classes/assignments">
						{t("admin.classCourses.actions.manage", {
							defaultValue: "Manage All",
						})}
					</Link>
				</Button>
			</CardHeader>
			<CardContent className="flex min-h-0 flex-1 flex-col">
				{isLoading ? null : courses.length === 0 ? (
					<Empty>
						<EmptyHeader>
							<EmptyContent>
								<EmptyTitle>
									{t("admin.classCourses.empty.title", {
										defaultValue: "No course assignments",
									})}
								</EmptyTitle>
								<EmptyDescription>
									{t("admin.classCourses.empty.description", {
										defaultValue:
											"Assign courses to this class from the Assignments page.",
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
									{t("admin.classCourses.fields.code", {
										defaultValue: "Code",
									})}
								</TableHead>
								<TableHead>
									{t("admin.classCourses.fields.course", {
										defaultValue: "Course",
									})}
								</TableHead>
								<TableHead>
									{t("admin.classCourses.fields.teacher", {
										defaultValue: "Teacher",
									})}
								</TableHead>
								<TableHead className="w-16" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{courses.map((cc) => (
								<TableRow key={cc.id}>
									<TableCell className="font-mono text-sm">{cc.code}</TableCell>
									<TableCell>{cc.courseName ?? cc.courseCode ?? "—"}</TableCell>
									<TableCell className="text-muted-foreground">
										{teacherName(cc)}
									</TableCell>
									<TableCell>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => confirmDelete(cc.id)}
										>
											<Trash2 className="h-4 w-4 text-destructive" />
										</Button>
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
