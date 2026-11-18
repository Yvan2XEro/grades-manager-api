import { Navigate, useParams } from "react-router";

/** `/deliberations/:id[/tab]` → `/academic-results/deliberations/:id[/tab]`. */
export function DeliberationLegacyRedirect() {
	const { deliberationId, "*": tab } = useParams<{
		deliberationId: string;
		"*": string;
	}>();
	return (
		<Navigate
			to={`/academic-results/deliberations/${deliberationId}${tab ? `/${tab}` : ""}`}
			replace
		/>
	);
}
