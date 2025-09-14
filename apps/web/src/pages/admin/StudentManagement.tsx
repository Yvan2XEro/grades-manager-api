import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { ArrowRight, Check, Users } from "lucide-react";
import { toast } from "sonner";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  registration_number: string;
  grades: {
    score: number;
    exams: {
      percentage: number;
      class_course: {
        course: {
          name: string;
        };
      };
    };
  }[];
}

interface Class {
  id: string;
  name: string;
  program: {
    name: string;
  };
}

export default function StudentPromotion() {
  const [sourceClass, setSourceClass] = useState<string>("");
  const [targetClass, setTargetClass] = useState<string>("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isPromoting, setIsPromoting] = useState(false);

  // Get active academic year
  const { data: activeYear } = useQuery({
    queryKey: ["activeYear"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_years")
        .select("*")
        .eq("is_active", true)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Get previous academic year
  const { data: previousYear } = useQuery({
    queryKey: ["previousYear", activeYear?.start_date],
    queryFn: async () => {
      if (!activeYear) return null;

      const { data, error } = await supabase
        .from("academic_years")
        .select("*")
        .lt("start_date", activeYear.start_date)
        .order("start_date", { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!activeYear,
  });

  // Get source classes (from previous year)
  const { data: sourceClasses } = useQuery({
    queryKey: ["sourceClasses", previousYear?.id],
    queryFn: async () => {
      if (!previousYear) return [];

      const { data, error } = await supabase
        .from("classes")
        .select(
          `
          id,
          name,
          program:programs(name)
        `,
        )
        .eq("academic_year_id", previousYear.id)
        .order("name");

      if (error) throw error;
      return data as Class[];
    },
    enabled: !!previousYear,
  });

  // Get target classes (from active year)
  const { data: targetClasses } = useQuery({
    queryKey: ["targetClasses", activeYear?.id],
    queryFn: async () => {
      if (!activeYear) return [];

      const { data, error } = await supabase
        .from("classes")
        .select(
          `
          id,
          name,
          program:programs(name)
        `,
        )
        .eq("academic_year_id", activeYear.id)
        .order("name");

      if (error) throw error;
      return data as Class[];
    },
    enabled: !!activeYear,
  });

  // Get students from source class with their grades
  const { data: students } = useQuery({
    queryKey: ["students", sourceClass],
    queryFn: async () => {
      if (!sourceClass) return [];

      const { data, error } = await supabase
        .from("students")
        .select(
          `
          id,
          first_name,
          last_name,
          registration_number,
          grades (
            score,
            exams (
              percentage,
              class_course (
                course (
                  name
                )
              )
            )
          )
        `,
        )
        .eq("class_id", sourceClass)
        .order("last_name");

      if (error) throw error;
      return data as Student[];
    },
    enabled: !!sourceClass,
  });

  // Calculate average grade for a student
  const calculateAverage = (student: Student) => {
    if (!student.grades || student.grades.length === 0) return 0;

    let totalWeightedScore = 0;
    let totalWeight = 0;

    student.grades.forEach((grade) => {
      const weight = grade.exams.percentage / 100;
      totalWeightedScore += grade.score * weight;
      totalWeight += weight;
    });

    return totalWeight > 0
      ? Number((totalWeightedScore / totalWeight).toFixed(2))
      : 0;
  };

  // Get course averages for a student
  const getCourseAverages = (student: Student) => {
    const courseGrades = new Map<string, { total: number; count: number }>();

    student.grades.forEach((grade) => {
      const courseName = grade.exams.class_course.course.name;
      if (!courseGrades.has(courseName)) {
        courseGrades.set(courseName, { total: 0, count: 0 });
      }
      const current = courseGrades.get(courseName)!;
      current.total += grade.score;
      current.count += 1;
    });

    const averages = new Map<string, number>();
    courseGrades.forEach((value, course) => {
      averages.set(course, Number((value.total / value.count).toFixed(2)));
    });

    return averages;
  };

  // Handle automatic selection of students with average >= 10
  const handleAutoSelect = () => {
    if (!students) return;

    const qualifiedStudents = students
      .filter((student) => calculateAverage(student) >= 10)
      .map((student) => student.id);

    setSelectedStudents(qualifiedStudents);
  };

  // Handle promotion of selected students
  const handlePromote = async () => {
    if (!selectedStudents.length || !targetClass) {
      toast.error("Please select students and a target class");
      return;
    }

    setIsPromoting(true);
    try {
      const { error } = await supabase
        .from("students")
        .update({ class_id: targetClass })
        .in("id", selectedStudents);

      if (error) throw error;

      toast.success(
        `Successfully promoted ${selectedStudents.length} students`,
      );
      setSelectedStudents([]);
    } catch (error: any) {
      toast.error(`Error promoting students: ${error.message}`);
    } finally {
      setIsPromoting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Student Promotion</h2>
        <p className="text-gray-600">Promote students to their next class</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Source Class Selection */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">
              Source Class ({previousYear?.name})
            </span>
          </label>
          <select
            className="select select-bordered"
            value={sourceClass}
            onChange={(e) => {
              setSourceClass(e.target.value);
              setSelectedStudents([]);
            }}
          >
            <option value="">Select source class</option>
            {sourceClasses?.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} - {cls.program.name}
              </option>
            ))}
          </select>
        </div>

        {/* Target Class Selection */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">
              Target Class ({activeYear?.name})
            </span>
          </label>
          <select
            className="select select-bordered"
            value={targetClass}
            onChange={(e) => setTargetClass(e.target.value)}
            disabled={!sourceClass}
          >
            <option value="">Select target class</option>
            {targetClasses?.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} - {cls.program.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {students && students.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="font-medium">Students</span>
              <span className="text-sm text-gray-500">
                ({selectedStudents.length} selected)
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAutoSelect}
                className="btn btn-sm btn-secondary"
              >
                <Check className="h-4 w-4 mr-2" />
                Select Average ≥ 10
              </button>
              <button
                onClick={handlePromote}
                disabled={
                  selectedStudents.length === 0 || !targetClass || isPromoting
                }
                className="btn btn-sm btn-primary"
              >
                {isPromoting ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <ArrowRight className="h-4 w-4 mr-2" />
                )}
                Promote Selected
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={selectedStudents.length === students.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudents(students.map((s) => s.id));
                        } else {
                          setSelectedStudents([]);
                        }
                      }}
                    />
                  </th>
                  <th>Registration #</th>
                  <th>Name</th>
                  <th>Course Averages</th>
                  <th>Overall Average</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const average = calculateAverage(student);
                  const courseAverages = getCourseAverages(student);

                  return (
                    <tr key={student.id}>
                      <td>
                        <input
                          type="checkbox"
                          className="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudents([
                                ...selectedStudents,
                                student.id,
                              ]);
                            } else {
                              setSelectedStudents(
                                selectedStudents.filter(
                                  (id) => id !== student.id,
                                ),
                              );
                            }
                          }}
                        />
                      </td>
                      <td>{student.registration_number}</td>
                      <td>
                        {student.last_name}, {student.first_name}
                      </td>
                      <td>
                        <div className="space-y-1">
                          {Array.from(courseAverages).map(([course, avg]) => (
                            <div key={course} className="text-sm">
                              <span className="font-medium">{course}:</span>{" "}
                              <span
                                className={
                                  avg >= 10
                                    ? "text-success-600"
                                    : "text-error-600"
                                }
                              >
                                {avg}/20
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`font-bold ${
                            average >= 10
                              ? "text-success-600"
                              : "text-error-600"
                          }`}
                        >
                          {average}/20
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : sourceClass ? (
        <div className="bg-white rounded-lg p-8 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No students found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            There are no students in this class.
          </p>
        </div>
      ) : null}
    </div>
  );
}
