import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useStore } from "../../store";
import { useForm } from "react-hook-form";
import {
  ArrowLeft,
  Save,
  Lock,
  AlertTriangle,
  Info,
  Check,
} from "lucide-react";
import { toast } from "sonner";

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  registration_number: string;
};

type Exam = {
  id: string;
  name: string;
  type: string;
  date: string;
  percentage: number;
  is_locked: boolean;
};

type Grade = {
  id?: string;
  student_id: string;
  exam_id: string;
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
      setIsExamLocked(exam?.is_locked || false);

      // Reset form when exam changes
      reset();
    }
  }, [selectedExam, exams, reset]);

  const fetchCourseData = async () => {
    if (!user || !courseId) return;

    setIsLoading(true);
    try {
      // Fetch course info
      const { data: courseData, error: courseError } = await supabase
        .from("class_courses")
        .select(
          `
          courses (id, name),
          classes (id, name, program:programs(name))
        `,
        )
        .eq("id", courseId)
        .single();

      if (courseError) throw courseError;

      if (courseData) {
        setCourseInfo({
          course_name: courseData.courses?.name || "Unknown Course",
          class_name: courseData.classes?.name || "Unknown Class",
          program_name: courseData.classes?.program?.name || "Unknown Program",
        });

        // Fetch students in this class
        const { data: studentsData, error: studentsError } = await supabase
          .from("students")
          .select("*")
          .eq("class_id", courseData.classes?.id)
          .order("last_name", { ascending: true });

        if (studentsError) throw studentsError;
        setStudents(studentsData || []);

        // Fetch exams for this course
        const { data: examsData, error: examsError } = await supabase
          .from("exams")
          .select("*")
          .eq("class_course_id", courseId)
          .order("date", { ascending: true });

        if (examsError) throw examsError;
        setExams(examsData || []);

        // Set first exam as selected by default
        if (examsData && examsData.length > 0) {
          setSelectedExam(examsData[0].id);
        }
      }
    } catch (error: any) {
      console.error("Error fetching course data:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGrades = async (examId: string) => {
    if (!examId) return;

    try {
      const { data, error } = await supabase
        .from("grades")
        .select("*")
        .eq("exam_id", examId);

      if (error) throw error;

      // Convert to record format for easier access
      const gradesRecord: Record<string, number> = {};
      if (data) {
        data.forEach((grade) => {
          gradesRecord[grade.student_id] = grade.score;
        });
      }

      setGrades(gradesRecord);

      // Reset form with new grades
      const formData: Record<string, any> = {};
      data?.forEach((grade) => {
        formData[`student_${grade.student_id}`] = grade.score;
      });
      reset(formData);
    } catch (error: any) {
      console.error("Error fetching grades:", error);
      toast.error(`Error: ${error.message}`);
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
      const gradesToUpsert: Grade[] = [];

      for (const studentId in data) {
        if (studentId.startsWith("student_")) {
          const actualStudentId = studentId.replace("student_", "");
          const score = parseFloat(data[studentId]);

          if (!isNaN(score) && score >= 0 && score <= 20) {
            gradesToUpsert.push({
              student_id: actualStudentId,
              exam_id: selectedExam,
              score,
            });
          }
        }
      }

      // Upsert grades
      if (gradesToUpsert.length > 0) {
        const { error } = await supabase
          .from("grades")
          .upsert(gradesToUpsert, { onConflict: "student_id,exam_id" });

        if (error) throw error;

        toast.success("Grades saved successfully");
        fetchGrades(selectedExam);
      }
    } catch (error: any) {
      console.error("Error saving grades:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const lockExam = async () => {
    if (!selectedExam) return;

    try {
      const { error } = await supabase
        .from("exams")
        .update({ is_locked: true })
        .eq("id", selectedExam);

      if (error) throw error;

      setIsExamLocked(true);
      toast.success(
        "Exam locked successfully. Grades can no longer be modified.",
      );

      // Update exams list
      setExams(
        exams.map((exam) =>
          exam.id === selectedExam ? { ...exam, is_locked: true } : exam,
        ),
      );
    } catch (error: any) {
      console.error("Error locking exam:", error);
      toast.error(`Error: ${error.message}`);
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
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Grade Entry</h2>
          {courseInfo && (
            <p className="text-gray-600">
              {courseInfo.course_name} • {courseInfo.class_name} •{" "}
              {courseInfo.program_name}
            </p>
          )}
        </div>
      </div>

      {/* Select Exam */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
          <div className="w-full md:w-1/3">
            <label
              htmlFor="exam"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Select Exam
            </label>
            <select
              id="exam"
              value={selectedExam}
              onChange={handleExamChange}
              className="select select-bordered w-full"
              disabled={exams.length === 0}
            >
              {exams.length === 0 ? (
                <option value="">No exams available</option>
              ) : (
                exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.name} ({exam.percentage}%){" "}
                    {exam.is_locked ? "(Locked)" : ""}
                  </option>
                ))
              )}
            </select>
          </div>

          {selectedExam && (
            <div className="flex items-center space-x-3">
              {isExamLocked ? (
                <div className="flex items-center text-gray-600 bg-gray-100 px-3 py-2 rounded-md">
                  <Lock className="h-4 w-4 mr-2" />
                  <span>Grades locked</span>
                </div>
              ) : (
                <button
                  onClick={lockExam}
                  className="btn btn-outline btn-warning"
                >
                  <Lock className="h-4 w-4 mr-2" /> Lock Grades
                </button>
              )}
            </div>
          )}
        </div>

        {selectedExam && exams.length > 0 && (
          <div className="mt-4 flex items-start p-4 bg-blue-50 text-blue-800 rounded-lg">
            <Info className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Grading Information</p>
              <p className="text-sm">
                Grades should be entered on a scale of 0-20. Once grades are
                locked, they cannot be modified. Please review carefully before
                locking.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Grade Entry Table */}
      {selectedExam && students.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registration #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score (0-20)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.registration_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.last_name}, {student.first_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="0.25"
                          defaultValue={grades[student.id] || ""}
                          className="input input-bordered input-sm w-24"
                          {...register(`student_${student.id}`, {
                            min: { value: 0, message: "Min 0" },
                            max: { value: 20, message: "Max 20" },
                          })}
                          disabled={isExamLocked}
                        />
                        {errors[`student_${student.id}`] && (
                          <span className="text-xs text-error-600 ml-2">
                            {(errors[`student_${student.id}`] as any).message}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {grades[student.id] !== undefined ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Check className="h-3 w-3 mr-1" /> Graded
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Not graded
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!isExamLocked && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-primary"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" /> Save Grades
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      ) : selectedExam ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-amber-500" />
          <h3 className="mt-4 text-lg font-medium text-gray-700">
            No students found
          </h3>
          <p className="mt-1 text-gray-500">
            There are no students enrolled in this class.
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default GradeEntry;
