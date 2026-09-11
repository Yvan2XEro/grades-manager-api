import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useSession } from "@/lib/auth-client";

interface Props {
	children: React.ReactNode;
}

export function SystemAdminGuard({ children }: Props) {
	const { data: session, isPending } = useSession();
	const navigate = useNavigate();

	useEffect(() => {
		if (isPending) return;
		if (!session) {
			navigate("/login", { replace: true });
			return;
		}
		// Better-Auth admin plugin sets user.role = "admin" on system admins
		if ((session.user as { role?: string }).role !== "admin") {
			navigate("/", { replace: true });
		}
	}, [session, isPending, navigate]);

	if (isPending) {
		return (
			<div className="flex h-svh items-center justify-center bg-background">
				<div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
			</div>
		);
	}

	if (!session || (session.user as { role?: string }).role !== "admin") {
		return null;
	}

	return <>{children}</>;
}
