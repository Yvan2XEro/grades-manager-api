import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	AlertCircle,
	ArrowLeft,
	Check,
	Lock,
	RotateCcw,
	Save,
	Search,
} from "lucide-react";
import {
	type KeyboardEvent,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { trpcClient } from "../../utils/trpc";

type Student = {
	id: string;
	firstName: string;
	lastName: string;
	registrationNumber: string;
};

type Exam = {
	id: string;
	name: string;
	type: string;
	percentage: number;
	isLocked: boolean;
	canEdit: boolean;
};

type CellState = "idle" | "dirty" | "saving" | "saved" | "error";

type CellKey = `${string}::${string}`; // `${studentId}::${examId}`

const cellKey = (studentId: string, examId: string): CellKey =>
	`${studentId}::${examId}`;

function isValidScore(value: string): { ok: boolean; n?: number } {
	if (value.trim() === "") return { ok: true, n: undefined };
	const n = Number(value.replace(",", "."));
	if (Number.isNaN(n)) return { ok: false };
	if (n < 0 || n > 20) return { ok: false };
	return { ok: true, n };
}

export default function GradeSpreadsheet({
	basePath = "/teacher",
}: {
	basePath?: string;
}) {
	const { courseId } = useParams<{ courseId: string }>();
	const navigate = useNavigate();
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const [search, setSearch] = useState("");
	const debouncedSearch = useDebounce(search, 200);

	// Per-cell value (raw string the user typed) — separate from the persisted score
	const [values, setValues] = useState<Record<CellKey, string>>({});
	// Per-cell state
	const [states, setStates] = useState<Record<CellKey, CellState>>({});
	// Per-cell error message (e.g. invalid range)
	const [errors, setErrors] = useState<Record<CellKey, string | undefined>>({});

	// Track grade ID per (student, exam) for deletes
	const [gradeIds, setGradeIds] = useState<Record<CellKey, string>>({});

	// Refs for keyboard navigation
	const inputsRef = useRef<Record<CellKey, HTMLInputElement | null>>({});

	// Pending save timers per cell
	const saveTimersRef = useRef<Record<CellKey, ReturnType<typeof setTimeout>>>(
		{},
	);

	const courseQuery = useQuery({
		queryKey: ["spreadsheet-course", courseId],
		enabled: Boolean(courseId),
		queryFn: async () => {
			if (!courseId) throw new Error("missing courseId");
			const cc = await trpcClient.classCourses.getById.query({ id: courseId });
			const klass = await trpcClient.classes.getById.query({ id: cc.class });
			const [course, program] = await Promise.all([
				trpcClient.courses.getById.query({ id: cc.course }),
				trpcClient.programs.getById.query({ id: klass.program }),
			]);
			return {
				className: klass.name,
				courseName: course.name,
				courseCode: course.code,
				programName: program.name,
			};
		},
	});

	const rosterQuery = useQuery({
		queryKey: ["spreadsheet-roster", courseId],
		enabled: Boolean(courseId),
		queryFn: async () => {
			if (!courseId) return [] as Student[];
			const { students } = await trpcClient.classCourses.roster.query({
				id: courseId,
			});
			return students as Student[];
		},
	});

	const examsQuery = useQuery({
		queryKey: ["spreadsheet-exams", courseId],
		enabled: Boolean(courseId),
		queryFn: async () => {
			if (!courseId) return [] as Exam[];
			const { items } = await trpcClient.exams.list.query({
				classCourseId: courseId,
			});
			return items.map(
				(e: any): Exam => ({
					id: e.id,
					name: e.name,
					type: e.type,
					percentage: Number(e.percentage),
					isLocked: e.isLocked,
					canEdit: e.canEdit ?? false,
				}),
			);
		},
	});

	const gradesQuery = useQuery({
		queryKey: ["spreadsheet-grades", courseId],
		enabled: Boolean(courseId),
		queryFn: async () => {
			if (!courseId) return [];
			const { items } = await trpcClient.grades.listByClassCourse.query({
				classCourseId: courseId,
				limit: 5000,
			});
			return items as Array<{
				id: string;
				student: string;
				exam: string;
				score: string;
			}>;
		},
	});

	// Hydrate values + gradeIds when grades load
	useEffect(() => {
		if (!gradesQuery.data) return;
		const nextValues: Record<CellKey, string> = {};
		const nextIds: Record<CellKey, string> = {};
		for (const g of gradesQuery.data) {
			const k = cellKey(g.student, g.exam);
			nextValues[k] = String(Number(g.score));
			nextIds[k] = g.id;
		}
		setValues(nextValues);
		setGradeIds(nextIds);
		setStates({});
		setErrors({});
	}, [gradesQuery.data]);

	const upsertMutation = useMutation({
		mutationFn: async (input: {
			studentId: string;
			examId: string;
			score: number;
		}) => {
			return trpcClient.grades.upsertNote.mutate(input);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: string) =>
			trpcClient.grades.deleteNote.mutate({ id }),
	});

	const persistCell = useCallback(
		async (studentId: string, examId: string, raw: string) => {
			const k = cellKey(studentId, examId);
			const validation = isValidScore(raw);
			if (!validation.ok) {
				setErrors((e) => ({
					...e,
					[k]: t("teacher.spreadsheet.invalidScore", {
						defaultValue: "Score doit être entre 0 et 20",
					}),
				}));
				setStates((s) => ({ ...s, [k]: "error" }));
				return;
			}
			setErrors((e) => ({ ...e, [k]: undefined }));
			setStates((s) => ({ ...s, [k]: "saving" }));
			try {
				if (validation.n === undefined) {
					// empty → delete if existing
					const existingId = gradeIds[k];
					if (existingId) {
						await deleteMutation.mutateAsync(existingId);
						setGradeIds((g) => {
							const next = { ...g };
							delete next[k];
							return next;
						});
					}
				} else {
					const result = await upsertMutation.mutateAsync({
						studentId,
						examId,
						score: validation.n,
					});
					if (result?.id) {
						setGradeIds((g) => ({ ...g, [k]: result.id }));
					}
				}
				setStates((s) => ({ ...s, [k]: "saved" }));
				// Fade saved state to idle after 1.5s
				setTimeout(() => {
					setStates((s) => (s[k] === "saved" ? { ...s, [k]: "idle" } : s));
				}, 1500);
			} catch (err: any) {
				setStates((s) => ({ ...s, [k]: "error" }));
				setErrors((e) => ({ ...e, [k]: err?.message ?? "Erreur" }));
			}
		},
		[gradeIds, deleteMutation, upsertMutation, t],
	);

	const scheduleSave = useCallback(
		(studentId: string, examId: string, raw: string) => {
			const k = cellKey(studentId, examId);
			if (saveTimersRef.current[k]) clearTimeout(saveTimersRef.current[k]);
			saveTimersRef.current[k] = setTimeout(() => {
				void persistCell(studentId, examId, raw);
			}, 600);
		},
		[persistCell],
	);

	const handleChange = (studentId: string, examId: string, value: string) => {
		const k = cellKey(studentId, examId);
		setValues((v) => ({ ...v, [k]: value }));
		setStates((s) => ({ ...s, [k]: "dirty" }));
		setErrors((e) => ({ ...e, [k]: undefined }));
		scheduleSave(studentId, examId, value);
	};

	const handleBlur = (studentId: string, examId: string) => {
		const k = cellKey(studentId, examId);
		// Flush any pending debounced save
		if (saveTimersRef.current[k]) {
			clearTimeout(saveTimersRef.current[k]);
			delete saveTimersRef.current[k];
		}
		const raw = values[k] ?? "";
		void persistCell(studentId, examId, raw);
	};

	const filteredStudents = useMemo(() => {
		const all = rosterQuery.data ?? [];
		const q = debouncedSearch.trim().toLowerCase();
		if (!q) return all;
		return all.filter((s) =>
			`${s.firstName} ${s.lastName} ${s.registrationNumber}`
				.toLowerCase()
				.includes(q),
		);
	}, [rosterQuery.data, debouncedSearch]);

	const exams = examsQuery.data ?? [];

	// Keyboard navigation
	const handleKeyDown = (
		e: KeyboardEvent<HTMLInputElement>,
		studentIdx: number,
		examIdx: number,
	) => {
		const focusCell = (sIdx: number, eIdx: number) => {
			const student = filteredStudents[sIdx];
			const exam = exams[eIdx];
			if (!student || !exam) return;
			const k = cellKey(student.id, exam.id);
			const el = inputsRef.current[k];
			if (el) {
				e.preventDefault();
				el.focus();
				el.select();
			}
		};

		if (e.key === "Enter" || e.key === "ArrowDown") {
			focusCell(studentIdx + 1, examIdx);
		} else if (e.key === "ArrowUp") {
			focusCell(studentIdx - 1, examIdx);
		} else if (
			e.key === "ArrowRight" &&
			(e.target as HTMLInputElement).selectionStart ===
				((e.target as HTMLInputElement).value?.length ?? 0)
		) {
			focusCell(studentIdx, examIdx + 1);
		} else if (
			e.key === "ArrowLeft" &&
			(e.target as HTMLInputElement).selectionStart === 0
		) {
			focusCell(studentIdx, examIdx - 1);
		}
		// Tab is native browser behavior — works left-to-right across exam columns
	};

	const isLoading =
		courseQuery.isLoading ||
		rosterQuery.isLoading ||
		examsQuery.isLoading ||
		gradesQuery.isLoading;

	if (!courseId) {
		return (
			<Card>
				<CardContent className="py-10 text-center text-muted-foreground text-sm">
					{t("teacher.spreadsheet.noCourse", {
						defaultValue: "Aucun cours sélectionné",
					})}
				</CardContent>
			</Card>
		);
	}

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Spinner className="h-10 w-10 text-primary" />
			</div>
		);
	}

	const courseInfo = courseQuery.data;

	// Counters for the header
	const totalCells = filteredStudents.length * exams.length;
	const filledCells = Object.entries(values).filter(([k, v]) => {
		const [sId, eId] = k.split("::");
		return (
			v.trim() !== "" &&
			filteredStudents.some((s) => s.id === sId) &&
			exams.some((ex) => ex.id === eId)
		);
	}).length;
	const dirtyCount = Object.values(states).filter(
		(s) => s === "dirty" || s === "saving",
	).length;
	const errorCount = Object.values(states).filter((s) => s === "error").length;

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
				<div>
					<div className="mb-1 flex items-center gap-2">
						<Button variant="ghost" size="sm" asChild>
							<Link to={`${basePath}/courses`}>
								<ArrowLeft className="mr-1 h-4 w-4" />
								{t("common.actions.back", { defaultValue: "Retour" })}
							</Link>
						</Button>
					</div>
					<h2 className="text-foreground">{courseInfo?.courseName}</h2>
					<p className="text-muted-foreground text-sm">
						{courseInfo?.className} • {courseInfo?.programName}
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Badge variant="outline">
						{filledCells} / {totalCells}{" "}
						{t("teacher.spreadsheet.filled", { defaultValue: "remplies" })}
					</Badge>
					{dirtyCount > 0 && (
						<Badge variant="secondary" className="gap-1">
							<Save className="h-3 w-3" /> {dirtyCount}{" "}
							{t("teacher.spreadsheet.pending", { defaultValue: "en cours" })}
						</Badge>
					)}
					{errorCount > 0 && (
						<Badge variant="destructive" className="gap-1">
							<AlertCircle className="h-3 w-3" /> {errorCount}{" "}
							{t("teacher.spreadsheet.errors", { defaultValue: "erreurs" })}
						</Badge>
					)}
					<Button
						variant="outline"
						size="sm"
						onClick={() => navigate(`${basePath}/grades/${courseId}`)}
					>
						{t("teacher.spreadsheet.perExamMode", {
							defaultValue: "Mode examen unique",
						})}
					</Button>
				</div>
			</div>

			{/* Search */}
			<Card>
				<CardContent className="py-3">
					<div className="relative max-w-md">
						<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder={t("teacher.spreadsheet.searchStudent", {
								defaultValue: "Rechercher un étudiant…",
							})}
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-9"
						/>
					</div>
				</CardContent>
			</Card>

			{/* Spreadsheet */}
			{!exams.length ? (
				<Card>
					<CardContent className="py-10 text-center text-muted-foreground text-sm">
						{t("teacher.spreadsheet.noExams", {
							defaultValue: "Aucun examen pour ce cours. Créez-en un d'abord.",
						})}
					</CardContent>
				</Card>
			) : !filteredStudents.length ? (
				<Card>
					<CardContent className="py-10 text-center text-muted-foreground text-sm">
						{t("teacher.spreadsheet.noStudents", {
							defaultValue: "Aucun étudiant ne correspond à la recherche.",
						})}
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-base">
							{t("teacher.spreadsheet.legend.title", {
								defaultValue: "Saisie rapide — auto-enregistrement",
							})}
						</CardTitle>
						<CardDescription className="text-xs">
							{t("teacher.spreadsheet.legend.hint", {
								defaultValue:
									"Tab/Entrée/flèches pour naviguer. Vide une cellule pour supprimer la note. Sauvegarde automatique au blur.",
							})}
						</CardDescription>
					</CardHeader>
					<CardContent className="overflow-x-auto p-0">
						<table className="w-full border-collapse text-sm">
							<thead className="sticky top-0 z-10 bg-muted/50">
								<tr>
									<th className="sticky left-0 z-20 min-w-[220px] border-b bg-muted/50 px-3 py-2 text-left font-medium">
										{t("teacher.spreadsheet.studentCol", {
											defaultValue: "Étudiant",
										})}
									</th>
									<th className="border-b px-2 py-2 text-left font-normal text-muted-foreground text-xs">
										{t("teacher.spreadsheet.matricule", {
											defaultValue: "Matricule",
										})}
									</th>
									{exams.map((exam) => (
										<th
											key={exam.id}
											className="min-w-[100px] border-b px-2 py-2 text-center font-medium"
										>
											<div className="flex flex-col items-center gap-0.5">
												<span className="flex items-center gap-1">
													{exam.name}
													{exam.isLocked && (
														<Lock className="h-3 w-3 text-muted-foreground" />
													)}
												</span>
												<span className="font-normal text-[10px] text-muted-foreground">
													{exam.type} • {exam.percentage}%
												</span>
											</div>
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{filteredStudents.map((student, sIdx) => (
									<tr
										key={student.id}
										className="even:bg-muted/10 hover:bg-muted/20"
									>
										<td className="sticky left-0 border-b bg-background px-3 py-1.5 font-medium">
											{student.lastName} {student.firstName}
										</td>
										<td className="border-b px-2 py-1.5 text-muted-foreground text-xs">
											{student.registrationNumber}
										</td>
										{exams.map((exam, eIdx) => {
											const k = cellKey(student.id, exam.id);
											const value = values[k] ?? "";
											const state = states[k] ?? "idle";
											const error = errors[k];
											const disabled = exam.isLocked || !exam.canEdit;
											return (
												<td
													key={exam.id}
													className="border-b px-1 py-1 align-middle"
												>
													<div className="relative">
														<Input
															ref={(el) => {
																inputsRef.current[k] = el;
															}}
															type="text"
															inputMode="decimal"
															value={value}
															disabled={disabled}
															onChange={(e) =>
																handleChange(
																	student.id,
																	exam.id,
																	e.target.value,
																)
															}
															onBlur={() => handleBlur(student.id, exam.id)}
															onKeyDown={(e) => handleKeyDown(e, sIdx, eIdx)}
															onFocus={(e) => e.target.select()}
															className={`h-8 w-full px-2 text-center text-sm ${
																state === "error"
																	? "border-destructive ring-destructive"
																	: state === "saved"
																		? "border-green-500 ring-green-200"
																		: state === "dirty" || state === "saving"
																			? "border-amber-400"
																			: ""
															}`}
															title={error ?? undefined}
															placeholder={disabled ? "—" : ""}
														/>
														{state === "saved" && (
															<Check className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-1.5 h-3 w-3 text-green-500" />
														)}
														{state === "saving" && (
															<RotateCcw className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-1.5 h-3 w-3 animate-spin text-amber-500" />
														)}
														{state === "error" && (
															<AlertCircle className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-1.5 h-3 w-3 text-destructive" />
														)}
													</div>
												</td>
											);
										})}
									</tr>
								))}
							</tbody>
						</table>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
