import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";
import { createCallable } from "react-call";
import { useTranslation } from "react-i18next";
import {
	CallableDialog,
	DIALOG_EXIT_MS,
} from "@/components/callable/callable-dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpcClient } from "@/utils/trpc";
import type { RosterStudent } from "../types";

/** Students of a class course (read-only), opened from the teacher home. */
export const CourseRosterDialog = createCallable<{
	classCourseId: string;
	courseName: string;
	className: string;
}>(({ call, classCourseId, courseName, className }) => {
	const { t } = useTranslation();
	const [search, setSearch] = useState("");
	const rosterQuery = useQuery({
		queryKey: ["class-course-roster", classCourseId],
		queryFn: async () => {
			const { students } = await trpcClient.classCourses.roster.query({
				id: classCourseId,
			});
			return students as RosterStudent[];
		},
	});
	const students = [...(rosterQuery.data ?? [])].sort((a, b) =>
		`${a.lastName} ${a.firstName}`.localeCompare(
			`${b.lastName} ${b.firstName}`,
		),
	);
	const q = search.trim().toLowerCase();
	const visible = q
		? students.filter((s) =>
				`${s.lastName} ${s.firstName} ${s.registrationNumber}`
					.toLowerCase()
					.includes(q),
			)
		: students;

	return (
		<CallableDialog
			call={call}
			dismissValue={undefined}
			title={t("teacher.courses.roster.title", { course: courseName })}
			description={t("teacher.courses.roster.description", {
				className,
				count: students.length,
			})}
		>
			<div className="space-y-3">
				<div className="relative">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						className="pl-9"
						placeholder={t("teacher.courses.roster.search")}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</div>
				{rosterQuery.isLoading ? (
					<Skeleton className="h-48 w-full" />
				) : visible.length === 0 ? (
					<p className="py-6 text-center text-muted-foreground text-sm">
						{t("teacher.courses.roster.empty")}
					</p>
				) : (
					<ol className="max-h-[55vh] divide-y overflow-y-auto rounded-md border">
						{visible.map((student, index) => (
							<li
								key={student.id}
								className="flex items-center gap-3 px-3 py-2 text-sm"
							>
								<span className="w-6 shrink-0 text-right text-muted-foreground text-xs tabular-nums">
									{index + 1}
								</span>
								<span className="min-w-0 flex-1 truncate">
									<span className="font-medium">{student.lastName}</span>{" "}
									{student.firstName}
								</span>
								<span className="shrink-0 font-mono text-muted-foreground text-xs">
									{student.registrationNumber}
								</span>
							</li>
						))}
					</ol>
				)}
			</div>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);
