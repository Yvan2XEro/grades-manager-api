import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import FormModal from '../../components/modals/FormModal';
import ConfirmModal from '../../components/modals/ConfirmModal';

const classCourseSchema = z.object({
  class_id: z.string().uuid('Please select a class'),
  course_id: z.string().uuid('Please select a course'),
  teacher_id: z.string().uuid('Please select a teacher'),
});

type ClassCourseFormData = z.infer<typeof classCourseSchema>;

interface ClassCourse {
  id: string;
  class_id: string;
  course_id: string;
  teacher_id: string;
  class: {
    name: string;
    program: {
      name: string;
    };
  };
  course: {
    name: string;
  };
  teacher: {
    first_name: string;
    last_name: string;
  };
}

export default function ClassCourseManagement() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingClassCourse, setEditingClassCourse] = useState<ClassCourse | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: classCourses, isLoading } = useQuery({
    queryKey: ['classCourses'],
    queryFn: async () => {
      const { data: yearData } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_active', true)
        .single();

      if (!yearData) return [];

      const { data, error } = await supabase
        .from('class_courses')
        .select(`
          *,
          class:classes!inner(
            name,
            program:programs(name),
            academic_year_id
          ),
          course:courses(name),
          teacher:profiles(first_name, last_name)
        `)
        .eq('class.academic_year_id', yearData.id)
        .order('class(name)');

      if (error) throw error;
      return data as ClassCourse[];
    },
  });

  const { data: classes } = useQuery({
    queryKey: ['activeClasses'],
    queryFn: async () => {
      const { data: yearData } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_active', true)
        .single();

      if (!yearData) return [];

      const { data, error } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          program:programs(name)
        `)
        .eq('academic_year_id', yearData.id)
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  const { data: teachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('role', 'teacher')
        .order('last_name');

      if (error) throw error;
      return data;
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClassCourseFormData>({
    resolver: zodResolver(classCourseSchema),
  });

  const createMutation = useMutation({
    mutationFn: async (data: ClassCourseFormData) => {
      const { error } = await supabase.from('class_courses').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classCourses'] });
      toast.success('Course assignment created successfully');
      setIsFormOpen(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(`Error creating course assignment: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ClassCourseFormData & { id: string }) => {
      const { id, ...updateData } = data;
      const { error } = await supabase
        .from('class_courses')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classCourses'] });
      toast.success('Course assignment updated successfully');
      setIsFormOpen(false);
      setEditingClassCourse(null);
      reset();
    },
    onError: (error: any) => {
      toast.error(`Error updating course assignment: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('class_courses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classCourses'] });
      toast.success('Course assignment deleted successfully');
      setIsDeleteOpen(false);
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast.error(`Error deleting course assignment: ${error.message}`);
    },
  });

  const onSubmit = async (data: ClassCourseFormData) => {
    if (editingClassCourse) {
      updateMutation.mutate({ ...data, id: editingClassCourse.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const openDeleteModal = (id: string) => {
    setDeleteId(id);
    setIsDeleteOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Course Assignments</h1>
          <p className="text-base-content/60">Manage course assignments for classes</p>
        </div>
        <button
          onClick={() => {
            setEditingClassCourse(null);
            reset();
            setIsFormOpen(true);
          }}
          className="btn btn-primary"
        >
          <Plus className="h-5 w-5 mr-2" />
          Assign Course
        </button>
      </div>

      <div className="card bg-base-100 shadow-xl">
        {classCourses?.length === 0 ? (
          <div className="card-body items-center text-center py-12">
            <BookOpen className="w-16 h-16 text-base-content/20" />
            <h2 className="card-title mt-4">No Course Assignments</h2>
            <p className="text-base-content/60">Get started by assigning a course to a class.</p>
            <button
              onClick={() => {
                setEditingClassCourse(null);
                reset();
                setIsFormOpen(true);
              }}
              className="btn btn-primary mt-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Assign Course
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Program</th>
                  <th>Course</th>
                  <th>Teacher</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {classCourses?.map((cc) => (
                  <tr key={cc.id}>
                    <td className="font-medium">{cc.class?.name}</td>
                    <td>{cc.class?.program?.name}</td>
                    <td>{cc.course?.name}</td>
                    <td>
                      {cc.teacher?.first_name} {cc.teacher?.last_name}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingClassCourse(cc);
                            reset({
                              class_id: cc.class_id,
                              course_id: cc.course_id,
                              teacher_id: cc.teacher_id,
                            });
                            setIsFormOpen(true);
                          }}
                          className="btn btn-square btn-sm btn-ghost"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(cc.id)}
                          className="btn btn-square btn-sm btn-ghost text-error"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <FormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingClassCourse(null);
          reset();
        }}
        title={editingClassCourse ? 'Edit Course Assignment' : 'New Course Assignment'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Class</span>
            </label>
            <select
              {...register('class_id')}
              className="select select-bordered w-full"
            >
              <option value="">Select a class</option>
              {classes?.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} - {cls.program?.name}
                </option>
              ))}
            </select>
            {errors.class_id && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {errors.class_id.message}
                </span>
              </label>
            )}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Course</span>
            </label>
            <select
              {...register('course_id')}
              className="select select-bordered w-full"
            >
              <option value="">Select a course</option>
              {courses?.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
            {errors.course_id && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {errors.course_id.message}
                </span>
              </label>
            )}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Teacher</span>
            </label>
            <select
              {...register('teacher_id')}
              className="select select-bordered w-full"
            >
              <option value="">Select a teacher</option>
              {teachers?.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.first_name} {teacher.last_name}
                </option>
              ))}
            </select>
            {errors.teacher_id && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {errors.teacher_id.message}
                </span>
              </label>
            )}
          </div>

          <div className="modal-action">
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setEditingClassCourse(null);
                reset();
              }}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : editingClassCourse ? (
                'Save Changes'
              ) : (
                'Create Assignment'
              )}
            </button>
          </div>
        </form>
      </FormModal>

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setDeleteId(null);
        }}
        onConfirm={handleDelete}
        title="Delete Course Assignment"
        message="Are you sure you want to delete this course assignment? This action cannot be undone and will also delete all associated exams and grades."
        confirmText="Delete"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}