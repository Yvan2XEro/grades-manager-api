import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { type RouterOutputs, trpcClient } from "@/utils/trpc";

export type Teacher = RouterOutputs["users"]["list"]["items"][number];

/** Query key of the teachers list shared by the course forms. */
export const TEACHERS_KEY = ["teachers"];

export const fetchTeachers = async () => {
	const { items } = await trpcClient.users.list.query({
		role: "teacher",
		limit: 200,
	});
	return items;
};

export const formatTeacherName = (teacher: Teacher) =>
	[teacher.firstName, teacher.lastName].filter(Boolean).join(" ") ||
	teacher.email;

/** Teachers feeding the course forms (shared cache key). */
export function useTeachers() {
	return useQuery({ queryKey: TEACHERS_KEY, queryFn: fetchTeachers });
}

/** Teachers' display names by id. */
export function useTeacherNames() {
	const { data: teachers } = useTeachers();
	return useMemo(
		() =>
			new Map(
				(teachers ?? []).map((teacher) => [
					teacher.id,
					formatTeacherName(teacher),
				]),
			),
		[teachers],
	);
}
