import { Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink, Outlet, useOutletContext, useParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useBreadcrumbs } from "@/contexts/breadcrumbs-context";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

function InfoRow({
	label,
	value,
}: {
	label: string;
	value: string | null | undefined;
}) {
	return (
		<div className="flex flex-col gap-0.5">
			<span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
				{label}
			</span>
			<span className="text-foreground text-sm">{value || "—"}</span>
		</div>
	);
}

const ROLE_LABELS: Record<string, string> = {
	teacher: "Teacher",
	admin: "Administrator",
	principal: "Principal",
	vice_principal: "Vice Principal",
	staff: "Staff",
};

function DetailSkeleton() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-4 w-24" />
			<div className="space-y-1">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-5 w-24" />
			</div>
			<div className="flex gap-4 border-border border-b pb-px">
				<Skeleton className="h-8 w-20" />
				<Skeleton className="h-8 w-28" />
			</div>
			<div className="space-y-5 rounded-xl border border-border p-5">
				{Array.from({ length: 4 }, (_, i) => (
					<div key={i} className="space-y-1">
						<Skeleton className="h-3 w-20" />
						<Skeleton className="h-4 w-36" />
					</div>
				))}
			</div>
		</div>
	);
}

type StaffData = {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	role?: string | null;
	phone?: string | null;
};

export function StaffProfileTab() {
	const { t } = useTranslation();
	const staff = useOutletContext<StaffData>();
	useBreadcrumbs([
		{ label: t("nav.staff", "Staff"), href: "/staff" },
		{
			label: `${staff.firstName} ${staff.lastName}`,
			href: `/staff/${staff.id}`,
		},
		{ label: t("staff.tab_profile", "Profile") },
	]);
	return (
		<div className="max-w-md space-y-5 rounded-xl border border-border p-5">
			<InfoRow label={t("staff.col_email", "Email")} value={staff.email} />
			<InfoRow label={t("staff.col_phone", "Phone")} value={staff.phone} />
			<InfoRow
				label={t("staff.col_role", "Role")}
				value={t(
					`staff.role_${staff.role ?? "staff"}`,
					ROLE_LABELS[staff.role ?? ""] ?? staff.role ?? "—",
				)}
			/>
		</div>
	);
}

export function StaffDetail() {
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();

	const TAB_NAV = [
		{ to: `/staff/${id}/profile`, label: "staff.tab_profile" },
		{ to: `/staff/${id}/assignments`, label: "staff.tab_assignments" },
	];

	const { data: staff, isLoading } = trpc.staff.get.useQuery(
		{ id: id! },
		{ enabled: !!id },
	);

	if (isLoading) return <DetailSkeleton />;

	if (!staff) {
		return (
			<div className="flex flex-col items-center gap-3 py-24 text-muted-foreground">
				<Users className="h-10 w-10 opacity-30" />
				<p className="font-medium">{t("common.no_data")}</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Title */}
			<div className="flex items-center gap-3">
				<div>
					<h1 className="font-bold text-2xl text-foreground">
						{staff.firstName} {staff.lastName}
					</h1>
					<Badge variant="secondary" className="mt-1">
						{t(
							`staff.role_${staff.role ?? "staff"}`,
							ROLE_LABELS[staff.role ?? ""] ?? staff.role ?? "staff",
						)}
					</Badge>
				</div>
			</div>

			{/* Tab nav */}
			<div className="flex border-border border-b" role="tablist">
				{TAB_NAV.map(({ to, label }) => (
					<NavLink
						key={to}
						to={to}
						className={({ isActive }) =>
							cn(
								"inline-flex items-center justify-center whitespace-nowrap px-4 py-2 font-medium text-sm transition-colors",
								"-mb-px border-b-2 focus-visible:outline-none",
								isActive
									? "border-primary text-foreground"
									: "border-transparent text-muted-foreground hover:text-foreground",
							)
						}
					>
						{t(label, to)}
					</NavLink>
				))}
			</div>

			{/* Active tab content */}
			<Outlet context={staff} />
		</div>
	);
}
