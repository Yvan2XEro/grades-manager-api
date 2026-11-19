import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { upsertInList } from "@/lib/query-cache";
import { AcademicYearFormDialog } from "@/modules/academic-years/components/academic-year-form-dialog";
import { CycleLevelFormDialog } from "@/modules/institution/components/cycle-level-form-dialog";
import { ProgramFormDialog } from "@/modules/programs/components/program-form-dialog";
import { ProgramOptionFormDialog } from "@/modules/programs/components/program-option-form-dialog";
import { trpc, trpcClient } from "@/utils/trpc";

export type CycleLevelOption = {
	id: string;
	code: string;
	name: string;
	cycle: { id: string; name: string; code: string | null };
};
type ProgramOptionItem = { id: string; code: string; name: string };
type StudyCycleItem = { id: string; code: string | null; name: string };

/** Query keys of the lists feeding the class form selects. */
export const classFormKeys = {
	programs: ["programs"],
	cycleLevels: (cycleId: string) => ["cycleLevelsByProgram", cycleId],
	programOptions: (programId: string | undefined) => [
		"programOptions",
		programId,
	],
	semesters: ["semesters"],
} as const;

export const fetchPrograms = async () => {
	const { items } = await trpcClient.programs.list.query({ limit: 100 });
	return items;
};

/** Levels of a cycle, each carrying its cycle (shown as the option subtitle). */
async function fetchCycleLevels(cycleId: string, search?: string) {
	const { items: cycles } = await trpcClient.studyCycles.listCycles.query({
		limit: 100,
	});
	const cycle = (cycles as StudyCycleItem[]).find((c) => c.id === cycleId);
	if (!cycle) return [];
	const levels = search
		? await trpcClient.cycleLevels.search.query({ query: search, cycleId })
		: await trpcClient.studyCycles.listLevels.query({ cycleId });
	return (levels as Omit<CycleLevelOption, "cycle">[]).map((level) => ({
		...level,
		cycle: { id: cycle.id, name: cycle.name, code: cycle.code },
	}));
}

/**
 * "SIN-BTS1-2627": program code, level code and the two short years of the
 * academic year (from its name, else its dates).
 */
function classCodeSuggestion(
	programCode: string | null | undefined,
	levelCode: string | null | undefined,
	year: { name: string; startDate: string | Date; endDate: string | Date },
) {
	const fromName = (year.name.match(/\d{4}/g) ?? []).map((y) => y.slice(-2));
	const digits =
		fromName.length >= 2
			? fromName.join("")
			: [year.startDate, year.endDate]
					.map((d) => String(new Date(d).getFullYear()).slice(-2))
					.join("");
	return [programCode, levelCode, digits]
		.filter(Boolean)
		.join("-")
		.replace(/\s+/g, "")
		.toUpperCase();
}

const classSchema = (t: TFunction) =>
	z.object({
		programId: z.string({ error: t("admin.classes.validation.program") }),
		academicYearId: z.string({
			error: t("admin.classes.validation.academicYear"),
		}),
		cycleLevelId: z.string({
			error: t("admin.classes.validation.cycleLevel"),
		}),
		programOptionId: z.string({
			error: t("admin.classes.validation.programOption"),
		}),
		semesterId: z.string().optional(),
		code: z.string().min(3, t("admin.classes.validation.code")),
		name: z.string().min(2, t("admin.classes.validation.name")),
		totalCredits: z.coerce.number().int().min(0).default(0),
	});

export type ClassFormInput = z.input<ReturnType<typeof classSchema>>;
export type ClassFormData = z.output<ReturnType<typeof classSchema>>;

/** Payload of `classes.create` / `classes.update` for the form values. */
export const toClassPayload = (data: ClassFormData) => ({
	name: data.name,
	program: data.programId,
	academicYear: data.academicYearId,
	cycleLevelId: data.cycleLevelId,
	programOptionId: data.programOptionId,
	semesterId: data.semesterId || undefined,
	code: data.code,
	totalCredits: data.totalCredits,
});

const EMPTY: ClassFormInput = {
	programId: "",
	academicYearId: "",
	cycleLevelId: "",
	programOptionId: "",
	semesterId: "",
	code: "",
	name: "",
	totalCredits: 0,
};

interface UseClassFormOptions {
	/**
	 * `create` derives the name from option + year, suggests a code and picks
	 * the first level/option; `edit` keeps the stored values untouched.
	 */
	mode: "create" | "edit";
	values?: Partial<ClassFormInput>;
	/** Codes already used, so the suggested code doesn't collide. */
	existingCodes?: string[];
}

/**
 * Form state and option lists of a class (program → cycle level / option,
 * year, semester). Every select can create its missing entity in place.
 */
export function useClassForm({
	mode,
	values,
	existingCodes = [],
}: UseClassFormOptions) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const schema = useMemo(() => classSchema(t), [t]);
	const form = useForm<ClassFormInput, unknown, ClassFormData>({
		resolver: zodResolver(schema),
		defaultValues: { ...EMPTY, ...values },
	});
	const { watch, setValue } = form;
	const [programSearch, setProgramSearch] = useState("");
	const [cycleLevelSearch, setCycleLevelSearch] = useState("");
	const [programOptionSearch, setProgramOptionSearch] = useState("");

	// Programs
	const { data: defaultPrograms = [] } = useQuery({
		queryKey: classFormKeys.programs,
		queryFn: fetchPrograms,
	});
	const { data: searchPrograms = [] } = useQuery({
		queryKey: ["programs", "search", programSearch],
		queryFn: () => trpcClient.programs.search.query({ query: programSearch }),
		enabled: programSearch.length >= 2,
	});
	const programs = programSearch.length >= 2 ? searchPrograms : defaultPrograms;
	const programId = watch("programId");
	const program = programs.find((p) => p.id === programId);
	const cycleId = program?.cycleId ?? "";

	// Academic years
	const { data: yearsData } = useQuery(
		trpc.academicYears.list.queryOptions({}),
	);
	const academicYearId = watch("academicYearId");

	// Cycle levels of the program's cycle
	const { data: defaultCycleLevels = [] } = useQuery({
		queryKey: classFormKeys.cycleLevels(cycleId),
		queryFn: () => fetchCycleLevels(cycleId),
		enabled: Boolean(cycleId),
	});
	const { data: searchCycleLevels = [] } = useQuery({
		queryKey: ["cycleLevels", "search", cycleLevelSearch, cycleId],
		queryFn: () => fetchCycleLevels(cycleId, cycleLevelSearch),
		enabled: Boolean(cycleId) && cycleLevelSearch.length >= 2,
	});
	const cycleLevels =
		cycleLevelSearch.length >= 2 ? searchCycleLevels : defaultCycleLevels;
	const cycleLevelId = watch("cycleLevelId");
	const cycleLevel = cycleLevels.find((level) => level.id === cycleLevelId);

	// Semesters
	const { data: semestersData } = useQuery({
		queryKey: classFormKeys.semesters,
		queryFn: () => trpcClient.semesters.list.query(),
	});
	const semesters = semestersData?.items ?? [];

	// Program options
	const { data: defaultProgramOptions = [] } = useQuery({
		queryKey: classFormKeys.programOptions(program?.id),
		queryFn: async () =>
			(
				await trpcClient.programOptions.list.query({
					programId: program!.id,
					limit: 100,
				})
			).items as ProgramOptionItem[],
		enabled: Boolean(program?.id),
	});
	const { data: searchProgramOptions = [] } = useQuery({
		queryKey: ["programOptions", "search", programOptionSearch, program?.id],
		queryFn: async () =>
			(await trpcClient.programOptions.search.query({
				query: programOptionSearch,
				programId: program!.id,
			})) as ProgramOptionItem[],
		enabled: Boolean(program?.id) && programOptionSearch.length >= 2,
	});
	const programOptions =
		programOptionSearch.length >= 2
			? searchProgramOptions
			: defaultProgramOptions;
	const programOptionId = watch("programOptionId");
	const programOption = programOptions.find((o) => o.id === programOptionId);

	// Derived values (create only)
	const deriving = mode === "create";
	useEffect(() => {
		if (!deriving || program) return;
		setValue("cycleLevelId", "");
		setValue("programOptionId", "");
	}, [deriving, program, setValue]);

	useEffect(() => {
		if (!deriving || !cycleLevels.length) return;
		if (!cycleLevels.some((l) => l.id === cycleLevelId))
			setValue("cycleLevelId", cycleLevels[0].id);
	}, [deriving, cycleLevels, cycleLevelId, setValue]);

	useEffect(() => {
		if (!deriving || !programOptions.length) return;
		if (!programOptions.some((o) => o.id === programOptionId))
			setValue("programOptionId", programOptions[0].id);
	}, [deriving, programOptions, programOptionId, setValue]);

	// Classes of the chosen year: the suggested code and name must not collide
	const { data: yearClasses } = useQuery({
		...trpc.classes.list.queryOptions({
			academicYearId: academicYearId || undefined,
			limit: 500,
		}),
		enabled: deriving && Boolean(academicYearId),
	});

	// Suggested name and code, same convention as the classes created by the
	// promotion: "Sciences Infirmières – BTS 1ère année" / "SIN-BTS1-2627".
	// The option is added to the name only when the program has several.
	const year = yearsData?.items.find((y) => y.id === academicYearId);
	const suggestion = useMemo(() => {
		if (!program || !cycleLevel || !year) return null;
		const taken = yearClasses?.items ?? [];
		const baseName = [
			`${program.name} – ${cycleLevel.name}`,
			programOption && programOptions.length > 1
				? ` (${programOption.name})`
				: "",
		].join("");
		const baseCode = classCodeSuggestion(program.code, cycleLevel.code, year);
		const codes = new Set([...taken.map((c) => c.code), ...existingCodes]);
		const names = new Set(
			taken.filter((c) => c.program === program.id).map((c) => c.name),
		);
		let name = baseName;
		let code = baseCode;
		for (let i = 2; codes.has(code) || names.has(name); i++) {
			name = `${baseName} (${i})`;
			code = `${baseCode}-${i}`;
		}
		return { name, code };
	}, [
		program,
		cycleLevel,
		programOption,
		programOptions.length,
		year,
		yearClasses,
		existingCodes,
	]);

	const code = watch("code");
	const name = watch("name");
	const codeDirty = Boolean(form.formState.dirtyFields.code);
	const nameDirty = Boolean(form.formState.dirtyFields.name);
	useEffect(() => {
		if (!deriving || !suggestion) return;
		if (!nameDirty && name !== suggestion.name)
			setValue("name", suggestion.name, { shouldDirty: false });
		if (!codeDirty && code !== suggestion.code)
			setValue("code", suggestion.code, { shouldDirty: false });
	}, [deriving, suggestion, name, code, nameDirty, codeDirty, setValue]);

	// Quick create (nested Callables)
	const select = (field: keyof ClassFormInput, id: string) =>
		setValue(field, id, { shouldValidate: true, shouldDirty: true });

	const createProgram = async () => {
		const created = await ProgramFormDialog.call({});
		if (!created) return;
		queryClient.setQueryData<Awaited<ReturnType<typeof fetchPrograms>>>(
			classFormKeys.programs,
			(old) => upsertInList(old, { ...created, optionsCount: 0 }),
		);
		setProgramSearch("");
		select("programId", created.id);
		return created;
	};

	const createAcademicYear = async () => {
		const year = await AcademicYearFormDialog.call({});
		if (!year) return;
		queryClient.setQueryData(trpc.academicYears.list.queryKey({}), (old) =>
			upsertInList(old, year),
		);
		select("academicYearId", year.id);
	};

	const createCycleLevel = async () => {
		if (!cycleId) return;
		const level = await CycleLevelFormDialog.call({
			cycleId,
			defaults: { code: `${program?.code ?? "L"}-L${cycleLevels.length + 1}` },
		});
		if (!level) return;
		const cycle = cycleLevels[0]?.cycle ?? {
			id: cycleId,
			name: "",
			code: null,
		};
		const option = { ...level, cycle } as CycleLevelOption;
		queryClient.setQueryData<CycleLevelOption[]>(
			classFormKeys.cycleLevels(cycleId),
			(old) => upsertInList(old ?? [], option),
		);
		setCycleLevelSearch("");
		select("cycleLevelId", level.id);
		return option;
	};

	const createProgramOption = async () => {
		if (!program) return;
		const option = await ProgramOptionFormDialog.call({
			programId: program.id,
		});
		if (!option) return;
		queryClient.setQueryData<ProgramOptionItem[]>(
			classFormKeys.programOptions(program.id),
			(old) => upsertInList(old ?? [], option),
		);
		setProgramOptionSearch("");
		select("programOptionId", option.id);
		return option;
	};

	return {
		form,
		mode,
		programs,
		program,
		cycleLevels,
		cycleLevel,
		programOptions,
		programOption,
		semesters,
		search: {
			program: setProgramSearch,
			cycleLevel: setCycleLevelSearch,
			programOption: setProgramOptionSearch,
		},
		create: {
			program: createProgram,
			academicYear: createAcademicYear,
			cycleLevel: createCycleLevel,
			programOption: createProgramOption,
		},
	};
}

export type ClassFormController = ReturnType<typeof useClassForm>;
