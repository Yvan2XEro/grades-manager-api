import {
    AlertTriangle,
    ArrowLeft,
    Check,
    Info,
    Lock,
    Save,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { useStore } from "../../store";
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
	date: string;
	percentage: number;
	isLocked: boolean;
};

type GradeInput = {
	studentId: string;
	examId: string;
	score: number;
};

type CourseInfo = {
	course_name: string;
	class_name: string;
	program_name: string;
};

const GradeEntry: React.FC = () => {
	const { courseId } = useParams<{ courseId: string }>();
	const { user } = useStore();
	const navigate = useNavigate();
	const { t } = useTranslation();

	const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null);
	const [students, setStudents] = useState<Student[]>([]);
	const [exams, setExams] = useState<Exam[]>([]);
	const [selectedExam, setSelectedExam] = useState<string>("");
	const [grades, setGrades] = useState<Record<string, number>>({});
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [isExamLocked, setIsExamLocked] = useState(false);

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm();

	useEffect(() => {
		if (user && courseId) {
			fetchCourseData();
		}
	}, [user, courseId]);

	useEffect(() => {
		if (selectedExam) {
			fetchGrades(selectedExam);

			// Check if exam is locked
			const exam = exams.find((e) => e.id === selectedExam);
			setIsExamLocked(exam?.isLocked || false);

			// Reset form when exam changes
			reset();
		}
	}, [selectedExam, exams, reset]);

	const fetchCourseData = async () => {
		if (!user || !courseId) return;

		setIsLoading(true);
		try {
			const classCourse = await trpcClient.classCourses.getById.query({
				id: courseId,
			});
			const klass = await trpcClient.classes.getById.query({
				id: classCourse.class,
			});
			const [course, program, studentsRes, examsRes] = await Promise.all([
				trpcClient.courses.getById.query({ id: classCourse.course }),
				trpcClient.programs.getById.query({ id: klass.program }),
				trpcClient.students.list.query({ classId: klass.id }),
				trpcClient.exams.list.query({ classCourseId: courseId }),
			]);

			setCourseInfo({
				course_name: course.name,
				class_name: klass.name,
				program_name: program.name,
			});

			setStudents(studentsRes.items as Student[]);
			const examsList = examsRes.items.map((e) => ({
				id: e.id,
				name: e.name,
				type: e.type,
				date: e.date,
				percentage: Number(e.percentage),
				isLocked: e.isLocked,
			}));
			setExams(examsList);
			if (examsList.length > 0) setSelectedExam(examsList[0].id);
		} catch (error: any) {
			console.error("Error fetching course data:", error);
			toast.error(
				error.message || t("teacher.gradeEntry.toast.fetchCourseError"),
			);
		} finally {
			setIsLoading(false);
		}
	};

	const fetchGrades = async (examId: string) => {
		if (!examId) return;

		try {
			const { items } = await trpcClient.grades.listByExam.query({ examId });
			const gradesRecord: Record<string, number> = {};
			items.forEach((grade) => {
				gradesRecord[grade.student] = Number(grade.score);
			});
			setGrades(gradesRecord);

			const formData: Record<string, any> = {};
			items.forEach((grade) => {
				formData[`student_${grade.student}`] = Number(grade.score);
			});
			reset(formData);
		} catch (error: any) {
			console.error("Error fetching grades:", error);
			toast.error(
				error.message || t("teacher.gradeEntry.toast.fetchGradesError"),
			);
		}
	};

	const handleExamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const examId = e.target.value;
		setSelectedExam(examId);
		setGrades({}); // Clear grades when changing exam
	};

	const onSubmit = async (data: any) => {
		if (!selectedExam || isExamLocked) return;

		setIsSaving(true);
		try {
			// Transform form data into array of grade objects
			const gradesToUpsert: GradeInput[] = [];

			for (const studentId in data) {
				if (studentId.startsWith("student_")) {
					const actualStudentId = studentId.replace("student_", "");
					const score = Number.parseFloat(data[studentId]);

					if (!isNaN(score) && score >= 0 && score <= 20) {
						gradesToUpsert.push({
							studentId: actualStudentId,
							examId: selectedExam,
							score,
						});
					}
				}
			}

			// Upsert grades
			if (gradesToUpsert.length > 0) {
				await Promise.all(
					gradesToUpsert.map((g) => trpcClient.grades.upsertNote.mutate(g)),
				);
				toast.success(t("teacher.gradeEntry.toast.saveSuccess"));
				fetchGrades(selectedExam);
			}
		} catch (error: any) {
			console.error("Error saving grades:", error);
			toast.error(error.message || t("teacher.gradeEntry.toast.saveError"));
		} finally {
			setIsSaving(false);
		}
	};

	const lockExam = async () => {
		if (!selectedExam) return;

		try {
			await trpcClient.exams.lock.mutate({ examId: selectedExam, lock: true });
			setIsExamLocked(true);
			toast.success(t("teacher.gradeEntry.toast.lockSuccess"));
			setExams(
				exams.map((exam) =>
					exam.id === selectedExam ? { ...exam, isLocked: true } : exam,
				),
			);
		} catch (error: any) {
			console.error("Error locking exam:", error);
			toast.error(error.message || t("teacher.gradeEntry.toast.lockError"));
		}
	};

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<div className="h-12 w-12 animate-spin rounded-full border-primary-600 border-t-2 border-b-2" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center space-x-4">
				<button
					onClick={() => navigate(-1)}
					className="rounded-full p-2 hover:bg-gray-100"
				>
					<ArrowLeft className="h-5 w-5" />
				</button>
				<div>
					<h2 className="font-bold text-2xl text-gray-800">
						{t("teacher.gradeEntry.title")}
					</h2>
					{courseInfo && (
						<p className="text-gray-600">
							{courseInfo.course_name} • {courseInfo.class_name} •{" "}
							{courseInfo.program_name}
						</p>
					)}
				</div>
			</div>

			{/* Select Exam */}
			<div className="rounded-xl bg-white p-6 shadow-sm">
				<div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
					<div className="w-full md:w-1/3">
						<label
							htmlFor="exam"
							className="mb-1 block font-medium text-gray-700 text-sm"
						>
							{t("teacher.gradeEntry.selectExam.label")}
						</label>
						<select
							id="exam"
							value={selectedExam}
							onChange={handleExamChange}
							className="select select-bordered w-full"
							disabled={exams.length === 0}
						>
							{exams.length === 0 ? (
								<option value="">
									{t("teacher.gradeEntry.selectExam.empty")}
								</option>
							) : (
								exams.map((exam) => (
									<option key={exam.id} value={exam.id}>
										{exam.name} ({exam.percentage}%){" "}
										{exam.isLocked
											? `(${t("teacher.gradeEntry.selectExam.lockedTag")})`
											: ""}
									</option>
								))
							)}
						</select>
					</div>

					{selectedExam && (
						<div className="flex items-center space-x-3">
							{isExamLocked ? (
								<div className="flex items-center rounded-md bg-gray-100 px-3 py-2 text-gray-600">
									<Lock className="mr-2 h-4 w-4" />
									<span>{t("teacher.gradeEntry.lockedChip")}</span>
								</div>
							) : (
								<button
									onClick={lockExam}
									className="btn btn-outline btn-warning"
								>
									<Lock className="mr-2 h-4 w-4" />{" "}
									{t("teacher.gradeEntry.actions.lock")}
								</button>
							)}
						</div>
					)}
				</div>

				{selectedExam && exams.length > 0 && (
					<div className="mt-4 flex items-start rounded-lg bg-blue-50 p-4 text-blue-800">
						<Info className="mt-0.5 mr-2 h-5 w-5 flex-shrink-0" />
						<div>
							<p className="font-medium">
								{t("teacher.gradeEntry.info.title")}
							</p>
							<p className="text-sm">
								{t("teacher.gradeEntry.info.description")}
							</p>
						</div>
					</div>
				)}
			</div>

			{/* Grade Entry Table */}
			{selectedExam && students.length > 0 ? (
				<div className="overflow-hidden rounded-xl bg-white shadow-sm">
					<form onSubmit={handleSubmit(onSubmit)}>
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
											{t("teacher.gradeEntry.table.registration")}
										</th>
										<th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
											{t("teacher.gradeEntry.table.student")}
										</th>
										<th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
											{t("teacher.gradeEntry.table.score")}
										</th>
										<th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
											{t("teacher.gradeEntry.table.status")}
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200">
									{students.map((student) => (
										<tr key={student.id} className="hover:bg-gray-50">
											<td className="whitespace-nowrap px-6 py-4 text-gray-900 text-sm">
												{student.registrationNumber}
											</td>
											<td className="whitespace-nowrap px-6 py-4 text-gray-900 text-sm">
												{student.lastName}, {student.firstName}
											</td>
											<td className="whitespace-nowrap px-6 py-4 text-sm">
												<input
													type="number"
													min="0"
													max="20"
													step="0.25"
													defaultValue={grades[student.id] || ""}
													className="input input-bordered input-sm w-24"
													{...register(`student_${student.id}`, {
														min: {
															value: 0,
															message: t("teacher.gradeEntry.validation.min"),
														},
														max: {
															value: 20,
															message: t("teacher.gradeEntry.validation.max"),
														},
													})}
													disabled={isExamLocked}
												/>
												{errors[`student_${student.id}`] && (
													<span className="ml-2 text-error-600 text-xs">
														{(errors[`student_${student.id}`] as any).message}
													</span>
												)}
											</td>
											<td className="whitespace-nowrap px-6 py-4 text-sm">
												{grades[student.id] !== undefined ? (
													<span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 font-medium text-green-800 text-xs">
														<Check className="mr-1 h-3 w-3" />
														{t("teacher.gradeEntry.status.graded")}
													</span>
												) : (
													<span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 font-medium text-gray-800 text-xs">
														{t("teacher.gradeEntry.status.notGraded")}
													</span>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						{!isExamLocked && (
							<div className="flex justify-end border-gray-200 border-t bg-gray-50 px-6 py-4">
								<button
									type="submit"
									disabled={isSaving}
									className="btn btn-primary"
								>
									{isSaving ? (
										<>
											<div className="mr-2 h-4 w-4 animate-spin rounded-full border-white border-t-2 border-b-2" />
											{t("teacher.gradeEntry.actions.saving")}
										</>
									) : (
										<>
											<Save className="mr-2 h-4 w-4" />{" "}
											{t("teacher.gradeEntry.actions.save")}
										</>
									)}
								</button>
							</div>
						)}
					</form>
				</div>
			) : selectedExam ? (
				<div className="rounded-xl bg-white p-8 text-center shadow-sm">
					<AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
					<h3 className="mt-4 font-medium text-gray-700 text-lg">
						{t("teacher.gradeEntry.emptyStudents.title")}
					</h3>
					<p className="mt-1 text-gray-500">
						{t("teacher.gradeEntry.emptyStudents.description")}
					</p>
				</div>
			) : null}
		</div>
	);
};

export default GradeEntry;
