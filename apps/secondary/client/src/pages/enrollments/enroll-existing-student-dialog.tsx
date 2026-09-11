import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Search } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { errorToast } from "@/lib/error-toast";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

const schema = z.object({
	studentId: z.string().uuid({ message: "Select a student" }),
	classId: z.string().uuid({ message: "Select a class" }),
	admissionType: z.enum(["new", "transfer", "repeat", "promoted"]),
});
type FormValues = z.infer<typeof schema>;

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	academicYearId: string;
	classes: { id: string; name: string }[];
	onSuccess: () => void;
}

export function EnrollExistingStudentDialog({
	open,
	onOpenChange,
	academicYearId,
	classes,
	onSuccess,
}: Props) {
	const { t } = useTranslation();
	const [search, setSearch] = useState("");
	const [showDropdown, setShowDropdown] = useState(false);

	const { data: studentsData } = trpc.students.list.useQuery(
		{ search: search || undefined, pageSize: 20 },
		{ enabled: open && search.length >= 1 },
	);
	const students = studentsData?.items ?? [];

	const utils = trpc.useUtils();
	const enroll = trpc.enrollments.create.useMutation({
		onSuccess: () => {
			utils.enrollments.list.invalidate();
			onSuccess();
			onOpenChange(false);
			reset();
			setSearch("");
		},
		onError: (err) => errorToast(err, t),
	});

	const {
		handleSubmit,
		setValue,
		watch,
		reset,
		register,
		formState: { errors },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: { admissionType: "new" },
	});

	const selectedStudentId = watch("studentId");
	const _selectedStudent = students.find((s) => s.id === selectedStudentId);

	const handleStudentSelect = (student: {
		id: string;
		firstName: string;
		lastName: string;
	}) => {
		setValue("studentId", student.id, { shouldValidate: true });
		setSearch(`${student.lastName} ${student.firstName}`);
		setShowDropdown(false);
	};

	const onSubmit = (values: FormValues) => {
		enroll.mutate({ ...values, academicYearId });
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>
						{t("enrollments.enroll_existing_title", "Enroll existing student")}
					</DialogTitle>
					<DialogDescription>
						{t(
							"enrollments.enroll_existing_desc",
							"Search for an existing student and assign them to a class for the active year.",
						)}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
					{/* Student search */}
					<FormField
						label={t("enrollments.field_student", "Student")}
						error={errors.studentId?.message}
					>
						<div className="relative">
							<Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder={t(
									"enrollments.student_search_placeholder",
									"Search by name or MNU…",
								)}
								value={search}
								onChange={(e) => {
									setSearch(e.target.value);
									setValue("studentId", "" as FormValues["studentId"]);
									setShowDropdown(true);
								}}
								onFocus={() => search && setShowDropdown(true)}
								className="pl-9"
								autoComplete="off"
							/>
							{showDropdown && students.length > 0 && (
								<div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-md">
									{students.map((s) => (
										<button
											key={s.id}
											type="button"
											onClick={() => handleStudentSelect(s)}
											className={cn(
												"flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
												s.id === selectedStudentId && "bg-accent",
											)}
										>
											{s.id === selectedStudentId && (
												<Check className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
											)}
											<span
												className={
													s.id === selectedStudentId ? "ml-0" : "ml-5.5"
												}
											>
												<span className="font-medium">
													{s.lastName} {s.firstName}
												</span>
												{s.mnu && (
													<span className="ml-2 font-mono text-muted-foreground text-xs">
														{s.mnu}
													</span>
												)}
											</span>
										</button>
									))}
								</div>
							)}
							{showDropdown && search.length >= 1 && students.length === 0 && (
								<div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover px-3 py-4 text-center text-muted-foreground text-sm shadow-md">
									{t("students.no_results", "No students found")}
								</div>
							)}
						</div>
						<input type="hidden" {...register("studentId")} />
					</FormField>

					{/* Class selector */}
					<FormField
						label={t("enrollments.field_class", "Class")}
						error={errors.classId?.message}
					>
						<Select
							onValueChange={(v) =>
								setValue("classId", v, { shouldValidate: true })
							}
						>
							<SelectTrigger>
								<SelectValue
									placeholder={t("enrollments.col_class", "Select class")}
								/>
							</SelectTrigger>
							<SelectContent>
								{classes.map((c) => (
									<SelectItem key={c.id} value={c.id}>
										{c.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</FormField>

					{/* Admission type */}
					<FormField
						label={t("enrollments.field_admission_type", "Admission type")}
						error={errors.admissionType?.message}
					>
						<Select
							defaultValue="new"
							onValueChange={(v) =>
								setValue("admissionType", v as FormValues["admissionType"], {
									shouldValidate: true,
								})
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="new">
									{t("enrollments.type_new", "New")}
								</SelectItem>
								<SelectItem value="promoted">
									{t("enrollments.type_promoted", "Promoted")}
								</SelectItem>
								<SelectItem value="repeat">
									{t("enrollments.type_repeat", "Repeating")}
								</SelectItem>
								<SelectItem value="transfer">
									{t("enrollments.type_transfer", "Transfer")}
								</SelectItem>
							</SelectContent>
						</Select>
					</FormField>

					<div className="flex justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => {
								onOpenChange(false);
								reset();
								setSearch("");
							}}
						>
							{t("common.cancel", "Cancel")}
						</Button>
						<Button type="submit" disabled={enroll.isPending}>
							{enroll.isPending
								? t("enrollments.enrolling", "Enrolling…")
								: t("enrollments.enroll_btn", "Enroll")}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
