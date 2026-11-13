import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Layers } from "lucide-react";
import { useState } from "react";
import { createCallable } from "react-call";
import { useMutationFlow } from "react-call/mutation-flow";
import { useTranslation } from "react-i18next";
import {
	CallableDialog,
	DIALOG_EXIT_MS,
} from "@/components/callable/callable-dialog";
import { CodedEntitySelect } from "@/components/forms";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { generateClassCourseCode } from "@/lib/code-generator";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import {
	quickCreateClass,
	useClassOptions,
	useProgramNames,
} from "../hooks/use-class-options";

// ── UE bulk assignment ─────────────────────────────────────────────────────

/**
 * Assigns every course (EC) of a teaching unit to a class with its default
 * teacher and coefficient. A missing class can be created in place.
 */
export const AssignTeachingUnitDialog = createCallable<
	{ existingCodes: string[]; academicYearId?: string | null },
	boolean
>(({ call, existingCodes, academicYearId }) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [classSearch, setClassSearch] = useState("");
	const [classId, setClassId] = useState("");
	const [teachingUnitId, setTeachingUnitId] = useState("");
	const [skippedCourses, setSkippedCourses] = useState<string[]>([]);

	const classes = useClassOptions(classSearch);
	const programMap = useProgramNames();
	const selectedClass = classes.find((c) => c.id === classId);

	const { data: teachingUnits = [] } = useQuery({
		queryKey: ["teachingUnits", selectedClass?.program],
		queryFn: async () => {
			if (!selectedClass?.program) return [];
			const { items } = await trpcClient.teachingUnits.list.query({
				programId: selectedClass.program,
			});
			return items;
		},
		enabled: Boolean(selectedClass?.program),
	});

	const createClass = async () => {
		const option = await quickCreateClass(queryClient, academicYearId);
		if (!option) return;
		setClassSearch("");
		setClassId(option.id);
		setTeachingUnitId("");
		return option;
	};

	const assign = useMutationFlow(call, async (call) => {
		if (!selectedClass || !teachingUnitId) return;
		try {
			const { items: courses } = await trpcClient.courses.list.query({
				teachingUnitId,
				limit: 200,
			});
			const skipped: string[] = [];
			const toCreate: Array<{
				code: string;
				class: string;
				course: string;
				teacher: string;
				coefficient: number;
				semesterId?: string;
			}> = [];
			for (const course of courses) {
				if (!course.defaultTeacher) {
					skipped.push(course.name);
					continue;
				}
				const programCode =
					selectedClass.programCode ??
					programMap.get(selectedClass.program)?.code;
				toCreate.push({
					code: generateClassCourseCode({
						programCode: programCode ?? "PRG",
						levelCode: selectedClass.cycleLevelCode,
						semesterCode: selectedClass.semesterCode,
						existingCodes: [...existingCodes, ...toCreate.map((c) => c.code)],
					}),
					class: selectedClass.id,
					course: course.id,
					teacher: course.defaultTeacher,
					coefficient: Number(course.defaultCoefficient) || 1,
					semesterId: selectedClass.semesterId ?? undefined,
				});
			}
			for (const data of toCreate) {
				await trpcClient.classCourses.create.mutate(data);
			}
			queryClient.invalidateQueries({
				queryKey: trpc.classCourses.listPaged.queryKey(),
			});
			if (toCreate.length > 0) {
				toast.success(
					t("admin.classCourses.toast.bulkAssignSuccess", {
						defaultValue: "{{count}} cours assignés avec succès",
						count: toCreate.length,
					}),
				);
			}
			// Keep the dialog open to list the skipped courses
			if (skipped.length > 0) setSkippedCourses(skipped);
			else call.end(true);
		} catch (error) {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.classCourses.toast.bulkAssignError", {
							defaultValue: "Erreur lors de l'assignation",
						});
			toast.error(message);
		}
	});

	return (
		<CallableDialog
			call={call}
			dismissValue={skippedCourses.length > 0}
			preventDismiss={assign.pending}
			title={t("admin.classCourses.ueAssign.title", {
				defaultValue: "Assigner une unité d'enseignement",
			})}
		>
			{skippedCourses.length > 0 ? (
				<div className="space-y-4">
					<div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
						<AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-600" />
						<div>
							<p className="font-medium text-yellow-800">
								{t("admin.classCourses.ueAssign.skippedTitle", {
									defaultValue: "Certains cours n'ont pas été assignés",
								})}
							</p>
							<p className="mt-1 text-sm text-yellow-700">
								{t("admin.classCourses.ueAssign.skippedDesc", {
									defaultValue:
										"Les cours suivants n'ont pas d'enseignant par défaut et ont été ignorés :",
								})}
							</p>
							<ul className="mt-2 list-inside list-disc text-sm text-yellow-700">
								{skippedCourses.map((name) => (
									<li key={name}>{name}</li>
								))}
							</ul>
						</div>
					</div>
					<div className="flex justify-end">
						<Button onClick={() => call.end(true)}>
							{t("common.actions.close")}
						</Button>
					</div>
				</div>
			) : (
				<div className="space-y-4">
					<div>
						<label className="mb-2 block font-medium text-sm">
							{t("admin.classCourses.ueAssign.classLabel", {
								defaultValue: "Classe",
							})}
						</label>
						<CodedEntitySelect
							items={classes}
							onSearch={setClassSearch}
							value={classes.find((c) => c.id === classId)?.code || null}
							onChange={(code) => {
								const cls = classes.find((c) => c.code === code);
								setClassId(cls?.id || "");
								setTeachingUnitId("");
							}}
							placeholder={t("admin.classCourses.ueAssign.classPlaceholder", {
								defaultValue: "Sélectionner une classe",
							})}
							searchMode="hybrid"
							getItemSubtitle={(cls) => programMap.get(cls.program)?.name ?? ""}
							onCreate={createClass}
							createLabel={t("admin.classes.actions.add")}
						/>
					</div>

					{classId && (
						<div>
							<label className="mb-2 block font-medium text-sm">
								{t("admin.classCourses.ueAssign.ueLabel", {
									defaultValue: "Unité d'enseignement",
								})}
							</label>
							<Select
								value={teachingUnitId}
								onValueChange={setTeachingUnitId}
								disabled={teachingUnits.length === 0}
							>
								<SelectTrigger>
									<SelectValue
										placeholder={t(
											"admin.classCourses.ueAssign.uePlaceholder",
											{
												defaultValue: "Sélectionner une UE",
											},
										)}
									/>
								</SelectTrigger>
								<SelectContent>
									{teachingUnits.map(
										(ue: { id: string; code: string; name: string }) => (
											<SelectItem key={ue.id} value={ue.id}>
												{ue.code} - {ue.name}
											</SelectItem>
										),
									)}
								</SelectContent>
							</Select>
							{teachingUnits.length === 0 && (
								<p className="mt-1 text-muted-foreground text-xs">
									{t("admin.classCourses.ueAssign.noUe", {
										defaultValue: "Aucune UE trouvée pour ce programme",
									})}
								</p>
							)}
						</div>
					)}

					<p className="text-muted-foreground text-xs">
						{t("admin.classCourses.ueAssign.hint", {
							defaultValue:
								"Tous les EC de l'UE seront assignés à la classe avec leur enseignant et coefficient par défaut. Les EC sans enseignant par défaut seront ignorés.",
						})}
					</p>

					<div className="flex justify-end gap-2">
						<Button
							variant="outline"
							onClick={() => call.end(false)}
							disabled={assign.pending}
						>
							{t("common.actions.cancel")}
						</Button>
						<Button
							onClick={() => assign()}
							disabled={!classId || !teachingUnitId || assign.pending}
						>
							{assign.pending ? (
								<Spinner className="mr-2 h-4 w-4" />
							) : (
								<Layers className="mr-2 h-4 w-4" />
							)}
							{t("admin.classCourses.ueAssign.submit", {
								defaultValue: "Assigner les cours",
							})}
						</Button>
					</div>
				</div>
			)}
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);
