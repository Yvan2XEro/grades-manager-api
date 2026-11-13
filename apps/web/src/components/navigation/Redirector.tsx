import { useQueryState } from "nuqs";
import { Navigate } from "react-router";
import type { User } from "@/store";
import LoadingScreen from "../ui/LoadingScreen";

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
	// Every role lands on `/`, which renders the dashboard of its role group
	if (user.role === "guest") return <Navigate to="/auth/login" />;
	return <Navigate to="/" replace />;
};
