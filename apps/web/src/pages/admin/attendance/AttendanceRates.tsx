import { useQuery } from "@tanstack/react-query";
import { BarChart3, Download } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { Button } from "../../../components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "../../../components/ui/empty";
import { Label } from "../../../components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../components/ui/select";
import { trpc, trpcClient } from "../../../utils/trpc";

type ClassCourse = {
	id: string;
	code: string;
	courseRef: { name: string } | null;
	classRef: { name: string } | null;
};

export default function AttendanceRates() {
	const { t } = useTranslation();
	const [academicYearId, setAcademicYearId] = useState<string | null>(null);
	const [classCourseId, setClassCourseId] = useState<string | null>(null);

	const { data: classCoursesData } = useQuery({
		queryKey: ["classCourses-for-attendance-rates", academicYearId],
		queryFn: async () => {
			const { items } = await trpcClient.classCourses.list.query({
				...(academicYearId ? { academicYearId } : {}),
				limit: 500,
			});
			return items as ClassCourse[];
		},
	});

	const ratesQuery = useQuery({
		...trpc.attendance.getAttendanceRates.queryOptions({
			classCourseId: classCourseId ?? "",
			...(academicYearId ? { academicYearId } : {}),
		}),
		enabled: !!classCourseId,
	});

	// Fetch student profiles for display
	const studentsQuery = useQuery({
		queryKey: ["students-for-rates", classCourseId],
		queryFn: async () => {
			if (!classCourseId) return [];
			return trpcClient.attendance.getRoster.query({ classCourseId });
		},
		enabled: !!classCourseId,
	});

	const classCourses = classCoursesData ?? [];
	const rates = ratesQuery.data;
	const roster = studentsQuery.data ?? [];

	// Build studentId → name map
	const studentNames = new Map(
		roster.map((r) => [
			r.studentId,
			r.student?.profile
				? `${r.student.profile.firstName} ${r.student.profile.lastName}`
				: r.studentId,
		]),
	);
	const studentNumbers = new Map(
		roster.map((r) => [r.studentId, r.student?.registrationNumber ?? ""]),
	);

	function handleExport() {
		if (!rates) return;
		const rows = rates.students.map((s) => ({
			[t("attendanceRates.regNumber")]:
				studentNumbers.get(s.studentId) ?? s.studentId,
			[t("attendanceRates.name")]: studentNames.get(s.studentId) ?? s.studentId,
			[t("attendanceRates.present")]: s.present,
			[t("attendanceRates.late")]: s.late,
			[t("attendanceRates.absent")]: s.absent,
			[t("attendanceRates.excused")]: s.excused,
			[t("attendanceRates.totalSessions")]: s.totalSessions,
			[t("attendanceRates.ratePercent")]: s.rate,
		}));
		const ws = XLSX.utils.json_to_sheet(rows);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, t("attendanceRates.title"));
		XLSX.writeFile(wb, "taux-presence.xlsx");
	}

	const courseLabel =
		classCourses.find((c) => c.id === classCourseId)?.courseRef?.name ?? "";

	return (
		<div className="p-6">
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h1 className="font-semibold text-xl">
						{t("attendanceRates.title")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{t("attendanceRates.subtitle")}
					</p>
				</div>
				{rates && rates.students.length > 0 && (
					<Button variant="outline" size="sm" onClick={handleExport}>
						<Download className="mr-1.5 h-4 w-4" />
						{t("attendanceRates.export")}
					</Button>
				)}
			</div>

			<div className="mb-6 flex flex-wrap gap-4">
				<div className="w-64">
					<Label className="mb-1.5 block text-xs">
						{t("teacher.attendanceManagement.filterByYear")}
					</Label>
					<AcademicYearSelect
						value={academicYearId}
						onChange={(v) => {
							setAcademicYearId(v);
							setClassCourseId(null);
						}}
					/>
				</div>
				<div className="w-72">
					<Label className="mb-1.5 block text-xs">
						{t("teacher.attendanceManagement.filterByCourse")}
					</Label>
					<Select
						value={classCourseId ?? ""}
						onValueChange={(v) => setClassCourseId(v || null)}
					>
						<SelectTrigger>
							<SelectValue
								placeholder={t("teacher.attendanceManagement.filterByCourse")}
							/>
						</SelectTrigger>
						<SelectContent>
							{classCourses.map((cc) => (
								<SelectItem key={cc.id} value={cc.id}>
									{cc.courseRef?.name ?? cc.code}
									{cc.classRef && (
										<span className="ml-1 text-muted-foreground text-xs">
											— {cc.classRef.name}
										</span>
									)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{!classCourseId ? (
				<Empty>
					<EmptyHeader>
						<BarChart3 className="h-8 w-8 text-muted-foreground/40" />
					</EmptyHeader>
					<EmptyTitle>{t("attendanceRates.title")}</EmptyTitle>
					<EmptyDescription>{t("attendanceRates.empty")}</EmptyDescription>
				</Empty>
			) : ratesQuery.isPending ? (
				<p className="text-muted-foreground text-sm">…</p>
			) : !rates || rates.students.length === 0 ? (
				<Empty>
					<EmptyHeader>
						<BarChart3 className="h-8 w-8 text-muted-foreground/40" />
					</EmptyHeader>
					<EmptyTitle>{t("attendanceRates.title")}</EmptyTitle>
					<EmptyDescription>{t("attendanceRates.noData")}</EmptyDescription>
				</Empty>
			) : (
				<>
					<p className="mb-3 text-muted-foreground text-sm">
						{courseLabel} — {rates.totalSessions}{" "}
						{t("attendanceRates.sessions")}
					</p>
					<div className="overflow-hidden rounded-md border">
						<table className="w-full text-sm">
							<thead className="bg-muted/50">
								<tr>
									<th className="px-4 py-2 text-left font-medium">
										{t("attendanceRates.student")}
									</th>
									<th className="px-4 py-2 text-left font-medium">
										{t("attendanceRates.regNumber")}
									</th>
									<th className="px-4 py-2 text-center font-medium text-green-700">
										{t("teacher.attendanceManagement.status.present")}
									</th>
									<th className="px-4 py-2 text-center font-medium text-yellow-700">
										{t("teacher.attendanceManagement.status.late")}
									</th>
									<th className="px-4 py-2 text-center font-medium text-red-700">
										{t("teacher.attendanceManagement.status.absent")}
									</th>
									<th className="px-4 py-2 text-center font-medium text-blue-700">
										{t("teacher.attendanceManagement.status.excused")}
									</th>
									<th className="px-4 py-2 text-center font-medium">
										{t("attendanceRates.rate")}
									</th>
								</tr>
							</thead>
							<tbody>
								{[...rates.students]
									.sort((a, b) => b.rate - a.rate)
									.map((s, i) => (
										<tr
											key={s.studentId}
											className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}
										>
											<td className="px-4 py-2 font-medium">
												{studentNames.get(s.studentId) ?? s.studentId}
											</td>
											<td className="px-4 py-2 text-muted-foreground text-xs">
												{studentNumbers.get(s.studentId) ?? "—"}
											</td>
											<td className="px-4 py-2 text-center">{s.present}</td>
											<td className="px-4 py-2 text-center">{s.late}</td>
											<td className="px-4 py-2 text-center">{s.absent}</td>
											<td className="px-4 py-2 text-center">{s.excused}</td>
											<td className="px-4 py-2 text-center">
												<span
													className={`font-semibold ${
														s.rate >= 75
															? "text-green-700"
															: s.rate >= 50
																? "text-yellow-700"
																: "text-red-700"
													}`}
												>
													{s.rate}%
												</span>
											</td>
										</tr>
									))}
							</tbody>
						</table>
					</div>
				</>
			)}
		</div>
	);
}
