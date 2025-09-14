import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store';
import { BookOpen, Users, ClipboardList, Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';

type CourseInfo = {
  id: string;
  name: string;
  class_name: string;
  program_name: string;
  upcoming_exams: number;
  student_count: number;
};

type UpcomingExam = {
  id: string;
  name: string;
  date: string;
  percentage: number;
  course_name: string;
  class_name: string;
};

const TeacherDashboard: React.FC = () => {
  const { user } = useStore();
  const [courses, setCourses] = useState<CourseInfo[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<UpcomingExam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalClasses: 0,
    totalStudents: 0,
    totalExams: 0,
  });

  useEffect(() => {
    if (user) {
      fetchTeacherData();
    }
  }, [user]);

  const fetchTeacherData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Get active academic year
      const { data: yearData } = await supabase
        .from('academic_years')
        .select('*')
        .eq('is_active', true)
        .single();
      
      if (!yearData) {
        setIsLoading(false);
        return;
      }

      // Get teacher's courses with class info
      const { data: coursesData } = await supabase
        .from('class_courses')
        .select(`
          id,
          courses (id, name),
          classes (
            id, 
            name,
            program:programs(name),
            students:students(count)
          ),
          exams (id)
        `)
        .eq('teacher_id', user.id)
        .eq('classes.academic_year_id', yearData.id);
      
      // Format courses data
      if (coursesData) {
        const formattedCourses = coursesData.map(item => ({
          id: item.id,
          name: item.courses?.name || 'Unknown Course',
          class_name: item.classes?.name || 'Unknown Class',
          program_name: item.classes?.program?.name || 'Unknown Program',
          upcoming_exams: (item.exams?.length || 0),
          student_count: item.classes?.students?.[0]?.count || 0,
        }));
        
        setCourses(formattedCourses);
        
        // Calculate stats
        setStats({
          totalCourses: formattedCourses.length,
          totalClasses: new Set(formattedCourses.map(c => c.class_name)).size,
          totalStudents: formattedCourses.reduce((sum, c) => sum + c.student_count, 0),
          totalExams: formattedCourses.reduce((sum, c) => sum + c.upcoming_exams, 0),
        });
      }

      // Get upcoming exams
      const today = new Date();
      const { data: examsData } = await supabase
        .from('exams')
        .select(`
          id,
          name,
          date,
          percentage,
          class_course:class_courses (
            courses (name),
            classes (name)
          )
        `)
        .eq('class_course.teacher_id', user.id)
        .gte('date', today.toISOString())
        .order('date')
        .limit(5);
      
      if (examsData) {
        const formattedExams = examsData.map(exam => ({
          id: exam.id,
          name: exam.name,
          date: exam.date,
          percentage: exam.percentage,
          course_name: exam.class_course?.courses?.name || 'Unknown Course',
          class_name: exam.class_course?.classes?.name || 'Unknown Class',
        }));
        
        setUpcomingExams(formattedExams);
      }
    } catch (error) {
      console.error('Error fetching teacher data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Teacher Dashboard</h2>
        <p className="text-gray-600">Welcome back, {user?.firstName} {user?.lastName}</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 transition-all hover:shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">My Courses</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 transition-all hover:shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-emerald-100 text-emerald-600">
              <Users className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Classes</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.totalClasses}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 transition-all hover:shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <Users className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Students</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 transition-all hover:shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-amber-100 text-amber-600">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Exams</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.totalExams}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Courses */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-800">My Courses</h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {courses.length === 0 ? (
              <div className="p-6 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-700">No courses found</h3>
                <p className="mt-1 text-gray-500">You have no assigned courses for the active academic year.</p>
              </div>
            ) : (
              courses.map((course) => (
                <div key={course.id} className="p-4 hover:bg-gray-50">
                  <Link to={`/teacher/grades/${course.id}`} className="block">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-base font-medium text-gray-900">{course.name}</h4>
                        <p className="text-sm text-gray-600">
                          {course.class_name} • {course.program_name}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3 text-sm">
                        <span className="flex items-center text-gray-600">
                          <Users className="h-4 w-4 mr-1" />
                          {course.student_count}
                        </span>
                        <span className="flex items-center text-gray-600">
                          <ClipboardList className="h-4 w-4 mr-1" />
                          {course.upcoming_exams}
                        </span>
                        <span className="ml-2 text-primary-700 hover:text-primary-800 font-medium">
                          View &rarr;
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              ))
            )}
          </div>
          
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <Link to="/teacher/courses" className="text-primary-700 hover:text-primary-800 text-sm font-medium">
              View all courses &rarr;
            </Link>
          </div>
        </div>
        
        {/* Upcoming Exams */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-800">Upcoming Exams</h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {upcomingExams.length === 0 ? (
              <div className="p-6 text-center">
                <Calendar className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-700">No upcoming exams</h3>
                <p className="mt-1 text-gray-500">You have no scheduled exams coming up.</p>
              </div>
            ) : (
              upcomingExams.map((exam) => (
                <div key={exam.id} className="p-4 hover:bg-gray-50">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-medium text-gray-900">{exam.name}</h4>
                      <span className="text-sm px-2 py-1 bg-primary-50 text-primary-700 rounded-full">
                        {exam.percentage}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {exam.course_name} • {exam.class_name}
                    </p>
                    <div className="flex items-center mt-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{format(new Date(exam.date), 'MMMM d, yyyy')}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;