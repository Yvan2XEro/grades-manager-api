import { useQuery, type useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { upsertInList } from "@/lib/query-cache";
import { trpcClient } from "@/utils/trpc";
import { ClassFormDialog } from "../components/class-form-dialog";

export type ClassOption = {
	id: string;
	name: string;
	code: string;
	program: string;
	programCode?: string | null;
	academicYearName?: string;
	semesterId?: string | null;
	semesterCode?: string | null;
	cycleLevelCode?: string | null;
};

export type CourseOption = {
	id: string;
	name: string;
	code: string;
};

type RawClass = Awaited<
	ReturnType<typeof trpcClient.classes.search.query>
>[number];

export const toClassOption = (cls: RawClass): ClassOption => ({
	id: cls.id,
	name: cls.name,
	code: cls.code,
	program: cls.program,
	programCode: cls.programInfo?.code ?? null,
	cycleLevelCode: cls.cycleLevel?.code ?? null,
	academicYearName: cls.academicYearInfo?.name ?? "",
	semesterId: cls.semester?.id ?? null,
	semesterCode: cls.semester?.code ?? null,
});

/** Option lists of the class-course forms (own keys: other pages cache raw rows under ["classes"]). */
export const CLASSES_KEY = ["class-options"];
export const COURSES_KEY = ["course-options"];

export const fetchClassOptions = async () => {
	const { items } = await trpcClient.classes.list.query({ limit: 100 });
	return items.map((cls) => toClassOption(cls as RawClass));
};

export const fetchCourseOptions = async () => {
	const { items } = await trpcClient.courses.list.query({ limit: 100 });
	return items.map(
		(course): CourseOption => ({
			id: course.id,
			name: course.name,
			code: course.code,
		}),
	);
};

/** Classes list with server search past 2 characters. */
export function useClassOptions(search: string) {
	const { data: defaults = [] } = useQuery({
		queryKey: CLASSES_KEY,
		queryFn: fetchClassOptions,
	});
	const { data: found = [] } = useQuery({
		queryKey: [...CLASSES_KEY, "search", search],
		queryFn: async () =>
			(await trpcClient.classes.search.query({ query: search })).map((cls) =>
				toClassOption(cls as RawClass),
			),
		enabled: search.length >= 2,
	});
	return search.length >= 2 ? found : defaults;
}

export function useProgramNames() {
	const { data: programs = [] } = useQuery({
		queryKey: ["programs"],
		queryFn: async () => {
			const { items } = await trpcClient.programs.list.query({ limit: 100 });
			return items;
		},
	});
	return useMemo(
		() =>
			new Map(
				programs.map((p: { id: string; name: string; code: string }) => [
					p.id,
					p,
				]),
			),
		[programs],
	);
}

/**
 * Creates a class through the nested class form, inserts it in the shared
 * classes cache and returns it as a select option.
 */
export async function quickCreateClass(
	queryClient: ReturnType<typeof useQueryClient>,
	academicYearId?: string | null,
) {
	const created = await ClassFormDialog.call({
		defaults: { academicYearId: academicYearId ?? undefined },
	});
	if (!created) return;
	// The create result lacks the joined labels; refetch the row to get them.
	const [row] = await trpcClient.classes.search.query({ query: created.code });
	const option = row
		? toClassOption(row as RawClass)
		: {
				id: created.id,
				name: created.name,
				code: created.code,
				program: created.program,
			};
	queryClient.setQueryData<ClassOption[]>(CLASSES_KEY, (old) =>
		upsertInList(old ?? [], option),
	);
	return option;
}
