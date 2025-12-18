import { useQueryState } from "nuqs";
import { Navigate } from "react-router";
import type { User } from "@/store";
import LoadingScreen from "../ui/LoadingScreen";

export const roleLayoutMap = {
	administrator: <Navigate to="/admin" replace />,
	super_admin: <Navigate to="/admin" replace />,
	owner: <Navigate to="/admin" replace />,
	dean: <Navigate to="/dean" replace />,
	teacher: <Navigate to="/teacher" replace />,
	student: <Navigate to="/student" replace />,
	staff: <Navigate to="/staff" replace />,
	guest: <Navigate to={"/auth/login"} />,
};

export const Redirector = ({
	isPending,
	user,
}: {
	isPending: boolean;
	user?: User;
}) => {
	const pathName = window.location.pathname;
	const [callbackURL] = useQueryState("return", {});

	if (isPending) return <LoadingScreen />;

	if (!user) return <Navigate to={`/auth/login?return=${pathName}`} />;
	if (callbackURL) return <Navigate to={callbackURL} />;
	return roleLayoutMap[user.role];
};
