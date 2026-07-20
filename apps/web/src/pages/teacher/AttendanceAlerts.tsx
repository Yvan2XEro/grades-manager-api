import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, BellRing, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "../../utils/trpc";

const AttendanceAlerts = () => {
	const { t } = useTranslation();
	const [message, setMessage] = useState("");
	const [selectedClassCourseId, setSelectedClassCourseId] = useState("");

	const classCoursesQuery = useQuery(
		trpc.classCourses.list.queryOptions({ limit: 200 }),
	);

	const sendAlert = useMutation({
		mutationFn: () =>
			trpcClient.workflows.attendanceAlert.mutate({
				classCourseId: selectedClassCourseId,
				severity: "warning",
				message,
			}),
		onSuccess: () => {
			toast.success(
				t("teacher.attendance.toast.sent", {
					defaultValue: "Alert queued",
				}),
			);
			setMessage("");
			setSelectedClassCourseId("");
		},
		onError: (error: Error) => toast.error(error.message),
	});
	const classCourses = classCoursesQuery.data?.items ?? [];

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-foreground">{t("teacher.attendance.title")}</h1>
				<p className="text-muted-foreground">
					{t("teacher.attendance.subtitle")}
				</p>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>{t("teacher.attendance.openAlerts")}</CardTitle>
						<CardDescription>
							{t("teacher.attendance.broadcastDesc")}
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{classCoursesQuery.isLoading ? (
							<div className="flex items-center gap-2 text-muted-foreground text-sm">
								<Loader2 className="h-4 w-4 animate-spin" />
								{t("common.loading", { defaultValue: "Loading..." })}
							</div>
						) : classCoursesQuery.isError ? (
							<p className="text-destructive text-xs">
								{t("teacher.attendance.error", {
									defaultValue: "Could not load class courses",
								})}
							</p>
						) : classCourses.length ? (
							classCourses.map((classCourse) => (
								<div
									key={classCourse.id}
									className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4"
								>
									<div className="rounded-full bg-amber-100 p-2 text-amber-700">
										<AlertTriangle className="h-5 w-5" />
									</div>
									<div>
										<p className="font-medium text-foreground">
											{classCourse.className}
										</p>
										<p className="text-muted-foreground text-xs">
											{classCourse.courseName}
										</p>
									</div>
								</div>
							))
						) : (
							<p className="text-muted-foreground text-xs">
								{t("teacher.attendance.none", {
									defaultValue: "No class course assigned yet.",
								})}
							</p>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>{t("teacher.attendance.broadcast")}</CardTitle>
						<CardDescription>
							{t("teacher.attendance.broadcastDesc")}
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="space-y-2">
							<Label htmlFor="teacher-attendance-class-course">
								{t("teacher.workflow.selectCourse", {
									defaultValue: "Select class course",
								})}
							</Label>
							<Select
								value={selectedClassCourseId || undefined}
								onValueChange={setSelectedClassCourseId}
							>
								<SelectTrigger id="teacher-attendance-class-course">
									<SelectValue
										placeholder={t("teacher.workflow.selectCourse", {
											defaultValue: "Select class course",
										})}
									/>
								</SelectTrigger>
								<SelectContent>
									{classCourses.map((classCourse) => (
										<SelectItem key={classCourse.id} value={classCourse.id}>
											{classCourse.className} • {classCourse.courseName}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<Textarea
							placeholder={t("teacher.attendance.placeholder", {
								defaultValue: "Message",
							})}
							value={message}
							onChange={(event) => setMessage(event.target.value)}
						/>
						<Button
							type="button"
							className="flex items-center"
							disabled={!message || !selectedClassCourseId}
							onClick={() => sendAlert.mutate()}
						>
							<BellRing className="mr-2 h-4 w-4" />
							{t("teacher.attendance.send", {
								defaultValue: "Send alert",
							})}
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default AttendanceAlerts;
