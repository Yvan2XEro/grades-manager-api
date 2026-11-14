import { Navigate } from "react-router";

/** The rules now live on the promotion page. */
const RulesRedirectPage = () => {
	return <Navigate to="/promotion-legacy?tab=rules" replace />;
};

export default RulesRedirectPage;
