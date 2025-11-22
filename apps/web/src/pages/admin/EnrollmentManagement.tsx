import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, LockOpen, Unlock } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
        SelectValue,
} from "@/components/ui/select";
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

	const windowsQuery = useQuery(
		trpc.workflows.enrollmentWindows.queryOptions(),
	);

	const toggleWindow = useMutation({
		mutationFn: (action: "open" | "close") =>
			trpcClient.workflows.enrollmentWindow.mutate({
				classId: selectedClass,
				academicYearId: selectedAcademicYear,
				action,
			}),
		onSuccess: () => {
			toast.success(
				t("admin.enrollments.toast.updated", {
					defaultValue: "Window updated",
				}),
			);
			queryClient.invalidateQueries(
				trpc.workflows.enrollmentWindows.queryKey(),
			);
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
                                        <h1 className="font-semibold text-2xl text-gray-900">
                                                {t("admin.enrollments.title", {
							defaultValue: "Enrollment management",
						})}
					</h1>
                                        <p className="text-gray-600">
                                                {t("admin.enrollments.subtitle", {
                                                        defaultValue: "Monitor cohorts and control enrollment windows.",
                                                })}
                                        </p>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                        <Select
                                                value={selectedAcademicYear}
                                                onValueChange={(value) => {
                                                        setSelectedAcademicYear(value);
                                                        setSelectedClass("");
                                                }}
                                        >
                                                <SelectTrigger className="min-w-[200px]">
                                                        <SelectValue
                                                                placeholder={t("admin.enrollments.selectYear", {
                                                                        defaultValue: "Select academic year",
                                                                })}
                                                        />
                                                </SelectTrigger>
                                                <SelectContent>
                                                        {years?.items?.map((year) => (
                                                                <SelectItem key={year.id} value={year.id}>
                                                                        {year.name}
                                                                </SelectItem>
                                                        ))}
                                                </SelectContent>
                                        </Select>
                                        <Select
                                                value={selectedClass}
                                                onValueChange={(value) => setSelectedClass(value)}
                                                disabled={!selectedAcademicYear}
                                        >
                                                <SelectTrigger className="min-w-[200px]">
                                                        <SelectValue
                                                                placeholder={t("admin.enrollments.selectClass", {
                                                                        defaultValue: "Select class",
                                                                })}
                                                        />
                                                </SelectTrigger>
                                                <SelectContent>
                                                        {classes?.items?.map((klass) => (
                                                                <SelectItem key={klass.id} value={klass.id}>
                                                                        {klass.name}
                                                                </SelectItem>
                                                        ))}
                                                </SelectContent>
                                        </Select>
                                </div>
                        </div>

                        <Card>
                                <CardHeader className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center gap-3">
                                                <CalendarDays className="h-6 w-6 text-primary-700" />
                                                <div>
                                                        <p className="font-semibold text-gray-900">
                                                                {windowStatus
                                                                        ? t("admin.enrollments.windowStatus", {
                                                                                        defaultValue: "Window: {{status}}",
                                                                                        status: windowStatus.status,
                                                                                })
                                                                        : t("admin.enrollments.windowMissing", {
                                                                                        defaultValue: "Window not configured",
                                                                                })}
                                                        </p>
                                                        <p className="text-gray-600 text-sm">
                                                                {windowStatus?.status === "open"
                                                                        ? t("admin.enrollments.windowOpen", {
                                                                                        defaultValue: "Students can enroll.",
                                                                                })
                                                                        : t("admin.enrollments.windowClosed", {
                                                                                        defaultValue: "Window currently closed.",
                                                                                })}
                                                        </p>
                                                </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                                <Button
                                                        type="button"
                                                        onClick={() => toggleWindow.mutate("open")}
                                                        disabled={!selectedAcademicYear || !selectedClass}
                                                >
                                                        <Unlock className="mr-1 h-4 w-4" />
                                                        {t("admin.enrollments.actions.open", {
                                                                defaultValue: "Open window",
                                                        })}
                                                </Button>
                                                <Button
                                                        type="button"
                                                        variant="secondary"
                                                        onClick={() => toggleWindow.mutate("close")}
                                                        disabled={!selectedAcademicYear || !selectedClass}
                                                >
                                                        <LockOpen className="mr-1 h-4 w-4" />
                                                        {t("admin.enrollments.actions.close", {
                                                                defaultValue: "Close window",
                                                        })}
                                                </Button>
                                        </div>
                                </CardHeader>
                        </Card>

                        <Card>
                                <CardHeader className="pb-4">
                                        <CardTitle className="text-lg font-semibold text-gray-900">
                                                {t("admin.enrollments.listTitle", { defaultValue: "Enrollments" })}
                                        </CardTitle>
                                </CardHeader>
                                <CardContent>
                                        {enrollmentsQuery.isLoading ? (
                                                <p className="text-gray-500 text-sm">
                                                        {t("common.loading", { defaultValue: "Loading..." })}
                                                </p>
                                        ) : enrollments.length ? (
                                                <div className="overflow-x-auto">
                                                        <table className="min-w-full divide-y divide-gray-200">
                                                                <thead className="bg-gray-50">
                                                                        <tr>
                                                                                <th className="px-4 py-2 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">
                                                                                        {t("admin.enrollments.fields.student", {
                                                                                                defaultValue: "Student",
                                                                                        })}
                                                                                </th>
                                                                                <th className="px-4 py-2 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">
                                                                                        {t("admin.enrollments.fields.status", {
                                                                                                defaultValue: "Status",
                                                                                        })}
                                                                                </th>
                                                                                <th className="px-4 py-2 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">
                                                                                        {t("admin.enrollments.fields.dates", {
                                                                                                defaultValue: "Dates",
                                                                                        })}
                                                                                </th>
                                                                        </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-100">
                                                                        {enrollments.map((enrollment) => (
                                                                                <tr key={enrollment.id} className="text-gray-700 text-sm">
                                                                                        <td className="px-4 py-3">
                                                                                                {enrollment.studentId?.slice(0, 8)}
                                                                                        </td>
                                                                                        <td className="px-4 py-3 capitalize">
                                                                                                {enrollment.status}
                                                                                        </td>
                                                                                        <td className="px-4 py-3 text-gray-500 text-xs">
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
                                                <p className="text-gray-500 text-sm">
                                                        {t("admin.enrollments.empty", {
                                                                defaultValue: "No enrollments for this selection.",
                                                        })}
                                                </p>
                                        )}
                                </CardContent>
                        </Card>

                        {user?.permissions?.canManageStudents && (
                                <Card>
                                        <CardHeader className="pb-2">
                                                <CardTitle className="text-lg font-semibold text-gray-900">
                                                        {t("admin.enrollments.actions.title", {
                                                                defaultValue: "Manual adjustments",
                                                        })}
                                                </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                                <p className="text-gray-600 text-sm">
                                                        {t("admin.enrollments.actions.description", {
                                                                defaultValue:
                                                                        "Use the student management page to transfer or re-enroll students between classes.",
                                                        })}
                                                </p>
                                        </CardContent>
                                </Card>
                        )}
                </div>
        );
};

export default EnrollmentManagement;
