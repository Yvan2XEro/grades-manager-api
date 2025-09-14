import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Download, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

/**
 * Grade Export page component.
 * Allows administrators to export student grades by class and courses.
 */
export default function GradeExport() {
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedExams, setSelectedExams] = useState<string[]>([]);

  // Fetch academic years
  const { data: academicYears } = useQuery({
    queryKey: ['academicYears'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch classes for selected year
  const { data: classes } = useQuery({
    queryKey: ['classes', selectedYear],
    queryFn: async () => {
      if (!selectedYear) return [];

      const { data, error } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          program:programs(name)
        `)
        .eq('academic_year_id', selectedYear)
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!selectedYear,
  });

  // Fetch exams for selected class
  const { data: exams } = useQuery({
    queryKey: ['exams', selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];

      const { data, error } = await supabase
        .from('class_courses')
        .select(`
          id,
          course:courses(name),
          exams!inner (
            id,
            name,
            date,
            percentage
          )
        `)
        .eq('class_id', selectedClass)
        .order('course(name)');

      if (error) throw error;

      // Transform the data to a flatter structure
      return data.flatMap(cc => 
        cc.exams.map(exam => ({
          id: exam.id,
          name: exam.name,
          date: exam.date,
          percentage: exam.percentage,
          courseName: cc.course?.name || 'Unknown Course'
        }))
      ).sort((a, b) => a.courseName.localeCompare(b.courseName));
    },
    enabled: !!selectedClass,
  });

  /**
   * Handles the export of grades to Excel.
   * Fetches student data, calculates averages, and generates the export file.
   */
  const handleExport = async () => {
    if (!selectedClass || selectedExams.length === 0) return;

    try {
      // Fetch students with their grades
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          first_name,
          last_name,
          registration_number,
          birth_date,
          birth_place,
          gender,
          grades!inner(
            score,
            exam:exams!inner(
              id,
              class_course:class_courses!inner(
                course:courses(name)
              )
            )
          )
        `)
        .eq('class_id', selectedClass)
        .order('last_name');

      if (studentsError) throw studentsError;

      // Transform data for export
      const exportData = students.map(student => {
        // Calculate average grades for each course
        const courseGrades = new Map<string, number[]>();
        
        student.grades.forEach(grade => {
          const courseName = grade.exam.class_course.course.name;
          if (!courseGrades.has(courseName)) {
            courseGrades.set(courseName, []);
          }
          if (selectedExams.includes(grade.exam.id)) {
            courseGrades.get(courseName)?.push(grade.score);
          }
        });

        // Calculate averages
        const courseAverages = new Map<string, number>();
        courseGrades.forEach((grades, course) => {
          if (grades.length > 0) {
            const average = grades.reduce((a, b) => a + b, 0) / grades.length;
            courseAverages.set(course, Number(average.toFixed(2)));
          }
        });

        // Create export row
        return {
          'Last Name': student.last_name,
          'First Name': student.first_name,
          'Registration Number': student.registration_number,
          'Birth Date': student.birth_date ? format(new Date(student.birth_date), 'dd/MM/yyyy') : '',
          'Birth Place': student.birth_place || '',
          'Gender': student.gender || '',
          ...Object.fromEntries(courseAverages)
        };
      });

      // Create and download Excel file
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Grades');

      // Generate filename
      const className = classes?.find(c => c.id === selectedClass)?.name;
      const filename = `grades_${className}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;

      XLSX.writeFile(wb, filename);
    } catch (error: any) {
      console.error('Export error:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Grade Export</h2>
        <p className="text-gray-600">Export student grades by class and courses</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Academic Year Selection */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">Academic Year</span>
          </label>
          <select
            className="select select-bordered"
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(e.target.value);
              setSelectedClass('');
              setSelectedExams([]);
            }}
          >
            <option value="">Select academic year</option>
            {academicYears?.map((year) => (
              <option key={year.id} value={year.id}>
                {year.name}
              </option>
            ))}
          </select>
        </div>

        {/* Class Selection */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">Class</span>
          </label>
          <select
            className="select select-bordered"
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setSelectedExams([]);
            }}
            disabled={!selectedYear}
          >
            <option value="">Select class</option>
            {classes?.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} - {cls.program.name}
              </option>
            ))}
          </select>
        </div>

        {/* Export Button */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">Export</span>
          </label>
          <button
            onClick={handleExport}
            disabled={!selectedClass || selectedExams.length === 0}
            className="btn btn-primary"
          >
            <Download className="h-5 w-5 mr-2" />
            Export Grades
          </button>
        </div>
      </div>

      {/* Course Selection */}
      {exams && exams.length > 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">Select Exams to Include</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {exams.map((exam) => (
              <label key={exam.id} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={selectedExams.includes(exam.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedExams([...selectedExams, exam.id]);
                    } else {
                      setSelectedExams(selectedExams.filter(id => id !== exam.id));
                    }
                  }}
                />
                <span>
                  {exam.courseName} - {exam.name}
                  <div className="text-sm text-gray-500">
                    {format(new Date(exam.date), 'MMM d, yyyy')} ({exam.percentage}%)
                  </div>
                </span>
              </label>
            ))}
          </div>
        </div>
      ) : selectedClass ? (
        <div className="bg-white rounded-lg p-8 text-center">
          <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No exams found</h3>
          <p className="mt-1 text-sm text-gray-500">
            There are no exams created for this class yet.
          </p>
        </div>
      ) : null}
    </div>
  );
}