import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
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

	const handleDelete = (id: string) => {
		deleteUnit.mutate(id);
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
					<h1 className="font-semibold text-2xl text-gray-900">
						{t("admin.teachingUnits.title", { defaultValue: "Teaching Units" })}
					</h1>
					<p className="text-gray-600">
						{t("admin.teachingUnits.subtitle", {
							defaultValue: "Manage UE catalog, semesters, and prerequisites.",
						})}
					</p>
				</div>
				<select
					className="rounded-lg border px-3 py-2"
					value={selectedProgram}
					onChange={(event) => {
						const value = event.target.value;
						setSelectedProgram(value);
						setForm((prev) => ({ ...prev, programId: value }));
					}}
				>
					<option value="">
						{t("admin.teachingUnits.selectProgram", {
							defaultValue: "Select program",
						})}
					</option>
					{programs?.items?.map((program) => (
						<option key={program.id} value={program.id}>
							{program.name}
						</option>
					))}
				</select>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<form
					onSubmit={handleCreateUnit}
					className="rounded-xl border bg-white p-6 shadow-sm"
				>
					<h2 className="font-semibold text-gray-900 text-lg">
						{t("admin.teachingUnits.new", { defaultValue: "Create new UE" })}
					</h2>
					<div className="mt-4 grid gap-4">
						<input
							className="rounded-lg border px-3 py-2"
							placeholder={t("admin.teachingUnits.fields.name", {
								defaultValue: "Unit name",
							})}
							value={form.name}
							onChange={(event) =>
								setForm((prev) => ({ ...prev, name: event.target.value }))
							}
							required
						/>
						<input
							className="rounded-lg border px-3 py-2"
							placeholder={t("admin.teachingUnits.fields.code", {
								defaultValue: "Code",
							})}
							value={form.code}
							onChange={(event) =>
								setForm((prev) => ({ ...prev, code: event.target.value }))
							}
							required
						/>
						<textarea
							className="rounded-lg border px-3 py-2"
							placeholder={t("admin.teachingUnits.fields.description", {
								defaultValue: "Description",
							})}
							value={form.description}
							onChange={(event) =>
								setForm((prev) => ({
									...prev,
									description: event.target.value,
								}))
							}
						/>
						<div className="flex gap-3">
							<input
								type="number"
								className="w-32 rounded-lg border px-3 py-2"
								min={0}
								value={form.credits}
								onChange={(event) =>
									setForm((prev) => ({
										...prev,
										credits: Number(event.target.value),
									}))
								}
								placeholder={t("admin.teachingUnits.fields.credits", {
									defaultValue: "ECTS",
								})}
							/>
							<select
								className="flex-1 rounded-lg border px-3 py-2"
								value={form.semester}
								onChange={(event) =>
									setForm((prev) => ({
										...prev,
										semester: event.target.value as UnitForm["semester"],
									}))
								}
							>
								<option value="annual">
									{t("admin.teachingUnits.semesters.annual", {
										defaultValue: "Annual",
									})}
								</option>
								<option value="fall">
									{t("admin.teachingUnits.semesters.fall", {
										defaultValue: "Fall",
									})}
								</option>
								<option value="spring">
									{t("admin.teachingUnits.semesters.spring", {
										defaultValue: "Spring",
									})}
								</option>
							</select>
						</div>
					</div>
					<button
						type="submit"
						className="mt-4 rounded-lg bg-primary-600 px-4 py-2 font-medium text-white"
						disabled={createUnit.isLoading}
					>
						{t("admin.teachingUnits.actions.create", {
							defaultValue: "Create UE",
						})}
					</button>
				</form>

				<div className="rounded-xl border bg-white p-6 shadow-sm">
					<h2 className="font-semibold text-gray-900 text-lg">
						{t("admin.teachingUnits.list", { defaultValue: "Units list" })}
					</h2>
					<div className="mt-4 space-y-3">
						{units?.items?.length ? (
							units.items.map((unit) => (
								<div
									key={unit.id}
									className="flex items-center justify-between rounded-lg border px-3 py-2"
								>
									<div>
										<p className="font-medium text-gray-900">{unit.name}</p>
										<p className="text-gray-600 text-sm">
											{unit.code} • {unit.semester?.toUpperCase()} •{" "}
											{unit.credits} ECTS
										</p>
									</div>
									<button
										type="button"
										onClick={() => handleDelete(unit.id)}
										className="text-red-600 text-sm hover:text-red-700"
									>
										{t("admin.teachingUnits.actions.delete", {
											defaultValue: "Remove",
										})}
									</button>
								</div>
							))
						) : (
							<p className="text-gray-500 text-sm">
								{t("admin.teachingUnits.empty", {
									defaultValue: "No units yet for this program.",
								})}
							</p>
						)}
					</div>
				</div>
			</div>

			<div className="rounded-xl border bg-white p-6 shadow-sm">
				<h2 className="font-semibold text-gray-900 text-lg">
					{t("admin.teachingUnits.prereqTitle", {
						defaultValue: "Manage course prerequisites",
					})}
				</h2>
				<div className="mt-4 grid gap-4 md:grid-cols-2">
					<select
						className="rounded-lg border px-3 py-2"
						value={selectedCourse}
						onChange={(event) => {
							const value = event.target.value;
							setSelectedCourse(value);
							setPrereqSelection([]);
						}}
						disabled={!availableCourses.length}
					>
						<option value="">
							{t("admin.teachingUnits.prereqSelectCourse", {
								defaultValue: "Choose a course",
							})}
						</option>
						{availableCourses.map((course) => (
							<option key={course.id} value={course.id}>
								{course.name}
							</option>
						))}
					</select>

					{selectedCourse && (
						<div className="space-y-2">
							<p className="text-gray-600 text-sm">
								{t("admin.teachingUnits.prereqHint", {
									defaultValue: "Select prerequisite courses",
								})}
							</p>
							<div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border p-3">
								{currentUnitCourses.map((course) => (
									<label
										key={course.id}
										className="flex items-center space-x-2"
									>
										<input
											type="checkbox"
											checked={prereqSelection.includes(course.id)}
											onChange={(event) => {
												const checked = event.target.checked;
												setPrereqSelection((prev) =>
													checked
														? [...prev, course.id]
														: prev.filter((id) => id !== course.id),
												);
											}}
										/>
										<span className="text-gray-800 text-sm">{course.name}</span>
									</label>
								))}
							</div>
							<button
								type="button"
								onClick={() =>
									updatePrereqs.mutate({
										courseId: selectedCourse,
										prerequisites: prereqSelection,
									})
								}
								className="rounded-lg bg-primary-600 px-4 py-2 font-medium text-sm text-white"
							>
								{t("admin.teachingUnits.actions.savePrereq", {
									defaultValue: "Save prerequisites",
								})}
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default TeachingUnitManagement;
