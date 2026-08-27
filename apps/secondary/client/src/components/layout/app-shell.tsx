import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useSession } from "@/lib/auth-client";
import { AdminSidebar } from "./admin-sidebar";
import { PrincipalSidebar } from "./principal-sidebar";
import { TeacherSidebar } from "./teacher-sidebar";

interface Props {
	children: React.ReactNode;
}

export function AppShell({ children }: Props) {
	const { data: session } = useSession();
	const role = (session as any)?.session?.member?.role ?? "teacher";

	const RoleSidebar =
		role === "admin"
			? AdminSidebar
			: role === "principal"
				? PrincipalSidebar
				: TeacherSidebar;

	return (
		<SidebarProvider>
			<RoleSidebar />
			<main className="flex flex-1 flex-col overflow-y-auto bg-background">
				<div className="flex items-center gap-2 border-b p-2">
					<SidebarTrigger />
				</div>
				<div className="p-6">{children}</div>
			</main>
		</SidebarProvider>
	);
}
