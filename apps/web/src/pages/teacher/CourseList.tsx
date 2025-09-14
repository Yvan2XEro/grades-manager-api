import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store';
import { BookOpen, Users, ClipboardList } from 'lucide-react';

interface Course {
  id: string;
  name: string;
  class_name: string;
  program_name: string;
  student_count: number;
  exam_count: number;
}

export default function CourseList() {
  const { user } = useStore();

  const { data: courses, isLoading } = useQuery({
    queryKey: ['teacherCourses'],
    queryFn: async () => {
      const { data: yearData } = await supabase
        .from('academic_years')
        .select('*')
        .eq('is_active', true)
        .single();

      if (!yearData) return [];

      const { data, error } = await supabase
        .from('class_courses')
        .select(`
          id,
          courses (name),
          classes!inner (
            name,
            program:programs(name),
            students(id),
            academic_year_id
          ),
          exams(id)
        `)
        .eq('teacher_id', user?.id)
        .eq('classes.academic_year_id', yearData.id);

      if (error) throw error;

      return data?.map(item => ({
        id: item.id,
        name: item.courses?.name || 'Unknown Course',
        class_name: item.classes?.name || 'Unknown Class',
        program_name: item.classes?.program?.name || 'Unknown Program',
        student_count: item.classes?.students?.length || 0,
        exam_count: item.exams?.length || 0,
      })) as Course[];
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">My Courses</h2>
        <p className="text-base-content/60">Manage your assigned courses and grades</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses?.map((course) => (
          <Link
            key={course.id}
            to={`/teacher/grades/${course.id}`}
            className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow"
          >
            <div className="card-body">
              <h3 className="card-title">{course.name}</h3>
              <p className="text-base-content/60">
                {course.class_name} • {course.program_name}
              </p>
              
              <div className="card-actions justify-between items-center mt-4">
                <div className="flex gap-4">
                  <div className="flex items-center gap-1 text-base-content/70">
                    <Users className="h-4 w-4" />
                    <span>{course.student_count}</span>
                  </div>
                  <div className="flex items-center gap-1 text-base-content/70">
                    <ClipboardList className="h-4 w-4" />
                    <span>{course.exam_count}</span>
                  </div>
                </div>
                <button className="btn btn-primary btn-sm">
                  View Grades
                </button>
              </div>
            </div>
          </Link>
        ))}

        {courses?.length === 0 && (
          <div className="col-span-full card bg-base-100 shadow-xl">
            <div className="card-body items-center text-center py-12">
              <BookOpen className="w-16 h-16 text-base-content/20" />
              <h3 className="text-xl font-bold mt-4">No Courses Assigned</h3>
              <p className="text-base-content/60">
                You don't have any courses assigned for the active academic year.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}