import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { Plus, Pencil, Trash2, School } from 'lucide-react';
import { toast } from 'sonner';
import FormModal from '../../components/modals/FormModal';
import ConfirmModal from '../../components/modals/ConfirmModal';

const programSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  faculty_id: z.string().uuid('Please select a faculty'),
});

type ProgramFormData = z.infer<typeof programSchema>;

interface Program {
  id: string;
  name: string;
  description: string | null;
  faculty_id: string;
  faculty: {
    name: string;
  };
}

export default function ProgramManagement() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: programs, isLoading } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select(`
          *,
          faculty:faculties(name)
        `)
        .order('name');

      if (error) throw error;
      return data as Program[];
    },
  });

  const { data: faculties } = useQuery({
    queryKey: ['faculties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faculties')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProgramFormData>({
    resolver: zodResolver(programSchema),
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProgramFormData) => {
      const { error } = await supabase.from('programs').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      toast.success('Program created successfully');
      setIsFormOpen(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(`Error creating program: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProgramFormData & { id: string }) => {
      const { id, ...updateData } = data;
      const { error } = await supabase
        .from('programs')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      toast.success('Program updated successfully');
      setIsFormOpen(false);
      setEditingProgram(null);
      reset();
    },
    onError: (error: any) => {
      toast.error(`Error updating program: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('programs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      toast.success('Program deleted successfully');
      setIsDeleteOpen(false);
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast.error(`Error deleting program: ${error.message}`);
    },
  });

  const onSubmit = async (data: ProgramFormData) => {
    if (editingProgram) {
      updateMutation.mutate({ ...data, id: editingProgram.id });
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
          <h1 className="text-2xl font-bold">Program Management</h1>
          <p className="text-base-content/60">Manage academic programs</p>
        </div>
        <button
          onClick={() => {
            setEditingProgram(null);
            reset();
            setIsFormOpen(true);
          }}
          className="btn btn-primary"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Program
        </button>
      </div>

      <div className="card bg-base-100 shadow-xl">
        {programs?.length === 0 ? (
          <div className="card-body items-center text-center py-12">
            <School className="w-16 h-16 text-base-content/20" />
            <h2 className="card-title mt-4">No Programs Found</h2>
            <p className="text-base-content/60">Get started by adding your first program.</p>
            <button
              onClick={() => {
                setEditingProgram(null);
                reset();
                setIsFormOpen(true);
              }}
              className="btn btn-primary mt-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Program
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Faculty</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {programs?.map((program) => (
                  <tr key={program.id}>
                    <td className="font-medium">{program.name}</td>
                    <td>{program.faculty?.name}</td>
                    <td>
                      {program.description || (
                        <span className="text-base-content/40 italic">No description</span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingProgram(program);
                            reset({
                              name: program.name,
                              description: program.description || '',
                              faculty_id: program.faculty_id,
                            });
                            setIsFormOpen(true);
                          }}
                          className="btn btn-square btn-sm btn-ghost"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(program.id)}
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
          setEditingProgram(null);
          reset();
        }}
        title={editingProgram ? 'Edit Program' : 'Add New Program'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Program Name</span>
            </label>
            <input
              type="text"
              {...register('name')}
              className="input input-bordered"
              placeholder="Enter program name"
            />
            {errors.name && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.name.message}</span>
              </label>
            )}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Faculty</span>
            </label>
            <select
              {...register('faculty_id')}
              className="select select-bordered w-full"
            >
              <option value="">Select a faculty</option>
              {faculties?.map((faculty) => (
                <option key={faculty.id} value={faculty.id}>
                  {faculty.name}
                </option>
              ))}
            </select>
            {errors.faculty_id && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {errors.faculty_id.message}
                </span>
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
              placeholder="Enter program description"
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
                setEditingProgram(null);
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
              ) : editingProgram ? (
                'Save Changes'
              ) : (
                'Create Program'
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
        title="Delete Program"
        message="Are you sure you want to delete this program? This action cannot be undone and will also delete all associated courses and classes."
        confirmText="Delete"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}