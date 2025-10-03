import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { trpcClient } from "../../utils/trpc";
import {
  Users,
  BookOpen,
  GraduationCap,
  ClipboardCheck,
  Building2,
  School,
  Calendar,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type StatCard = {
  key: "faculties" | "programs" | "courses" | "exams" | "students" | "teachers";
  count: number;
  icon: JSX.Element;
  color: string;
};

type ProgramStats = {
  name: string;
  students: number;
};

const AdminDashboard: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["adminDashboard"],
    queryFn: async () => {
      const [
        facultiesRes,
        programsRes,
        coursesRes,
        examsRes,
        studentsRes,
        yearsRes,
      ] = await Promise.all([
        trpcClient.faculties.list.query({}),
        trpcClient.programs.list.query({}),
        trpcClient.courses.list.query({}),
        trpcClient.exams.list.query({}),
        trpcClient.students.list.query({}),
        trpcClient.academicYears.list.query({}),
      ]);

      const programs = programsRes.items;
      const facultiesCount = facultiesRes.items.length;
      const programsCount = programs.length;
      const coursesCount = coursesRes.items.length;
      const examsCount = examsRes.items.length;
      const studentsCount = studentsRes.items.length;
      const teachersCount = 0;

      const activeYear = yearsRes.items.find((y) => y.isActive);

      const programStats: ProgramStats[] = activeYear
        ? await Promise.all(
          programs.map(async (program) => {
            const { items: classes } = await trpcClient.classes.list.query({
              programId: program.id,
              academicYearId: activeYear.id,
            });
            let total = 0;
            for (const cls of classes) {
              const { items: studs } = await trpcClient.students.list.query({
                classId: cls.id,
              });
              total += studs.length;
            }
            return { name: program.name, students: total };
          }),
        )
        : [];

      const stats: StatCard[] = [
        {
          key: "faculties",
          count: facultiesCount,
          icon: <Building2 className="h-8 w-8" />,
          color: "bg-blue-100 text-blue-600",
        },
        {
          key: "programs",
          count: programsCount,
          icon: <School className="h-8 w-8" />,
          color: "bg-purple-100 text-purple-600",
        },
        {
          key: "courses",
          count: coursesCount,
          icon: <BookOpen className="h-8 w-8" />,
          color: "bg-emerald-100 text-emerald-600",
        },
        {
          key: "exams",
          count: examsCount,
          icon: <ClipboardCheck className="h-8 w-8" />,
          color: "bg-amber-100 text-amber-600",
        },
        {
          key: "students",
          count: studentsCount,
          icon: <Users className="h-8 w-8" />,
          color: "bg-rose-100 text-rose-600",
        },
        {
          key: "teachers",
          count: teachersCount,
          icon: <GraduationCap className="h-8 w-8" />,
          color: "bg-indigo-100 text-indigo-600",
        },
      ];

      return {
        stats,
        activeYear: activeYear?.name,
        programStats,
      };
    },
  });

  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600" />
      </div>
    );
  }

  const stats = data?.stats || [];
  const programStats = data?.programStats ?? [];
  const activeYear = data?.activeYear ?? t("admin.dashboard.noActiveYear");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">
          {t("admin.dashboard.title")}
        </h2>
        <div className="flex items-center bg-primary-50 rounded-lg px-4 py-2">
          <Calendar className="h-5 w-5 text-primary-700 mr-2" />
          <span className="text-sm font-medium text-primary-900">
            {t("admin.dashboard.activeYear", { year: activeYear })}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm p-6 transition-all hover:shadow-md"
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${stat.color}`}>
                {stat.icon}
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-700">
                  {t(`admin.dashboard.stats.${stat.key}`)}
                </h3>
                <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Program Stats */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          {t("admin.dashboard.programStats.title")}
        </h3>

        <div className="h-80">
          {programStats.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={programStats}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="students" fill="#3730A3" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              {t("admin.dashboard.programStats.empty")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
