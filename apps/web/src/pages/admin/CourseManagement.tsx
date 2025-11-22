import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { Pencil, PlusIcon, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import ConfirmModal from "../../components/modals/ConfirmModal";
import FormModal from "../../components/modals/FormModal";
import { Button } from "../../components/ui/button";
import { DialogFooter } from "../../components/ui/dialog";
import {
        Form,
        FormControl,
        FormField,
        FormItem,
        FormLabel,
        FormMessage,
} from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
        SelectValue,
} from "../../components/ui/select";
import { Spinner } from "../../components/ui/spinner";
import { trpcClient } from "../../utils/trpc";

const buildCourseSchema = (t: TFunction) =>
	z.object({
		name: z.string().min(2, t("admin.courses.validation.name")),
		credits: z.number().min(1, t("admin.courses.validation.credits")),
		hours: z.number().min(1, t("admin.courses.validation.hours")),
		program: z.string({
			required_error: t("admin.courses.validation.program"),
		}),
		defaultTeacher: z.string({
			required_error: t("admin.courses.validation.teacher"),
		}),
	});

type CourseFormData = z.infer<ReturnType<typeof buildCourseSchema>>;

interface Course {
	id: string;
	name: string;
	credits: number;
	hours: number;
	program: string;
	defaultTeacher: string;
}

interface Program {
	id: string;
	name: string;
}

interface Teacher {
	id: string;
	name: string;
	role: string | null;
}

export default function CourseManagement() {
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [editingCourse, setEditingCourse] = useState<Course | null>(null);
	const [deleteId, setDeleteId] = useState<string | null>(null);

	const queryClient = useQueryClient();
	const { t } = useTranslation();
	const courseSchema = useMemo(() => buildCourseSchema(t), [t]);

	const { data: courses, isLoading } = useQuery({
		queryKey: ["courses"],
		queryFn: async () => {
			const { items } = await trpcClient.courses.list.query({});
			return items as Course[];
		},
	});

	const { data: programs } = useQuery({
		queryKey: ["programs"],
		queryFn: async () => {
			const { items } = await trpcClient.programs.list.query({});
			return items as Program[];
		},
	});

	const { data: teachers } = useQuery({
		queryKey: ["teachers"],
		queryFn: async () => {
			const { items } = await trpcClient.users.list.query({
				role: "teacher",
				limit: 100,
			});
			return items as Teacher[];
		},
	});

        const form = useForm<CourseFormData>({
                resolver: zodResolver(courseSchema),
        });

	const programMap = new Map((programs ?? []).map((p) => [p.id, p.name]));
	const teacherMap = new Map((teachers ?? []).map((t) => [t.id, t.name]));

	const createMutation = useMutation({
		mutationFn: async (data: CourseFormData) => {
			await trpcClient.courses.create.mutate(data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["courses"] });
			toast.success(t("admin.courses.toast.createSuccess"));
                        setIsFormOpen(false);
                        form.reset();
                },
		onError: (error: any) => {
			toast.error(error.message || t("admin.courses.toast.createError"));
		},
	});

	const updateMutation = useMutation({
		mutationFn: async (data: CourseFormData & { id: string }) => {
			const { id, ...updateData } = data;
			await trpcClient.courses.update.mutate({ id, ...updateData });
		},
                onSuccess: () => {
                        queryClient.invalidateQueries({ queryKey: ["courses"] });
                        toast.success(t("admin.courses.toast.updateSuccess"));
                        setIsFormOpen(false);
                        setEditingCourse(null);
                        form.reset();
                },
		onError: (error: any) => {
			toast.error(error.message || t("admin.courses.toast.updateError"));
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			await trpcClient.courses.delete.mutate({ id });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["courses"] });
			toast.success(t("admin.courses.toast.deleteSuccess"));
			setIsDeleteOpen(false);
			setDeleteId(null);
		},
		onError: (error: any) => {
			toast.error(error.message || t("admin.courses.toast.deleteError"));
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
			<div className="flex h-64 items-center justify-center">
				<span className="loading loading-spinner loading-lg" />
			</div>
		);
	}

	return (
		<div className="p-6">
			<div className="mb-6 flex items-center justify-between">
				<h1 className="font-bold text-2xl">{t("admin.courses.title")}</h1>
                                <button
                                        onClick={() => {
                                                setEditingCourse(null);
                                                form.reset();
                                                setIsFormOpen(true);
                                        }}
                                        className="btn btn-primary"
				>
					<PlusIcon className="mr-2 h-5 w-5" />
					{t("admin.courses.actions.add")}
				</button>
			</div>

			<div className="card bg-base-100 shadow-xl">
				<div className="overflow-x-auto">
					<table className="table">
						<thead>
							<tr>
								<th>{t("admin.courses.table.name")}</th>
								<th>{t("admin.courses.table.program")}</th>
								<th>{t("admin.courses.table.credits")}</th>
								<th>{t("admin.courses.table.hours")}</th>
								<th>{t("admin.courses.table.teacher")}</th>
								<th>{t("common.table.actions")}</th>
							</tr>
						</thead>
						<tbody>
							{courses?.map((course) => (
								<tr key={course.id}>
									<td>{course.name}</td>
									<td>{programMap.get(course.program)}</td>
									<td>{course.credits}</td>
									<td>{course.hours}</td>
									<td>{teacherMap.get(course.defaultTeacher)}</td>
									<td>
										<div className="flex gap-2">
                                                                                        <button
                                                                                                onClick={() => {
                                                                                                        setEditingCourse(course);
                                                                                                        form.reset({
                                                                                                                name: course.name,
                                                                                                                credits: course.credits,
                                                                                                                hours: course.hours,
                                                                                                                program: course.program,
                                                                                                                defaultTeacher: course.defaultTeacher,
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
                                        form.reset();
                                }}
				title={
					editingCourse
						? t("admin.courses.form.editTitle")
						: t("admin.courses.form.createTitle")
				}
			>
                                <Form {...form}>
                                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                                <FormField
                                                        control={form.control}
                                                        name="name"
                                                        render={({ field }) => (
                                                                <FormItem>
                                                                        <FormLabel>
                                                                                {t("admin.courses.form.nameLabel")}
                                                                        </FormLabel>
                                                                        <FormControl>
                                                                                <Input
                                                                                        {...field}
                                                                                        placeholder={t(
                                                                                                "admin.courses.form.namePlaceholder",
                                                                                        )}
                                                                                />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                </FormItem>
                                                        )}
                                                />

                                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                        <FormField
                                                                control={form.control}
                                                                name="credits"
                                                                render={({ field }) => (
                                                                        <FormItem>
                                                                                <FormLabel>
                                                                                        {t("admin.courses.form.creditsLabel")}
                                                                                </FormLabel>
                                                                                <FormControl>
                                                                                        <Input
                                                                                                type="number"
                                                                                                value={field.value ?? ""}
                                                                                                onChange={(event) =>
                                                                                                        field.onChange(
                                                                                                                event.target.value === ""
                                                                                                                        ? undefined
                                                                                                                        : Number(event.target.value),
                                                                                                        )
                                                                                                }
                                                                                                placeholder={t(
                                                                                                        "admin.courses.form.creditsPlaceholder",
                                                                                                )}
                                                                                                {...field}
                                                                                        />
                                                                                </FormControl>
                                                                                <FormMessage />
                                                                        </FormItem>
                                                                )}
                                                        />

                                                        <FormField
                                                                control={form.control}
                                                                name="hours"
                                                                render={({ field }) => (
                                                                        <FormItem>
                                                                                <FormLabel>
                                                                                        {t("admin.courses.form.hoursLabel")}
                                                                                </FormLabel>
                                                                                <FormControl>
                                                                                        <Input
                                                                                                type="number"
                                                                                                value={field.value ?? ""}
                                                                                                onChange={(event) =>
                                                                                                        field.onChange(
                                                                                                                event.target.value === ""
                                                                                                                        ? undefined
                                                                                                                        : Number(event.target.value),
                                                                                                        )
                                                                                                }
                                                                                                placeholder={t(
                                                                                                        "admin.courses.form.hoursPlaceholder",
                                                                                                )}
                                                                                                {...field}
                                                                                        />
                                                                                </FormControl>
                                                                                <FormMessage />
                                                                        </FormItem>
                                                                )}
                                                        />
                                                <FormField
                                                        control={form.control}
                                                        name="program"
                                                        render={({ field }) => (
                                                                <FormItem>
                                                                        <FormLabel>
                                                                                {t("admin.courses.form.programLabel")}
                                                                        </FormLabel>
                                                                        <Select
                                                                                onValueChange={field.onChange}
                                                                                value={field.value}
                                                                        >
                                                                                <FormControl>
                                                                                        <SelectTrigger>
                                                                                                <SelectValue
                                                                                                        placeholder={t(
                                                                                                                "admin.courses.form.programPlaceholder",
                                                                                                        )}
                                                                                                />
                                                                                        </SelectTrigger>
                                                                                </FormControl>
                                                                                <SelectContent>
                                                                                        {programs?.map((program) => (
                                                                                                <SelectItem
                                                                                                        key={program.id}
                                                                                                        value={program.id}
                                                                                                >
                                                                                                        {program.name}
                                                                                                </SelectItem>
                                                                                        ))}
                                                                                </SelectContent>
                                                                        </Select>
                                                                        <FormMessage />
                                                                </FormItem>
                                                        )}
                                                />

                                                <FormField
                                                        control={form.control}
                                                        name="defaultTeacher"
                                                        render={({ field }) => (
                                                                <FormItem>
                                                                        <FormLabel>
                                                                                {t("admin.courses.form.teacherLabel")}
                                                                        </FormLabel>
                                                                        <Select
                                                                                onValueChange={field.onChange}
                                                                                value={field.value}
                                                                        >
                                                                                <FormControl>
                                                                                        <SelectTrigger>
                                                                                                <SelectValue
                                                                                                        placeholder={t(
                                                                                                                "admin.courses.form.teacherPlaceholder",
                                                                                                        )}
                                                                                                />
                                                                                        </SelectTrigger>
                                                                                </FormControl>
                                                                                <SelectContent>
                                                                                        {teachers?.map((teacher) => (
                                                                                                <SelectItem
                                                                                                        key={teacher.id}
                                                                                                        value={teacher.id}
                                                                                                >
                                                                                                        {teacher.name}
                                                                                                </SelectItem>
                                                                                        ))}
                                                                                </SelectContent>
                                                                        </Select>
                                                                        <FormMessage />
                                                                </FormItem>
                                                        )}
                                                />

                                                <DialogFooter className="gap-2">
                                                        <Button
                                                                type="button"
                                                                variant="outline"
                                                                onClick={() => {
                                                                        setIsFormOpen(false);
                                                                        setEditingCourse(null);
                                                                        form.reset();
                                                                }}
                                                        >
                                                                {t("common.actions.cancel")}
                                                        </Button>
                                                        <Button
                                                                type="submit"
                                                                disabled={form.formState.isSubmitting}
                                                        >
                                                                {form.formState.isSubmitting ? (
                                                                        <Spinner className="mr-2 h-4 w-4" />
                                                                ) : editingCourse ? (
                                                                        t("common.actions.saveChanges")
                                                                ) : (
                                                                        t("admin.courses.form.createSubmit")
                                                                )}
                                                        </Button>
                                                </DialogFooter>
                                        </form>
                                </Form>
                        </FormModal>

			<ConfirmModal
				isOpen={isDeleteOpen}
				onClose={() => {
					setIsDeleteOpen(false);
					setDeleteId(null);
				}}
				onConfirm={handleDelete}
				title={t("admin.courses.delete.title")}
				message={t("admin.courses.delete.message")}
				confirmText={t("common.actions.delete")}
				isLoading={deleteMutation.isPending}
			/>
		</div>
	);
}
