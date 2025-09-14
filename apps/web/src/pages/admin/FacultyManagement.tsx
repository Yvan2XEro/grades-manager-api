import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import FormModal from '../../components/modals/FormModal';
import ConfirmModal from '../../components/modals/ConfirmModal';

const facultySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
});

type FacultyFormData = z.infer<typeof facultySchema>;

interface Faculty {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export default function FacultyManagement() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: faculties, isLoading } = useQuery({
    queryKey: ['faculties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faculties')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Faculty[];
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FacultyFormData>({
    resolver: zodResolver(facultySchema),
  });

  const createMutation = useMutation({
    mutationFn: async (data: FacultyFormData) => {
      const { error } = await supabase.from('faculties').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculties'] });
      toast.success('Faculty created successfully');
      setIsFormOpen(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(`Error creating faculty: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FacultyFormData & { id: string }) => {
      const { id, ...updateData } = data;
      const { error } = await supabase
        .from('faculties')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculties'] });
      toast.success('Faculty updated successfully');
      setIsFormOpen(false);
      setEditingFaculty(null);
      reset();
    },
    onError: (error: any) => {
      toast.error(`Error updating faculty: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('faculties').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculties'] });
      toast.success('Faculty deleted successfully');
      setIsDeleteOpen(false);
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast.error(`Error deleting faculty: ${error.message}`);
    },
  });

  const onSubmit = async (data: FacultyFormData) => {
    if (editingFaculty) {
      updateMutation.mutate({ ...data, id: editingFaculty.id });
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
          <h1 className="text-2xl font-bold">Faculty Management</h1>
          <p className="text-base-content/60">Create and manage academic faculties</p>
        </div>
        <button
          onClick={() => {
            setEditingFaculty(null);
            reset();
            setIsFormOpen(true);
          }}
          className="btn btn-primary"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Faculty
        </button>
      </div>

      <div className="card bg-base-100 shadow-xl">
        {faculties?.length === 0 ? (
          <div className="card-body items-center text-center py-12">
            <Building2 className="w-16 h-16 text-base-content/20" />
            <h2 className="card-title mt-4">No Faculties Found</h2>
            <p className="text-base-content/60">Get started by adding your first faculty.</p>
            <button
              onClick={() => {
                setEditingFaculty(null);
                reset();
                setIsFormOpen(true);
              }}
              className="btn btn-primary mt-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Faculty
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {faculties?.map((faculty) => (
                  <tr key={faculty.id}>
                    <td className="font-medium">{faculty.name}</td>
                    <td>
                      {faculty.description || (
                        <span className="text-base-content/40 italic">No description</span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingFaculty(faculty);
                            reset({
                              name: faculty.name,
                              description: faculty.description || '',
                            });
                            setIsFormOpen(true);
                          }}
                          className="btn btn-square btn-sm btn-ghost"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(faculty.id)}
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
          setEditingFaculty(null);
          reset();
        }}
        title={editingFaculty ? 'Edit Faculty' : 'Add New Faculty'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Faculty Name</span>
            </label>
            <input
              type="text"
              {...register('name')}
              className="input input-bordered"
              placeholder="Enter faculty name"
            />
            {errors.name && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.name.message}</span>
              </label>
            )}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Description</span>
            </label>
            <textarea
              {...register('description')}
              className="textarea textarea-bordered"
              placeholder="Enter faculty description"
              rows={3}
            />
            {errors.description && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {errors.description.message}
                </span>
              </label>
            )}
          </div>

          <div className="modal-action">
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setEditingFaculty(null);
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
              ) : editingFaculty ? (
                'Save Changes'
              ) : (
                'Create Faculty'
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
        title="Delete Faculty"
        message="Are you sure you want to delete this faculty? This action cannot be undone and will also delete all associated programs and courses."
        confirmText="Delete"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}