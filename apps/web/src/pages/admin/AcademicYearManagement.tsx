import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isValid, parseISO } from "date-fns";
import { Calendar, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { trpcClient } from "../../utils/trpc";

const academicYearSchema = z
	.object({
		startDate: z.string().min(1, "Start date is required"),
		endDate: z.string().min(1, "End date is required"),
		name: z.string().min(2, "Label is required"),
	})
	.refine(
		(data) => {
			const start = new Date(data.startDate);
			const end = new Date(data.endDate);
			return end > start;
		},
		{
			message: "End date must be after start date",
			path: ["endDate"],
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
		watch,
		setValue,
		formState: { errors, isSubmitting },
	} = useForm<FormData>({
		resolver: zodResolver(academicYearSchema),
	});

	const startDate = watch("startDate");
	const endDate = watch("endDate");

	useEffect(() => {
		if (startDate) {
			if (!editingYear || startDate !== editingYear.startDate.slice(0, 10)) {
				const end = new Date(startDate);
				end.setFullYear(end.getFullYear() + 1);
				setValue("endDate", end.toISOString().slice(0, 10));
			}
		}
	}, [startDate, editingYear, setValue]);

	useEffect(() => {
		if (startDate && endDate) {
			const startYear = new Date(startDate).getFullYear();
			const endYear = new Date(endDate).getFullYear();
			setValue("name", `${startYear}-${endYear}`);
		}
	}, [startDate, endDate, setValue]);

	const { data: academicYears, isLoading } = useQuery({
		queryKey: ["academicYears"],
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
			queryClient.invalidateQueries({ queryKey: ["academicYears"] });
			toast.success("Academic year created successfully");
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
			queryClient.invalidateQueries({ queryKey: ["academicYears"] });
			toast.success("Academic year updated successfully");
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
			queryClient.invalidateQueries({ queryKey: ["academicYears"] });
			toast.success("Academic year deleted successfully");
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
			queryClient.invalidateQueries({ queryKey: ["academicYears"] });
			toast.success("Academic year status updated successfully");
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
				return "Invalid Date";
			}
			return format(date, "MMM d, yyyy");
		} catch {
			return "Invalid Date";
		}
	};

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<span className="loading loading-spinner loading-lg text-primary" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-bold text-2xl text-gray-800">
						Academic Year Management
					</h2>
					<p className="text-gray-600">
						Manage academic years and set active period
					</p>
				</div>
				<button
					onClick={() => {
						setEditingYear(null);
						reset({ startDate: "", endDate: "", name: "" });
						setIsModalOpen(true);
					}}
					className="btn btn-primary"
				>
					<Plus className="mr-2 h-5 w-5" /> Add Academic Year
				</button>
			</div>

			<div className="overflow-hidden rounded-xl bg-white shadow-sm">
				{academicYears?.length === 0 ? (
					<div className="p-8 text-center">
						<Calendar className="mx-auto h-12 w-12 text-gray-400" />
						<h3 className="mt-4 font-medium text-gray-700 text-lg">
							No academic years found
						</h3>
						<p className="mt-1 text-gray-500">
							Get started by adding your first academic year.
						</p>
						<button
							onClick={() => {
								setEditingYear(null);
								reset({ startDate: "", endDate: "", name: "" });
								setIsModalOpen(true);
							}}
							className="btn btn-primary btn-sm mt-4"
						>
							<Plus className="mr-2 h-4 w-4" /> Add Academic Year
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
														onChange={() =>
															handleToggleActive(year.id, year.isActive)
														}
													/>
													<span className="label-text ml-2">
														{year.isActive ? "Active" : "Inactive"}
													</span>
												</label>
											</div>
										</td>
										<td>
											{deleteConfirmId === year.id ? (
												<div className="flex items-center space-x-2">
													<span className="text-gray-600 text-sm">
														Confirm delete?
													</span>
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
															reset({
																startDate: year.startDate.slice(0, 10),
																endDate: year.endDate.slice(0, 10),
																name: year.name,
															});
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
							{editingYear ? "Edit Academic Year" : "Add New Academic Year"}
						</h3>
						<button
							onClick={() => {
								setIsModalOpen(false);
								setEditingYear(null);
								reset();
							}}
							className="btn btn-sm btn-circle btn-ghost absolute top-2 right-2"
						>
							✕
						</button>

						<form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
							<div className="form-control">
								<label className="label">
									<span className="label-text">Start Date*</span>
								</label>
								<input
									type="date"
									{...register("startDate")}
									className="input input-bordered"
								/>
								{errors.startDate && (
									<label className="label">
										<span className="label-text-alt text-error">
											{errors.startDate.message}
										</span>
									</label>
								)}
							</div>

							<div className="form-control">
								<label className="label">
									<span className="label-text">End Date*</span>
								</label>
								<input
									type="date"
									{...register("endDate")}
									className="input input-bordered"
								/>
								{errors.endDate && (
									<label className="label">
										<span className="label-text-alt text-error">
											{errors.endDate.message}
										</span>
									</label>
								)}
							</div>

							<div className="form-control">
								<label className="label">
									<span className="label-text">Label*</span>
								</label>
								<input
									type="text"
									{...register("name")}
									className="input input-bordered"
									readOnly
								/>
								{errors.name && (
									<label className="label">
										<span className="label-text-alt text-error">
											{errors.name.message}
										</span>
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
											<span className="loading loading-spinner" />
											Saving...
										</>
									) : (
										"Save"
									)}
								</button>
							</div>
						</form>
					</div>
					<div
						className="modal-backdrop"
						onClick={() => setIsModalOpen(false)}
					/>
				</div>
			)}
		</div>
	);
};

export default AcademicYearManagement;
