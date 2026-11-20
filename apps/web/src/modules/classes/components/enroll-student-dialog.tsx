import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { createCallable } from "react-call";
import { useMutationFlow } from "react-call/mutation-flow";
import { useTranslation } from "react-i18next";
import {
	CallableDialog,
	DIALOG_EXIT_MS,
} from "@/components/callable/callable-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { type RouterOutputs, trpc, trpcClient } from "@/utils/trpc";

type Student = RouterOutputs["students"]["getById"];

const EMPTY_PERSON = {
	lastName: "",
	firstName: "",
	gender: "",
	dateOfBirth: "",
	placeOfBirth: "",
	phone: "",
	email: "",
};

/**
 * Enrolls a student in a class of the active year — or of `academicYearId`
 * when opened from a class of another year: a new student (profile,
 * registration number, enrollment in one step) or a person already known
 * (added from People, or a student who changes class). Resolves with the
 * student, or `undefined` when dismissed.
 */
export const EnrollStudentDialog = createCallable<
	{ classId?: string; academicYearId?: string },
	Student | undefined
>(({ call, classId: initialClassId, academicYearId }) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [classId, setClassId] = useState(initialClassId ?? "");
	const [mode, setMode] = useState<"new" | "existing">("new");
	const [person, setPerson] = useState(EMPTY_PERSON);
	const [search, setSearch] = useState("");
	const debounced = useDebounce(search.trim(), 300);
	const [selectedId, setSelectedId] = useState<string | null>(null);

	const yearsQuery = useQuery(trpc.academicYears.list.queryOptions({}));
	const year = yearsQuery.data?.items.find((y) =>
		academicYearId ? y.id === academicYearId : y.isActive,
	);
	const classesQuery = useQuery({
		...trpc.classes.list.queryOptions({
			academicYearId: year?.id,
			limit: 500,
		}),
		enabled: Boolean(year?.id),
	});
	const classes = useMemo(
		() =>
			[...(classesQuery.data?.items ?? [])].sort((a, b) =>
				a.name.localeCompare(b.name),
			),
		[classesQuery.data],
	);
	const targetClass = classes.find((c) => c.id === classId);

	const peopleQuery = useQuery({
		...trpc.users.listPaged.queryOptions({ search: debounced, pageSize: 8 }),
		enabled: mode === "existing" && debounced.length >= 2,
	});
	const studentsQuery = useQuery({
		...trpc.students.list.queryOptions({ q: debounced, limit: 20 }),
		enabled: mode === "existing" && debounced.length >= 2,
	});
	const studentByProfile = useMemo(
		() =>
			new Map(
				(studentsQuery.data?.items ?? []).map((s) => [s.domainUserId, s]),
			),
		[studentsQuery.data],
	);
	const className = (id: string | null | undefined) =>
		classes.find((c) => c.id === id)?.name;
	const people = peopleQuery.data?.items ?? [];
	const selected = people.find((p) => p.id === selectedId);
	const selectedStudent = selected
		? studentByProfile.get(selected.id)
		: undefined;
	// A student whose last enrollment is over (graduated, completed) goes on
	// to a new enrollment; otherwise the running one is closed (transfer).
	const enrollmentsQuery = useQuery({
		...trpc.enrollments.list.queryOptions({
			studentId: selectedStudent?.id ?? "",
			limit: 100,
		}),
		enabled: Boolean(selectedStudent?.id),
	});
	const latestEnrollment = [...(enrollmentsQuery.data?.items ?? [])].sort(
		(a, b) =>
			new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime(),
	)[0];
	const continuesStudies =
		latestEnrollment?.status === "graduated" ||
		latestEnrollment?.status === "completed";

	const set = (key: keyof typeof EMPTY_PERSON, value: string) =>
		setPerson((p) => ({ ...p, [key]: value }));

	const submit = useMutationFlow(call, async (call) => {
		if (!classId) return;
		try {
			let student: Student;
			if (mode === "new") {
				student = await trpcClient.students.create.mutate({
					classId,
					lastName: person.lastName.trim(),
					firstName: person.firstName.trim(),
					email: person.email.trim(),
					gender: (person.gender || undefined) as "male" | "female" | undefined,
					dateOfBirth: person.dateOfBirth
						? new Date(person.dateOfBirth)
						: undefined,
					placeOfBirth: person.placeOfBirth.trim() || undefined,
					phone: person.phone.trim() || undefined,
				});
			} else if (selectedStudent) {
				student = await trpcClient.students.update.mutate({
					id: selectedStudent.id,
					classId,
				});
			} else if (selected) {
				student = await trpcClient.students.enrollPerson.mutate({
					domainUserId: selected.id,
					classId,
				});
			} else return;
			toast.success(
				t("admin.students.enroll.success", {
					name: `${student.profile?.lastName ?? ""} ${student.profile?.firstName ?? ""}`.trim(),
					className: targetClass?.name ?? "",
					registrationNumber: student.registrationNumber,
				}),
			);
			queryClient.invalidateQueries({ queryKey: ["students"] });
			queryClient.invalidateQueries({
				queryKey: trpc.students.list.queryKey(),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.users.listPaged.queryKey(),
			});
			call.end(student);
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			toast.error(
				/CONFLICT|already|duplicate/i.test(message)
					? t("admin.students.enroll.conflict")
					: message,
			);
		}
	});
	const submitting = submit.pending;
	const canSubmit =
		Boolean(classId) &&
		(mode === "new"
			? Boolean(
					person.lastName.trim() &&
						person.firstName.trim() &&
						person.email.trim(),
				)
			: Boolean(selected));

	return (
		<CallableDialog
			call={call}
			dismissValue={undefined}
			preventDismiss={submitting}
			className="sm:max-w-xl"
			title={t("admin.students.enroll.title")}
			description={
				year
					? t("admin.students.enroll.description", { year: year.name })
					: t("admin.students.enroll.noActiveYear")
			}
		>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					if (canSubmit) submit();
				}}
				className="space-y-4"
			>
				<div className="space-y-1">
					<Label htmlFor="enroll-class">
						{t("admin.students.enroll.class")}
					</Label>
					<Select value={classId || undefined} onValueChange={setClassId}>
						<SelectTrigger id="enroll-class">
							<SelectValue
								placeholder={t("admin.students.enroll.classPlaceholder")}
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
				</div>

				<Tabs
					value={mode}
					onValueChange={(v) => setMode(v as "new" | "existing")}
				>
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="new">
							{t("admin.students.enroll.modeNew")}
						</TabsTrigger>
						<TabsTrigger value="existing">
							{t("admin.students.enroll.modeExisting")}
						</TabsTrigger>
					</TabsList>
				</Tabs>

				{mode === "new" ? (
					<div className="grid gap-3 sm:grid-cols-2">
						<Field
							id="enroll-last"
							label={t("common.fields.lastName")}
							required
							value={person.lastName}
							onChange={(v) => set("lastName", v)}
						/>
						<Field
							id="enroll-first"
							label={t("common.fields.firstName")}
							required
							value={person.firstName}
							onChange={(v) => set("firstName", v)}
						/>
						<div className="space-y-1">
							<Label htmlFor="enroll-gender">
								{t("admin.students.enroll.gender")}
							</Label>
							<Select
								value={person.gender || undefined}
								onValueChange={(v) => set("gender", v)}
							>
								<SelectTrigger id="enroll-gender">
									<SelectValue
										placeholder={t("admin.students.enroll.genderPlaceholder")}
									/>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="female">
										{t("admin.students.enroll.female")}
									</SelectItem>
									<SelectItem value="male">
										{t("admin.students.enroll.male")}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1">
							<Label>{t("admin.students.enroll.dateOfBirth")}</Label>
							<DatePicker
								value={person.dateOfBirth}
								onChange={(v) => set("dateOfBirth", v)}
								endMonth={new Date()}
							/>
						</div>
						<Field
							id="enroll-place"
							label={t("admin.students.enroll.placeOfBirth")}
							value={person.placeOfBirth}
							onChange={(v) => set("placeOfBirth", v)}
						/>
						<Field
							id="enroll-phone"
							type="tel"
							label={t("admin.students.enroll.phone")}
							value={person.phone}
							onChange={(v) => set("phone", v)}
						/>
						<div className="sm:col-span-2">
							<Field
								id="enroll-email"
								type="email"
								required
								label={t("common.fields.email")}
								hint={t("admin.students.enroll.emailHint")}
								value={person.email}
								onChange={(v) => set("email", v)}
							/>
						</div>
					</div>
				) : (
					<div className="space-y-2">
						<div className="relative">
							<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
							<Input
								autoFocus
								className="pl-9"
								placeholder={t("admin.students.enroll.searchPlaceholder")}
								value={search}
								onChange={(e) => {
									setSearch(e.target.value);
									setSelectedId(null);
								}}
							/>
						</div>
						<div className="max-h-64 space-y-1 overflow-y-auto">
							{debounced.length < 2 ? (
								<p className="py-4 text-center text-muted-foreground text-sm">
									{t("admin.students.enroll.searchHint")}
								</p>
							) : peopleQuery.isLoading ? null : people.length === 0 ? (
								<p className="py-4 text-center text-muted-foreground text-sm">
									{t("admin.students.enroll.noMatch")}
								</p>
							) : (
								people.map((p) => {
									const st = studentByProfile.get(p.id);
									const active = p.id === selectedId;
									return (
										<button
											key={p.id}
											type="button"
											onClick={() => setSelectedId(p.id)}
											className={cn(
												"flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left text-sm transition-colors",
												active
													? "border-primary bg-primary/5"
													: "hover:bg-accent",
											)}
										>
											<div className="min-w-0 flex-1">
												<p className="truncate font-medium">
													{p.lastName} {p.firstName}
												</p>
												<p className="truncate text-muted-foreground text-xs">
													{p.primaryEmail}
												</p>
											</div>
											{st ? (
												<Badge variant="secondary" className="shrink-0">
													{st.registrationNumber}
													{className(st.class)
														? ` · ${className(st.class)}`
														: ""}
												</Badge>
											) : null}
											{active && <Check className="h-4 w-4 text-primary" />}
										</button>
									);
								})
							)}
						</div>
						{selected ? (
							<div className="space-y-1 rounded-md bg-muted px-3 py-2 text-xs">
								<p>
									{selectedStudent
										? selectedStudent.class === classId
											? t("admin.students.enroll.alreadyInClass")
											: continuesStudies
												? t("admin.students.enroll.willContinue", {
														className: targetClass?.name ?? "…",
													})
												: t("admin.students.enroll.willMove", {
														className: targetClass?.name ?? "…",
													})
										: t("admin.students.enroll.willEnroll", {
												className: targetClass?.name ?? "…",
											})}
								</p>
								{selectedStudent && selectedStudent.class !== classId && (
									<p className="text-muted-foreground">
										{t("admin.students.enroll.registrationKept", {
											registrationNumber: selectedStudent.registrationNumber,
										})}
									</p>
								)}
							</div>
						) : null}
					</div>
				)}

				<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
					<Button
						type="button"
						variant="outline"
						disabled={submitting}
						onClick={() => call.end(undefined)}
					>
						{t("common.cancel")}
					</Button>
					<Button
						type="submit"
						disabled={
							submitting ||
							!canSubmit ||
							(selectedStudent && selectedStudent.class === classId)
						}
					>
						{submitting
							? t("common.saving")
							: t("admin.students.enroll.submit")}
					</Button>
				</div>
			</form>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);

function Field({
	id,
	label,
	value,
	onChange,
	type = "text",
	required,
	hint,
}: {
	id: string;
	label: string;
	value: string;
	onChange: (value: string) => void;
	type?: string;
	required?: boolean;
	hint?: string;
}) {
	return (
		<div className="space-y-1">
			<Label htmlFor={id}>
				{label}
				{required ? <span className="text-destructive"> *</span> : null}
			</Label>
			<Input
				id={id}
				type={type}
				required={required}
				value={value}
				onChange={(e) => onChange(e.target.value)}
			/>
			{hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
		</div>
	);
}
