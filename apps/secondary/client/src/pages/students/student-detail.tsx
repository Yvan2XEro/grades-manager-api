import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, User } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { NavLink, Outlet, useParams } from "react-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

const enrollSchema = z.object({
	academicYearId: z.string().min(1, "Required"),
	classId: z.string().min(1, "Required"),
	admissionType: z.enum(["new", "transfer", "repeat", "promoted"]),
});
type EnrollFormValues = z.infer<typeof enrollSchema>;

function EnrollDialog({
	studentId,
	open,
	onOpenChange,
}: {
	studentId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const { t } = useTranslation();
	const utils = trpc.useUtils();
	const { data: years = [] } = trpc.academicYears.list.useQuery();

	const {
		handleSubmit,
		setValue,
		watch,
		reset,
		formState: { errors },
	} = useForm<EnrollFormValues>({
		resolver: zodResolver(enrollSchema),
		defaultValues: {
			admissionType: "new" as const,
			academicYearId: "",
			classId: "",
		},
	});

	const academicYearId = watch("academicYearId") ?? "";
	const classId = watch("classId") ?? "";
	const admissionType = watch("admissionType") ?? "new";

	const { data: classesData } = trpc.classes.list.useQuery(
		{ academicYearId, pageSize: 200 },
		{ enabled: !!academicYearId },
	);
	const classes = classesData?.items ?? [];

	const enroll = trpc.enrollments.create.useMutation({
		onSuccess: () => {
			utils.enrollments.list.invalidate();
			reset();
			onOpenChange(false);
		},
	});

	const onSubmit = (values: EnrollFormValues) => {
		enroll.mutate({ ...values, studentId });
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(v) => {
				reset();
				onOpenChange(v);
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{t("enrollments.create_title", "Enroll in Class")}
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<FormField
						label={t("enrollments.field_year", "Academic Year")}
						error={errors.academicYearId?.message}
					>
						<Combobox
							options={years.map((y) => ({ value: y.id, label: y.name }))}
							value={academicYearId}
							onValueChange={(val) => {
								setValue("academicYearId", val);
								setValue("classId", "");
							}}
							placeholder={t("common.select", "Select…")}
						/>
					</FormField>
					<FormField
						label={t("enrollments.field_class", "Class")}
						error={errors.classId?.message}
					>
						<Combobox
							options={classes.map((c) => ({ value: c.id, label: c.name }))}
							value={classId}
							onValueChange={(val) => setValue("classId", val)}
							placeholder={t("common.select", "Select…")}
							disabled={!academicYearId}
						/>
					</FormField>
					<FormField
						label={t("enrollments.field_admission_type", "Admission type")}
						error={errors.admissionType?.message}
					>
						<Select
							value={admissionType}
							onValueChange={(val) =>
								setValue(
									"admissionType",
									val as EnrollFormValues["admissionType"],
								)
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="new">
									{t("enrollments.type_new", "New student")}
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
					<div className="flex justify-end gap-3 pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => {
								reset();
								onOpenChange(false);
							}}
						>
							{t("common.cancel", "Cancel")}
						</Button>
						<Button type="submit" disabled={enroll.isPending}>
							{enroll.isPending
								? t("common.saving", "Saving…")
								: t("enrollments.enroll_btn", "Enroll")}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function DetailSkeleton() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-4 w-24" />
			<div className="space-y-1">
				<Skeleton className="h-8 w-56" />
				<Skeleton className="h-4 w-32" />
			</div>
			<div className="flex gap-4 border-border border-b pb-px">
				{[1, 2, 3, 4].map((i) => (
					<Skeleton key={i} className="h-8 w-20" />
				))}
			</div>
			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
				<div className="space-y-5 rounded-xl border border-border p-5">
					{Array.from({ length: 5 }, (_, i) => (
						<div key={i} className="space-y-1">
							<Skeleton className="h-3 w-20" />
							<Skeleton className="h-4 w-36" />
						</div>
					))}
				</div>
				<div className="space-y-5 rounded-xl border border-border p-5">
					{Array.from({ length: 5 }, (_, i) => (
						<div key={i} className="space-y-1">
							<Skeleton className="h-3 w-20" />
							<Skeleton className="h-4 w-36" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

export function StudentDetail() {
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();

	const TAB_NAV = [
		{
			to: `/students/${id}/profile`,
			label: "students.tab_profile",
			fallback: "Profile",
		},
		{
			to: `/students/${id}/grades`,
			label: "students.tab_grades",
			fallback: "Grades",
		},
		{
			to: `/students/${id}/fees`,
			label: "students.tab_fees",
			fallback: "Fees",
		},
		{
			to: `/students/${id}/attendance`,
			label: "students.tab_attendance",
			fallback: "Attendance",
		},
	];
	const [showEnroll, setShowEnroll] = useState(false);

	const { data: student, isLoading } = trpc.students.get.useQuery(
		{ id: id! },
		{ enabled: !!id },
	);

	if (isLoading) return <DetailSkeleton />;

	if (!student) {
		return (
			<div className="flex flex-col items-center gap-3 py-24 text-muted-foreground">
				<User className="h-10 w-10 opacity-30" />
				<p className="font-medium">{t("common.no_data")}</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="font-bold text-2xl text-foreground">
						{student.firstName} {student.lastName}
					</h1>
					<p className="text-muted-foreground text-sm">
						{student.registrationNumber}
					</p>
				</div>
				<Button size="sm" onClick={() => setShowEnroll(true)}>
					<Plus className="mr-2 h-4 w-4" />
					{t("enrollments.enroll_btn", "Enroll")}
				</Button>
			</div>

			<div className="flex border-border border-b" role="tablist">
				{TAB_NAV.map(({ to, label, fallback }) => (
					<NavLink
						key={to}
						to={to}
						className={({ isActive }) =>
							cn(
								"inline-flex items-center justify-center whitespace-nowrap px-4 py-2 font-medium text-sm transition-colors",
								"-mb-px border-b-2 focus-visible:outline-none",
								isActive
									? "border-primary text-foreground"
									: "border-transparent text-muted-foreground hover:text-foreground",
							)
						}
					>
						{t(label, fallback)}
					</NavLink>
				))}
			</div>

			<Outlet context={student} />

			<EnrollDialog
				studentId={student.id}
				open={showEnroll}
				onOpenChange={setShowEnroll}
			/>
		</div>
	);
}
