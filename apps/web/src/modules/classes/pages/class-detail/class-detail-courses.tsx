import { useMutation } from "@tanstack/react-query";
import { BookOpen, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { confirmAction } from "@/components/callable/confirm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
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
import { useAddTeachingUnitCourses } from "../../components/class-no-courses-hint";
import { NoTeacherBadge } from "../../components/no-teacher-badge";
import { useClassContext } from "../../hooks/use-class-context";
import { useCoursesOfClass } from "../../hooks/use-class-courses";

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
	const navigate = useNavigate();

	const { courses, isLoading, invalidate } = useCoursesOfClass(cls.id);
	const addTeachingUnitCourses = useAddTeachingUnitCourses(cls);

	const deleteMutation = useMutation({
		mutationFn: (id: string) => trpcClient.classCourses.delete.mutate({ id }),
		onSuccess: () => {
			toast.success(t("admin.classCourses.toast.deleteSuccess"));
			invalidate();
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const confirmDelete = (id: string) =>
		confirmAction({
			title: t("admin.classCourses.deleteConfirm.title"),
			message: t("admin.classCourses.deleteConfirm.description"),
			confirmText: t("common.actions.delete"),
			onConfirm: () => deleteMutation.mutateAsync(id).catch(() => undefined),
		});

	return (
		<Card className="flex min-h-64 flex-1 flex-col">
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle>{t("classes.hub.tabs.courses")}</CardTitle>
				<Button size="sm" asChild>
					<Link to="/classes/assignments">
						{t("admin.classCourses.actions.manage")}
					</Link>
				</Button>
			</CardHeader>
			<CardContent className="flex min-h-0 flex-1 flex-col">
				{isLoading ? null : courses.length === 0 ? (
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<BookOpen className="text-muted-foreground" />
							</EmptyMedia>
							<EmptyTitle>{t("admin.classes.noCoursesHint.title")}</EmptyTitle>
							<EmptyDescription>
								{t("admin.classes.noCoursesHint.description")}
							</EmptyDescription>
						</EmptyHeader>
						<EmptyContent>
							<Button onClick={addTeachingUnitCourses}>
								<Plus className="mr-2 h-4 w-4" />
								{t("admin.classes.noCoursesHint.action")}
							</Button>
						</EmptyContent>
					</Empty>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{t("admin.classCourses.fields.code")}</TableHead>
								<TableHead>{t("admin.classCourses.fields.course")}</TableHead>
								<TableHead>{t("admin.classCourses.fields.teacher")}</TableHead>
								<TableHead className="w-16" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{courses.map((cc) => (
								<TableRow
									key={cc.id}
									className="cursor-pointer"
									onClick={() => navigate(`/grades/${cc.id}`)}
								>
									<TableCell className="font-mono text-sm">{cc.code}</TableCell>
									<TableCell>{cc.courseName ?? cc.courseCode ?? "—"}</TableCell>
									<TableCell className="text-muted-foreground">
										{cc.hasTeacher ? teacherName(cc) : <NoTeacherBadge />}
									</TableCell>
									<TableCell>
										<Button
											variant="ghost"
											size="icon"
											aria-label={t("common.actions.delete")}
											onClick={(event) => {
												event.stopPropagation();
												confirmDelete(cc.id);
											}}
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
