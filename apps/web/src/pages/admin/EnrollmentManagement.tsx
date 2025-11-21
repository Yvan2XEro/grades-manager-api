import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, LockOpen, Unlock } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useStore } from "../../store";
import { trpc, trpcClient } from "../../utils/trpc";

const EnrollmentManagement = () => {
	const { t } = useTranslation();
	const { user } = useStore();
	const queryClient = useQueryClient();
	const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("");
	const [selectedClass, setSelectedClass] = useState<string>("");

	const { data: years } = useQuery(
		trpc.academicYears.list.queryOptions({ limit: 100 }),
	);

	const { data: classes } = useQuery(
		trpc.classes.list.queryOptions({
			academicYearId: selectedAcademicYear || undefined,
			limit: 200,
		}),
	);

	const enrollmentsQuery = useQuery({
		...trpc.enrollments.list.queryOptions({
			classId: selectedClass || undefined,
			academicYearId: selectedAcademicYear || undefined,
			limit: 200,
		}),
		enabled: Boolean(selectedAcademicYear && selectedClass),
	});

	const windowsQuery = useQuery(trpc.workflows.enrollmentWindows.queryOptions());

	const toggleWindow = useMutation({
		mutationFn: (action: "open" | "close") =>
			trpcClient.workflows.enrollmentWindow.mutate({
				classId: selectedClass,
				academicYearId: selectedAcademicYear,
				action,
			}),
		onSuccess: () => {
			toast.success(t("admin.enrollments.toast.updated", { defaultValue: "Window updated" }));
			queryClient.invalidateQueries(trpc.workflows.enrollmentWindows.queryKey());
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const enrollments = enrollmentsQuery.data?.items ?? [];
	const windowStatus = useMemo(() => {
		if (!selectedClass || !selectedAcademicYear) return null;
		return windowsQuery.data?.find(
			(entry) =>
				entry.classId === selectedClass &&
				entry.academicYearId === selectedAcademicYear,
		);
	}, [windowsQuery.data, selectedAcademicYear, selectedClass]);

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold text-gray-900">
						{t("admin.enrollments.title", { defaultValue: "Enrollment management" })}
					</h1>
					<p className="text-gray-600">
						{t("admin.enrollments.subtitle", {
							defaultValue: "Monitor cohorts and control enrollment windows.",
						})}
					</p>
				</div>
				<div className="flex gap-3">
					<select
						className="rounded-lg border px-3 py-2"
						value={selectedAcademicYear}
						onChange={(event) => {
							setSelectedAcademicYear(event.target.value);
							setSelectedClass("");
						}}
					>
						<option value="">
							{t("admin.enrollments.selectYear", { defaultValue: "Select academic year" })}
						</option>
						{years?.items?.map((year) => (
							<option key={year.id} value={year.id}>
								{year.name}
							</option>
						))}
					</select>
					<select
						className="rounded-lg border px-3 py-2"
						value={selectedClass}
						onChange={(event) => setSelectedClass(event.target.value)}
						disabled={!selectedAcademicYear}
					>
						<option value="">
							{t("admin.enrollments.selectClass", { defaultValue: "Select class" })}
						</option>
						{classes?.items?.map((klass) => (
							<option key={klass.id} value={klass.id}>
								{klass.name}
							</option>
						))}
					</select>
				</div>
			</div>

			<div className="rounded-xl border bg-white p-6 shadow-sm">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center space-x-3">
						<CalendarDays className="h-6 w-6 text-primary-700" />
						<div>
							<p className="font-semibold text-gray-900">
								{windowStatus
									? t("admin.enrollments.windowStatus", {
											defaultValue: "Window: {{status}}",
											status: windowStatus.status,
									  })
									: t("admin.enrollments.windowMissing", { defaultValue: "Window not configured" })}
							</p>
							<p className="text-sm text-gray-600">
								{windowStatus?.status === "open"
									? t("admin.enrollments.windowOpen", { defaultValue: "Students can enroll." })
									: t("admin.enrollments.windowClosed", { defaultValue: "Window currently closed." })}
							</p>
						</div>
					</div>
					<div className="flex gap-2">
						<button
							type="button"
							className="flex items-center rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
							onClick={() => toggleWindow.mutate("open")}
							disabled={!selectedAcademicYear || !selectedClass}
						>
							<Unlock className="mr-1 h-4 w-4" />
							{t("admin.enrollments.actions.open", { defaultValue: "Open window" })}
						</button>
						<button
							type="button"
							className="flex items-center rounded-lg bg-gray-200 px-3 py-2 text-sm font-medium text-gray-800 disabled:opacity-50"
							onClick={() => toggleWindow.mutate("close")}
							disabled={!selectedAcademicYear || !selectedClass}
						>
							<LockOpen className="mr-1 h-4 w-4" />
							{t("admin.enrollments.actions.close", { defaultValue: "Close window" })}
						</button>
					</div>
				</div>
			</div>

			<div className="rounded-xl border bg-white p-6 shadow-sm">
				<h2 className="text-lg font-semibold text-gray-900">
					{t("admin.enrollments.listTitle", { defaultValue: "Enrollments" })}
				</h2>
				{enrollmentsQuery.isLoading ? (
					<p className="text-sm text-gray-500">
						{t("common.loading", { defaultValue: "Loading..." })}
					</p>
				) : enrollments.length ? (
					<div className="mt-4 overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
										{t("admin.enrollments.fields.student", { defaultValue: "Student" })}
									</th>
									<th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
										{t("admin.enrollments.fields.status", { defaultValue: "Status" })}
									</th>
									<th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
										{t("admin.enrollments.fields.dates", { defaultValue: "Dates" })}
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-100">
								{enrollments.map((enrollment) => (
									<tr key={enrollment.id} className="text-sm text-gray-700">
										<td className="px-4 py-3">
											{enrollment.studentId?.slice(0, 8)}
										</td>
										<td className="px-4 py-3 capitalize">{enrollment.status}</td>
										<td className="px-4 py-3 text-xs text-gray-500">
											{enrollment.enrolledAt
												? new Date(enrollment.enrolledAt).toLocaleDateString()
												: "—"}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<p className="mt-4 text-sm text-gray-500">
						{t("admin.enrollments.empty", { defaultValue: "No enrollments for this selection." })}
					</p>
				)}
			</div>

			{user?.permissions?.canManageStudents && (
				<div className="rounded-xl border bg-white p-6 shadow-sm">
					<h2 className="text-lg font-semibold text-gray-900">
						{t("admin.enrollments.actions.title", { defaultValue: "Manual adjustments" })}
					</h2>
					<p className="mt-2 text-sm text-gray-600">
						{t("admin.enrollments.actions.description", {
							defaultValue: "Use the student management page to transfer or re-enroll students between classes.",
						})}
					</p>
				</div>
			)}
		</div>
	);
};

export default EnrollmentManagement;
