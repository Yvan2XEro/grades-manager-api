import { Navigate } from "react-router";
import { useSession } from "@/lib/auth-client";

interface Props {
	children: React.ReactNode;
}

export function ProtectedRoute({ children }: Props) {
	const { data: session, isPending } = useSession();

	if (isPending) return null;

	if (!session) {
		return <Navigate to="/login" replace />;
	}

	return <>{children}</>;
}
