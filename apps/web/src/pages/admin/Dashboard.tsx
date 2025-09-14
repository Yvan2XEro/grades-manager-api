import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Users, BookOpen, GraduationCap, ClipboardCheck, 
  Building2, School, Calendar 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type StatCard = {
  title: string;
  count: number;
  icon: JSX.Element;
  color: string;
};

type ProgramStats = {
  name: string;
  students: number;
};

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<StatCard[]>([]);
  const [activeYear, setActiveYear] = useState<string>('');
  const [programStats, setProgramStats] = useState<ProgramStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        // Get counts from database
        const [
          facultiesResult,
          programsResult,
          coursesResult,
          examsResult,
          studentsResult,
          teachersResult,
          yearResult
        ] = await Promise.all([
          supabase.from('faculties').select('*', { count: 'exact', head: true }),
          supabase.from('programs').select('*', { count: 'exact', head: true }),
          supabase.from('courses').select('*', { count: 'exact', head: true }),
          supabase.from('exams').select('*', { count: 'exact', head: true }),
          supabase.from('students').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact' }).eq('role', 'teacher'),
          supabase.from('academic_years').select('*').eq('is_active', true).single(),
        ]);

        const facultiesCount = facultiesResult.count || 0;
        const programsCount = programsResult.count || 0;
        const coursesCount = coursesResult.count || 0;
        const examsCount = examsResult.count || 0;
        const studentsCount = studentsResult.count || 0;
        const teachersCount = teachersResult.count || 0;

        setActiveYear(yearResult.data?.name || 'No active year');

        // Set stats cards
        setStats([
          {
            title: 'Faculties',
            count: facultiesCount,
            icon: <Building2 className="h-8 w-8" />,
            color: 'bg-blue-100 text-blue-600',
          },
          {
            title: 'Programs',
            count: programsCount,
            icon: <School className="h-8 w-8" />,
            color: 'bg-purple-100 text-purple-600',
          },
          {
            title: 'Courses',
            count: coursesCount,
            icon: <BookOpen className="h-8 w-8" />,
            color: 'bg-emerald-100 text-emerald-600',
          },
          {
            title: 'Exams',
            count: examsCount,
            icon: <ClipboardCheck className="h-8 w-8" />,
            color: 'bg-amber-100 text-amber-600',
          },
          {
            title: 'Students',
            count: studentsCount,
            icon: <Users className="h-8 w-8" />,
            color: 'bg-rose-100 text-rose-600',
          },
          {
            title: 'Teachers',
            count: teachersCount,
            icon: <GraduationCap className="h-8 w-8" />,
            color: 'bg-indigo-100 text-indigo-600',
          },
        ]);

        // Get active year ID for program stats
        if (yearResult.data?.id) {
          const { data } = await supabase
            .from('programs')
            .select(`
              id, name,
              classes!inner(
                id,
                students!inner(id)
              )
            `)
            .eq('classes.academic_year_id', yearResult.data.id);

          if (data) {
            const programStats = data.map(program => ({
              name: program.name,
              students: program.classes.reduce((acc, cls) => acc + cls.students.length, 0)
            }));
            setProgramStats(programStats);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
        <div className="flex items-center bg-primary-50 rounded-lg px-4 py-2">
          <Calendar className="h-5 w-5 text-primary-700 mr-2" />
          <span className="text-sm font-medium text-primary-900">
            Active Year: {activeYear}
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
                <h3 className="text-lg font-medium text-gray-700">{stat.title}</h3>
                <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Program Stats */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Students per Program</h3>
        
        <div className="h-80">
          {programStats.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={programStats} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
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
              No program data available for the active academic year
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;