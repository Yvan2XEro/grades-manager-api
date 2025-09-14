import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { Plus, Pencil, Trash2, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import FormModal from '../../components/modals/FormModal';
import ConfirmModal from '../../components/modals/ConfirmModal';

const examSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.string().min(2, 'Type must be at least 2 characters'),
  date: z.string().min(1, 'Date is required'),
  percentage: z.number()
    .min(1, 'Percentage must be at least 1')
    .max(100, 'Percentage cannot exceed 100'),
  class_course_id: z.string().uuid('Please select a course'),
});

type ExamFormData = z.infer<typeof examSchema>;

interface Exam {
  id: string;
  name: string;
  type: string;
  date: string;
  percentage: number;
  class_course_id: string;
  is_locked: boolean;
  class_course: {
    course: { name: string };
    class: { name: string };
  };
}

export default function ExamManagement() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: exams, isLoading } = useQuery({
    queryKey: ['exams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exams')
        .select(`
          *,
          class_course:class_courses (
            course:courses(name),
            class:classes(name)
          )
        `)
        .order('date');

      if (error) throw error;
      return data as Exam[];
    },
  });

  const { data: classCourses } = useQuery({
    queryKey: ['classCourses'],
    queryFn: async () => {
      // First get the active academic year
      const { data: yearData } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_active', true)
        .single();

      if (!yearData) return [];

      // Then get courses for the active year
      const { data, error } = await supabase
        .from('class_courses')
        .select(`
          id,
          course:courses(name),
          class:classes!inner(
            name,
            academic_year_id
          )
        `)
        .eq('class.academic_year_id', yearData.id)
        .order('course(name)');

      if (error) throw error;
      return data;
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExamFormData>({
    resolver: zodResolver(examSchema),
  });

  const createMutation = useMutation({
    mutationFn: async (data: ExamFormData) => {
      const { error } = await supabase.from('exams').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      toast.success('Exam created successfully');
      setIsFormOpen(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(`Error creating exam: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ExamFormData & { id: string }) => {
      const { id, ...updateData } = data;
      const { error } = await supabase
        .from('exams')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      toast.success('Exam updated successfully');
      setIsFormOpen(false);
      setEditingExam(null);
      reset();
    },
    onError: (error: any) => {
      toast.error(`Error updating exam: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('exams').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      toast.success('Exam deleted successfully');
      setIsDeleteOpen(false);
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast.error(`Error deleting exam: ${error.message}`);
    },
  });

  const onSubmit = async (data: ExamFormData) => {
    if (editingExam) {
      updateMutation.mutate({ ...data, id: editingExam.id });
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
          <h1 className="text-2xl font-bold">Exam Management</h1>
          <p className="text-base-content/60">Create and manage course exams</p>
        </div>
        <button
          onClick={() => {
            setEditingExam(null);
            reset();
            setIsFormOpen(true);
          }}
          className="btn btn-primary"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Exam
        </button>
      </div>

      <div className="card bg-base-100 shadow-xl">
        {exams?.length === 0 ? (
          <div className="card-body items-center text-center py-12">
            <ClipboardList className="w-16 h-16 text-base-content/20" />
            <h2 className="card-title mt-4">No Exams Found</h2>
            <p className="text-base-content/60">Get started by adding your first exam.</p>
            <button
              onClick={() => {
                setEditingExam(null);
                reset();
                setIsFormOpen(true);
              }}
              className="btn btn-primary mt-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Exam
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Course</th>
                  <th>Class</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Percentage</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams?.map((exam) => (
                  <tr key={exam.id}>
                    <td className="font-medium">{exam.name}</td>
                    <td>{exam.class_course?.course?.name}</td>
                    <td>{exam.class_course?.class?.name}</td>
                    <td>{exam.type}</td>
                    <td>{format(new Date(exam.date), 'MMM d, yyyy')}</td>
                    <td>{exam.percentage}%</td>
                    <td>
                      <span
                        className={`badge ${
                          exam.is_locked ? 'badge-warning' : 'badge-success'
                        }`}
                      >
                        {exam.is_locked ? 'Locked' : 'Open'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingExam(exam);
                            reset({
                              name: exam.name,
                              type: exam.type,
                              date: exam.date,
                              percentage: exam.percentage,
                              class_course_id: exam.class_course_id,
                            });
                            setIsFormOpen(true);
                          }}
                          className="btn btn-square btn-sm btn-ghost"
                          disabled={exam.is_locked}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(exam.id)}
                          className="btn btn-square btn-sm btn-ghost text-error"
                          disabled={exam.is_locked}
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
          setEditingExam(null);
          reset();
        }}
        title={editingExam ? 'Edit Exam' : 'Add New Exam'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Course</span>
            </label>
            <select
              {...register('class_course_id')}
              className="select select-bordered w-full"
            >
              <option value="">Select a course</option>
              {classCourses?.map((cc) => (
                <option key={cc.id} value={cc.id}>
                  {cc.course?.name} - {cc.class?.name}
                </option>
              ))}
            </select>
            {errors.class_course_id && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {errors.class_course_id.message}
                </span>
              </label>
            )}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Exam Name</span>
            </label>
            <input
              type="text"
              {...register('name')}
              className="input input-bordered"
              placeholder="Enter exam name"
            />
            {errors.name && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.name.message}</span>
              </label>
            )}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Type</span>
            </label>
            <input
              type="text"
              {...register('type')}
              className="input input-bordered"
              placeholder="e.g., Midterm, Final"
            />
            {errors.type && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.type.message}</span>
              </label>
            )}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Date</span>
            </label>
            <input
              type="date"
              {...register('date')}
              className="input input-bordered"
            />
            {errors.date && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.date.message}</span>
              </label>
            )}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Percentage</span>
            </label>
            <input
              type="number"
              {...register('percentage', { valueAsNumber: true })}
              className="input input-bordered"
              placeholder="Enter percentage (1-100)"
            />
            {errors.percentage && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {errors.percentage.message}
                </span>
              </label>
            )}
          </div>

          <div className="modal-action">
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setEditingExam(null);
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
              ) : editingExam ? (
                'Save Changes'
              ) : (
                'Create Exam'
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
        title="Delete Exam"
        message="Are you sure you want to delete this exam? This action cannot be undone and will also delete all associated grades."
        confirmText="Delete"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}