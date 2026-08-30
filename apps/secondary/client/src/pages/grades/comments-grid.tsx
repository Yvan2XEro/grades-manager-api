import { CheckCircle, GraduationCap, MessageSquare, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

export function CommentsGrid() {
	const { t } = useTranslation();
	const { classId, subjectId, termId } = useParams<{
		classId: string;
		subjectId: string;
		termId: string;
	}>();

	const [saved, setSaved] = useState(false);
	// comments[studentId] = string
	const [comments, setComments] = useState<Record<string, string>>({});

	const { data: classData } = trpc.classes.get.useQuery(
		{ id: classId! },
		{ enabled: !!classId },
	);

	const { data: subjectsData } = trpc.subjects.list.useQuery({ pageSize: 200 });
	const subject = subjectsData?.items?.find((s) => s.id === subjectId);

	const { data: years = [] } = trpc.academicYears.list.useQuery();
	const activeYear = years.find((y) => y.status === "active") ?? years[0];

	const { data: terms = [] } = trpc.terms.list.useQuery(
		{ academicYearId: activeYear?.id ?? "" },
		{ enabled: !!activeYear?.id },
	);
	const term = terms.find((trm) => trm.id === termId);

	const { data: enrollmentsData } = trpc.enrollments.list.useQuery(
		{
			academicYearId: activeYear?.id ?? "",
			classId: classId ?? "",
			pageSize: 200,
		},
		{ enabled: !!classId && !!activeYear?.id },
	);
	const enrollments = enrollmentsData?.items ?? [];

	const { data: existingComments = [] } = trpc.comments.list.useQuery(
		{
			classId: classId!,
			subjectId: subjectId!,
			termId: termId!,
		},
		{ enabled: !!classId && !!subjectId && !!termId },
	);

	// Pre-fill from existing comments
	useEffect(() => {
		if (existingComments.length === 0) return;
		setComments((prev) => {
			const merged = { ...prev };
			for (const c of existingComments) {
				if (merged[c.studentId] === undefined) {
					merged[c.studentId] = c.comment;
				}
			}
			return merged;
		});
	}, [existingComments]);

	const batchUpsert = trpc.comments.batchUpsert.useMutation({
		onSuccess: () => {
			setSaved(true);
			setTimeout(() => setSaved(false), 2000);
		},
	});

	const handleSave = () => {
		if (!classId || !subjectId || !termId) return;
		const items = enrollments
			.map((e) => e.student)
			.filter(Boolean)
			.map((student) => ({
				studentId: student?.id,
				classId: classId,
				subjectId: subjectId,
				termId: termId,
				comment: comments[student?.id] ?? "",
			}))
			.filter(
				(item) =>
					item.comment.trim() !== "" ||
					existingComments.some((c) => c.studentId === item.studentId),
			);

		if (items.length === 0) return;
		batchUpsert.mutate({ items });
	};

	const setComment = (studentId: string, value: string) => {
		setComments((prev) => ({ ...prev, [studentId]: value }));
	};

	// Arrow key + Enter navigation between textareas
	const handleKeyDown = (
		e: React.KeyboardEvent<HTMLTextAreaElement>,
		rowIdx: number,
	) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			const next = document.querySelector<HTMLTextAreaElement>(
				`textarea[data-row="${rowIdx + 1}"]`,
			);
			if (next) {
				next.focus();
				next.select();
			}
		} else if (e.key === "ArrowDown" && e.ctrlKey) {
			e.preventDefault();
			const next = document.querySelector<HTMLTextAreaElement>(
				`textarea[data-row="${rowIdx + 1}"]`,
			);
			if (next) next.focus();
		} else if (e.key === "ArrowUp" && e.ctrlKey) {
			e.preventDefault();
			const prev = document.querySelector<HTMLTextAreaElement>(
				`textarea[data-row="${rowIdx - 1}"]`,
			);
			if (prev) prev.focus();
		}
	};

	return (
		<div className="space-y-5">
			<div className="flex items-start justify-between">
				<div>
					<h1 className="font-bold text-2xl text-foreground">
						{t("comments.grid_title", "Teacher Comments")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{[
							classData?.name,
							subject?.name,
							term
								? t(`terms.term_${term.termNumber}`, `Term ${term.termNumber}`)
								: null,
						]
							.filter(Boolean)
							.join(" · ")}
					</p>
				</div>
			</div>

			<div className="overflow-hidden rounded-xl border border-border">
				<div className="flex items-center justify-between bg-muted/30 px-4 py-3">
					<span className="font-medium text-foreground text-sm">
						{enrollments.length} {t("grades.students", "students")}
					</span>
					<button
						type="button"
						onClick={handleSave}
						disabled={batchUpsert.isPending}
						className={cn(
							"inline-flex items-center gap-2 rounded-lg px-4 py-1.5 font-medium text-sm transition-colors",
							saved
								? "bg-green-500 text-white"
								: "bg-primary text-primary-foreground hover:bg-primary/90",
						)}
					>
						{saved ? (
							<CheckCircle className="h-4 w-4" />
						) : (
							<Save className="h-4 w-4" />
						)}
						{saved ? t("grades.saved", "Saved!") : t("grades.save", "Save")}
					</button>
				</div>

				{enrollments.length === 0 ? (
					<div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
						<GraduationCap className="h-10 w-10 opacity-20" />
						<p className="font-medium">
							{t("grades.no_students", "No students in this class")}
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead className="border-border border-b bg-muted/60 text-muted-foreground">
								<tr>
									<th className="w-48 px-4 py-2 text-left font-medium">
										{t("grades.col_student", "Student")}
									</th>
									<th className="px-4 py-2 text-left font-medium">
										<span className="flex items-center gap-1.5">
											<MessageSquare className="h-3.5 w-3.5" />
											{t("comments.col_comment", "Comment")}
											<span className="font-normal text-muted-foreground/60 text-xs">
												(max 200)
											</span>
										</span>
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{enrollments.map((e, rowIdx) => {
									const student = e.student;
									if (!student) return null;
									const value = comments[student.id] ?? "";
									const charCount = value.length;
									return (
										<tr
											key={student.id}
											className="transition-colors hover:bg-muted/20"
										>
											<td className="px-4 py-2 pt-3 align-top font-medium text-foreground">
												{student.lastName} {student.firstName}
											</td>
											<td className="px-4 py-2">
												<div className="relative">
													<textarea
														rows={2}
														maxLength={200}
														placeholder={t(
															"comments.placeholder",
															"Write a comment… (optional)",
														)}
														data-row={rowIdx}
														value={value}
														onChange={(ev) =>
															setComment(student.id, ev.target.value)
														}
														onKeyDown={(ev) => handleKeyDown(ev, rowIdx)}
														className="w-full resize-none rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
													/>
													{charCount > 160 && (
														<span
															className={cn(
																"absolute right-2 bottom-2 text-xs",
																charCount >= 200
																	? "text-destructive"
																	: "text-muted-foreground",
															)}
														>
															{charCount}/200
														</span>
													)}
												</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}
