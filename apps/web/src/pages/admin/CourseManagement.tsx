import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { PlusIcon, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import FormModal from '../../components/modals/FormModal';
import ConfirmModal from '../../components/modals/ConfirmModal';

const courseSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  credits: z.number().min(1, 'Credits must be at least 1'),
  hours: z.number().min(1, 'Hours must be at least 1'),
  program_id: z.string().uuid('Please select a program'),
  default_teacher_id: z.string().uuid('Please select a teacher'),
});

type CourseFormData = z.infer<typeof courseSchema>;

interface Course {
  id: string;
  name: string;
  credits: number;
  hours: number;
  program_id: string;
  default_teacher_id: string;
  program: { name: string };
  default_teacher: { first_name: string; last_name: string };
}

export default function CourseManagement() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          program:programs(name),
          default_teacher:profiles(first_name, last_name)
        `)
        .order('name');

      if (error) throw error;
      return data as Course[];
    },
  });

  const { data: programs } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
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
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
  });

  const createMutation = useMutation({
    mutationFn: async (data: CourseFormData) => {
      const { error } = await supabase.from('courses').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course created successfully');
      setIsFormOpen(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(`Error creating course: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: CourseFormData & { id: string }) => {
      const { id, ...updateData } = data;
      const { error } = await supabase
        .from('courses')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course updated successfully');
      setIsFormOpen(false);
      setEditingCourse(null);
      reset();
    },
    onError: (error: any) => {
      toast.error(`Error updating course: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('courses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course deleted successfully');
      setIsDeleteOpen(false);
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast.error(`Error deleting course: ${error.message}`);
    },
  });

  const onSubmit = async (data: CourseFormData) => {
    if (editingCourse) {
      updateMutation.mutate({ ...data, id: editingCourse.id });
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
        <h1 className="text-2xl font-bold">Course Management</h1>
        <button
          onClick={() => {
            setEditingCourse(null);
            reset();
            setIsFormOpen(true);
          }}
          className="btn btn-primary"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Course
        </button>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Program</th>
                <th>Credits</th>
                <th>Hours</th>
                <th>Default Teacher</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses?.map((course) => (
                <tr key={course.id}>
                  <td>{course.name}</td>
                  <td>{course.program?.name}</td>
                  <td>{course.credits}</td>
                  <td>{course.hours}</td>
                  <td>
                    {course.default_teacher?.first_name}{' '}
                    {course.default_teacher?.last_name}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingCourse(course);
                          reset({
                            name: course.name,
                            credits: course.credits,
                            hours: course.hours,
                            program_id: course.program_id,
                            default_teacher_id: course.default_teacher_id,
                          });
                          setIsFormOpen(true);
                        }}
                        className="btn btn-square btn-sm btn-ghost"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(course.id)}
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
      </div>

      <FormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCourse(null);
          reset();
        }}
        title={editingCourse ? 'Edit Course' : 'Add New Course'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Course Name</span>
            </label>
            <input
              type="text"
              {...register('name')}
              className="input input-bordered"
              placeholder="Enter course name"
            />
            {errors.name && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {errors.name.message}
                </span>
              </label>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Credits</span>
              </label>
              <input
                type="number"
                {...register('credits', { valueAsNumber: true })}
                className="input input-bordered"
                placeholder="Enter credits"
              />
              {errors.credits && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.credits.message}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Hours</span>
              </label>
              <input
                type="number"
                {...register('hours', { valueAsNumber: true })}
                className="input input-bordered"
                placeholder="Enter hours"
              />
              {errors.hours && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.hours.message}
                  </span>
                </label>
              )}
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Program</span>
            </label>
            <select
              {...register('program_id')}
              className="select select-bordered w-full"
            >
              <option value="">Select a program</option>
              {programs?.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name}
                </option>
              ))}
            </select>
            {errors.program_id && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {errors.program_id.message}
                </span>
              </label>
            )}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Default Teacher</span>
            </label>
            <select
              {...register('default_teacher_id')}
              className="select select-bordered w-full"
            >
              <option value="">Select a teacher</option>
              {teachers?.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.first_name} {teacher.last_name}
                </option>
              ))}
            </select>
            {errors.default_teacher_id && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {errors.default_teacher_id.message}
                </span>
              </label>
            )}
          </div>

          <div className="modal-action">
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setEditingCourse(null);
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
              ) : editingCourse ? (
                'Save Changes'
              ) : (
                'Create Course'
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
        title="Delete Course"
        message="Are you sure you want to delete this course? This action cannot be undone."
        confirmText="Delete"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}