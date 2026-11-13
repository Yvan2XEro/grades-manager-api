import { Navigate, useParams } from "react-router";

export function DeliberationLegacyRedirect() {
	const { deliberationId } = useParams<{ deliberationId: string }>();
	return (
		<Navigate
			to={`/admin/academic-results/deliberations/${deliberationId}`}
			replace
		/>
	);
}
