import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc, trpcClient } from "../../utils/trpc";

type UnitForm = {
	name: string;
	code: string;
	credits: number;
	semester: "fall" | "spring" | "annual";
	programId: string;
	description?: string;
};

const defaultForm: UnitForm = {
	name: "",
	code: "",
	credits: 3,
	semester: "annual",
	programId: "",
	description: "",
};

const TeachingUnitManagement = () => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [form, setForm] = useState<UnitForm>(defaultForm);
	const [selectedProgram, setSelectedProgram] = useState<string>("");
	const [selectedCourse, setSelectedCourse] = useState<string>("");
	const [prereqSelection, setPrereqSelection] = useState<string[]>([]);

	const { data: programs } = useQuery(
		trpc.programs.list.queryOptions({ limit: 200 }),
	);

	const { data: units } = useQuery(
		trpc.teachingUnits.list.queryOptions({
			programId: selectedProgram || undefined,
		}),
	);

	const { data: courses } = useQuery({
		...trpc.courses.list.queryOptions({
			programId: selectedProgram || undefined,
		}),
		enabled: Boolean(selectedProgram),
	});

	const createUnit = useMutation({
		mutationFn: (payload: UnitForm) =>
			trpcClient.teachingUnits.create.mutate(payload),
		onSuccess: () => {
			toast.success(
				t("admin.teachingUnits.toast.created", {
					defaultValue: "Teaching unit created",
				}),
			);
			queryClient.invalidateQueries(
				trpc.teachingUnits.list.queryKey({
					programId: selectedProgram || undefined,
				}),
			);
			setForm((prev) => ({ ...defaultForm, programId: prev.programId }));
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const deleteUnit = useMutation({
		mutationFn: (id: string) => trpcClient.teachingUnits.delete.mutate({ id }),
		onSuccess: () => {
			toast.success(
				t("admin.teachingUnits.toast.deleted", {
					defaultValue: "Teaching unit deleted",
				}),
			);
			queryClient.invalidateQueries(
				trpc.teachingUnits.list.queryKey({
					programId: selectedProgram || undefined,
				}),
			);
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const updatePrereqs = useMutation({
		mutationFn: async ({
			courseId,
			prerequisites,
		}: {
			courseId: string;
			prerequisites: string[];
		}) => {
			await trpcClient.courses.update.mutate({
				id: courseId,
				prerequisiteCourseIds: prerequisites,
			});
		},
		onSuccess: () => {
			toast.success(
				t("admin.teachingUnits.toast.prereqSaved", {
					defaultValue: "Prerequisites saved",
				}),
			);
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const handleCreateUnit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!form.programId) {
			toast.error(
				t("admin.teachingUnits.toast.programRequired", {
					defaultValue: "Select a program",
				}),
			);
			return;
		}
		createUnit.mutate(form);
	};

	const availableCourses = useMemo(() => courses?.items ?? [], [courses]);
	const currentUnitCourses = useMemo(() => {
		if (!selectedCourse) return [];
		return availableCourses.filter((course) => course.id !== selectedCourse);
	}, [availableCourses, selectedCourse]);

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="font-semibold text-2xl">
						{t("admin.teachingUnits.title", { defaultValue: "Teaching Units" })}
					</h1>
					<p className="text-muted-foreground">
						{t("admin.teachingUnits.subtitle", {
							defaultValue: "Manage UE catalog, semesters, and prerequisites.",
						})}
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Select
						value={selectedProgram || undefined}
						onValueChange={(value) => {
							setSelectedProgram(value);
							setSelectedCourse("");
							setPrereqSelection([]);
							setForm((prev) => ({ ...prev, programId: value }));
						}}
					>
						<SelectTrigger className="min-w-48">
							<SelectValue
								placeholder={t("admin.teachingUnits.selectProgram", {
									defaultValue: "Select program",
								})}
							/>
						</SelectTrigger>
						<SelectContent>
							{programs?.items?.map((program) => (
								<SelectItem key={program.id} value={program.id}>
									{program.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => {
							setSelectedProgram("");
							setSelectedCourse("");
							setPrereqSelection([]);
							setForm((prev) => ({ ...prev, programId: "" }));
						}}
						disabled={!selectedProgram}
					>
						{t("common.actions.reset", { defaultValue: "Reset" })}
					</Button>
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<Card asChild>
					<form onSubmit={handleCreateUnit}>
						<CardHeader>
							<CardTitle>
								{t("admin.teachingUnits.new", {
									defaultValue: "Create new UE",
								})}
							</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-4">
							<div className="space-y-2">
								<Label htmlFor="unit-name">
									{t("admin.teachingUnits.fields.name", {
										defaultValue: "Unit name",
									})}
								</Label>
								<Input
									id="unit-name"
									value={form.name}
									onChange={(event) =>
										setForm((prev) => ({ ...prev, name: event.target.value }))
									}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="unit-code">
									{t("admin.teachingUnits.fields.code", {
										defaultValue: "Code",
									})}
								</Label>
								<Input
									id="unit-code"
									value={form.code}
									onChange={(event) =>
										setForm((prev) => ({ ...prev, code: event.target.value }))
									}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="unit-description">
									{t("admin.teachingUnits.fields.description", {
										defaultValue: "Description",
									})}
								</Label>
								<Textarea
									id="unit-description"
									value={form.description}
									onChange={(event) =>
										setForm((prev) => ({
											...prev,
											description: event.target.value,
										}))
									}
								/>
							</div>
							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="unit-credits">
										{t("admin.teachingUnits.fields.credits", {
											defaultValue: "ECTS",
										})}
									</Label>
									<Input
										id="unit-credits"
										type="number"
										min={0}
										value={form.credits}
										onChange={(event) =>
											setForm((prev) => ({
												...prev,
												credits: Number(event.target.value),
											}))
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="unit-semester">
										{t("admin.teachingUnits.semesters.annual", {
											defaultValue: "Semester",
										})}
									</Label>
									<Select
										value={form.semester}
										onValueChange={(value) =>
											setForm((prev) => ({
												...prev,
												semester: value as UnitForm["semester"],
											}))
										}
									>
										<SelectTrigger id="unit-semester">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="annual">
												{t("admin.teachingUnits.semesters.annual", {
													defaultValue: "Annual",
												})}
											</SelectItem>
											<SelectItem value="fall">
												{t("admin.teachingUnits.semesters.fall", {
													defaultValue: "Fall",
												})}
											</SelectItem>
											<SelectItem value="spring">
												{t("admin.teachingUnits.semesters.spring", {
													defaultValue: "Spring",
												})}
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
							<Button type="submit" disabled={createUnit.isLoading}>
								{t("admin.teachingUnits.actions.create", {
									defaultValue: "Create UE",
								})}
							</Button>
						</CardContent>
					</form>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>
							{t("admin.teachingUnits.list", { defaultValue: "Units list" })}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{units?.items?.length ? (
							units.items.map((unit) => (
								<div
									key={unit.id}
									className="flex items-center justify-between rounded-lg border px-3 py-2"
								>
									<div>
										<p className="font-medium">{unit.name}</p>
										<p className="text-muted-foreground text-sm">
											{unit.code} • {unit.semester?.toUpperCase()} •{" "}
											{unit.credits} ECTS
										</p>
									</div>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => deleteUnit.mutate(unit.id)}
										className="text-destructive hover:text-destructive"
									>
										{t("admin.teachingUnits.actions.delete", {
											defaultValue: "Remove",
										})}
									</Button>
								</div>
							))
						) : (
							<p className="text-muted-foreground text-sm">
								{t("admin.teachingUnits.empty", {
									defaultValue: "No units yet for this program.",
								})}
							</p>
						)}
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>
						{t("admin.teachingUnits.prereqTitle", {
							defaultValue: "Manage course prerequisites",
						})}
					</CardTitle>
					<CardDescription>
						{t("admin.teachingUnits.prereqHint", {
							defaultValue: "Select prerequisite courses",
						})}
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4 md:grid-cols-2">
					<Select
						disabled={!availableCourses.length}
						value={selectedCourse || undefined}
						onValueChange={(value) => {
							setSelectedCourse(value);
							setPrereqSelection([]);
						}}
					>
						<SelectTrigger>
							<SelectValue
								placeholder={t("admin.teachingUnits.prereqSelectCourse", {
									defaultValue: "Choose a course",
								})}
							/>
						</SelectTrigger>
						<SelectContent>
							{availableCourses.map((course) => (
								<SelectItem key={course.id} value={course.id}>
									{course.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					{selectedCourse ? (
						<div className="space-y-3">
							<div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border p-3">
								{currentUnitCourses.map((course) => (
									<label
										key={course.id}
										className="flex items-center gap-2 text-sm"
										htmlFor={`prereq-${course.id}`}
									>
										<Checkbox
											id={`prereq-${course.id}`}
											checked={prereqSelection.includes(course.id)}
											onCheckedChange={(checked) => {
												setPrereqSelection((prev) =>
													checked
														? [...prev, course.id]
														: prev.filter((value) => value !== course.id),
												);
											}}
										/>
										<span>{course.name}</span>
									</label>
								))}
							</div>
							<Button
								type="button"
								onClick={() =>
									updatePrereqs.mutate({
										courseId: selectedCourse,
										prerequisites: prereqSelection,
									})
								}
								disabled={!prereqSelection.length}
							>
								{t("admin.teachingUnits.actions.savePrereq", {
									defaultValue: "Save prerequisites",
								})}
							</Button>
						</div>
					) : (
						<p className="text-muted-foreground text-sm">
							{t("admin.teachingUnits.prereqSelectCourse", {
								defaultValue: "Choose a course",
							})}
						</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
};

export default TeachingUnitManagement;
