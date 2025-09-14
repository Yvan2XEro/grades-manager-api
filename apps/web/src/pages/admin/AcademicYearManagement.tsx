import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, X, Check, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format, isValid, parseISO } from 'date-fns';
import { trpcClient } from '../../utils/trpc';

const academicYearSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end > start;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    },
  );

type AcademicYear = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
};

type FormData = z.infer<typeof academicYearSchema>;

const AcademicYearManagement: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(academicYearSchema),
  });

  const { data: academicYears, isLoading } = useQuery({
    queryKey: ['academicYears'],
    queryFn: async () => {
      const { items } = await trpcClient.academicYears.list.query({});
      return items as AcademicYear[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      await trpcClient.academicYears.create.mutate({
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academicYears'] });
      toast.success('Academic year created successfully');
      setIsModalOpen(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(`Error creating academic year: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) => {
      await trpcClient.academicYears.update.mutate({
        id,
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academicYears'] });
      toast.success('Academic year updated successfully');
      setIsModalOpen(false);
      setEditingYear(null);
      reset();
    },
    onError: (error: any) => {
      toast.error(`Error updating academic year: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await trpcClient.academicYears.delete.mutate({ id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academicYears'] });
      toast.success('Academic year deleted successfully');
      setDeleteConfirmId(null);
    },
    onError: (error: any) => {
      toast.error(`Error deleting academic year: ${error.message}`);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await trpcClient.academicYears.setActive.mutate({ id, isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academicYears'] });
      toast.success('Academic year status updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Error updating academic year status: ${error.message}`);
    },
  });

  const onSubmit = async (data: FormData) => {
    if (editingYear) {
      updateMutation.mutate({ id: editingYear.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleToggleActive = (id: string, currentStatus: boolean) => {
    toggleActiveMutation.mutate({ id, isActive: !currentStatus });
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) {
        return 'Invalid Date';
      }
      return format(date, 'MMM d, yyyy');
    } catch {
      return 'Invalid Date';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Academic Year Management</h2>
          <p className="text-gray-600">Manage academic years and set active period</p>
        </div>
        <button
          onClick={() => {
            setEditingYear(null);
            setIsModalOpen(true);
          }}
          className="btn btn-primary"
        >
          <Plus className="h-5 w-5 mr-2" /> Add Academic Year
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {academicYears?.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-700">No academic years found</h3>
            <p className="mt-1 text-gray-500">Get started by adding your first academic year.</p>
            <button
              onClick={() => {
                setEditingYear(null);
                setIsModalOpen(true);
              }}
              className="mt-4 btn btn-primary btn-sm"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Academic Year
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {academicYears?.map((year) => (
                  <tr key={year.id}>
                    <td>{year.name}</td>
                    <td>{formatDate(year.startDate)}</td>
                    <td>{formatDate(year.endDate)}</td>
                    <td>
                      <div className="form-control">
                        <label className="label cursor-pointer">
                          <input
                            type="checkbox"
                            className="toggle toggle-primary"
                            checked={year.isActive}
                            onChange={() => handleToggleActive(year.id, year.isActive)}
                          />
                          <span className="label-text ml-2">
                            {year.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </label>
                      </div>
                    </td>
                    <td>
                      {deleteConfirmId === year.id ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Confirm delete?</span>
                          <button
                            onClick={() => handleDelete(year.id)}
                            className="btn btn-error btn-sm"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="btn btn-ghost btn-sm"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setEditingYear(year);
                              setIsModalOpen(true);
                            }}
                            className="btn btn-ghost btn-sm"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(year.id)}
                            className="btn btn-ghost btn-sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">
              {editingYear ? 'Edit Academic Year' : 'Add New Academic Year'}
            </h3>
            <button
              onClick={() => {
                setIsModalOpen(false);
                setEditingYear(null);
                reset();
              }}
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            >
              ✕
            </button>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Academic Year Name*</span>
                </label>
                <input
                  type="text"
                  {...register('name')}
                  defaultValue={editingYear?.name}
                  className="input input-bordered"
                  placeholder="e.g., 2024-2025"
                />
                {errors.name && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.name.message}</span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Start Date*</span>
                </label>
                <input
                  type="date"
                  {...register('startDate')}
                  defaultValue={editingYear?.startDate.slice(0, 10)}
                  className="input input-bordered"
                />
                {errors.startDate && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.startDate.message}</span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">End Date*</span>
                </label>
                <input
                  type="date"
                  {...register('endDate')}
                  defaultValue={editingYear?.endDate.slice(0, 10)}
                  className="input input-bordered"
                />
                {errors.endDate && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.endDate.message}</span>
                  </label>
                )}
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingYear(null);
                    reset();
                  }}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                >
                  {isSubmitting ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}></div>
        </div>
      )}
    </div>
  );
};

export default AcademicYearManagement;