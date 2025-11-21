import { BarChart3, LineChart } from "lucide-react";
import { useTranslation } from "react-i18next";

const PerformanceDashboard = () => {
        const { t } = useTranslation();

        const courses = [
                { name: "Mathematics", average: 15.2 },
                { name: "Physics", average: 13.5 },
                { name: "Chemistry", average: 14.1 },
        ];

        return (
                <div className="space-y-6">
                        <div>
                                <h1 className="font-semibold text-2xl text-gray-900">
                                        {t("student.performance.title")}
                                </h1>
                                <p className="text-gray-600">{t("student.performance.subtitle")}</p>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                                <div className="rounded-xl border bg-white p-6 shadow-sm">
                                        <div className="mb-4 flex items-center space-x-3">
                                                <LineChart className="h-6 w-6 text-primary-700" />
                                                <div>
                                                        <h2 className="font-semibold text-lg text-gray-900">
                                                                {t("student.performance.trendTitle")}
                                                        </h2>
                                                        <p className="text-gray-600 text-sm">
                                                                {t("student.performance.trendSubtitle")}
                                                        </p>
                                                </div>
                                        </div>
                                        <div className="space-y-2">
                                                <div className="flex items-center justify-between rounded-lg bg-primary-50 p-3">
                                                        <span className="font-medium text-primary-900">
                                                                {t("student.performance.overallAverage")}
                                                        </span>
                                                        <span className="font-semibold text-primary-900">14.6 / 20</span>
                                                </div>
                                                <div className="flex items-center justify-between rounded-lg bg-emerald-50 p-3">
                                                        <span className="font-medium text-emerald-900">
                                                                {t("student.performance.credits")}
                                                        </span>
                                                        <span className="font-semibold text-emerald-900">48 ECTS</span>
                                                </div>
                                        </div>
                                </div>
                                <div className="rounded-xl border bg-white p-6 shadow-sm">
                                        <div className="mb-4 flex items-center space-x-3">
                                                <BarChart3 className="h-6 w-6 text-primary-700" />
                                                <div>
                                                        <h2 className="font-semibold text-lg text-gray-900">
                                                                {t("student.performance.courseAverages")}
                                                        </h2>
                                                        <p className="text-gray-600 text-sm">
                                                                {t("student.performance.courseSubtitle")}
                                                        </p>
                                                </div>
                                        </div>
                                        <div className="space-y-2">
                                                {courses.map((course) => (
                                                        <div
                                                                key={course.name}
                                                                className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                                                        >
                                                                <span className="font-medium text-gray-900">{course.name}</span>
                                                                <span className="font-semibold text-gray-800">{course.average} / 20</span>
                                                        </div>
                                                ))}
                                        </div>
                                </div>
                        </div>
                </div>
        );
};

export default PerformanceDashboard;
