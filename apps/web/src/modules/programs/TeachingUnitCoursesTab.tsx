import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { trpc } from "@/utils/trpc";
import { TeachingUnitCoursesTable } from "./TeachingUnitCoursesTable";

export default function TeachingUnitCoursesTab() {
	const { teachingUnitId } = useParams<{ teachingUnitId: string }>();
	const { data: teachingUnit } = useQuery(
		trpc.teachingUnits.getById.queryOptions({ id: teachingUnitId! }),
	);
	if (!teachingUnit) return null;
	return (
		<TeachingUnitCoursesTable
			teachingUnitId={teachingUnit.id}
			programId={teachingUnit.programId}
			semesterCode={teachingUnit.semester}
		/>
	);
}
