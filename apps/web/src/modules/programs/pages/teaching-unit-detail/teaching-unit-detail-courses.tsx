import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { trpc } from "@/utils/trpc";
import { TeachingUnitCoursesCard } from "../../components/teaching-unit-courses-card";

export default function TeachingUnitDetailCourses() {
	const { teachingUnitId } = useParams<{ teachingUnitId: string }>();
	const { data: teachingUnit } = useQuery(
		trpc.teachingUnits.getById.queryOptions({ id: teachingUnitId! }),
	);
	if (!teachingUnit) return null;
	return (
		<TeachingUnitCoursesCard
			teachingUnitId={teachingUnit.id}
			programId={teachingUnit.programId}
			semesterCode={teachingUnit.semester}
		/>
	);
}
