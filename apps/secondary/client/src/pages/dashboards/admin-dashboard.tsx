import {
	BookOpen,
	CreditCard,
	GraduationCap,
	LayoutDashboard,
	School,
	Settings,
	Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

interface StatCardProps {
	label: string;
	value: string | number;
	icon: React.ReactNode;
	className?: string;
}

function StatCard({ label, value, icon, className }: StatCardProps) {
	return (
		<div
			className={cn(
				"flex items-center gap-4 rounded-xl border border-border bg-card p-5",
				className,
			)}
		>
			<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
				{icon}
			</div>
			<div>
				<p className="text-muted-foreground text-sm">{label}</p>
				<p className="font-bold text-2xl text-card-foreground">{value}</p>
			</div>
		</div>
	);
}

interface QuickLinkProps {
	to: string;
	icon: React.ReactNode;
	label: string;
}

function QuickLink({ to, icon, label }: QuickLinkProps) {
	return (
		<Link
			to={to}
			className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition-colors hover:bg-muted/40"
		>
			<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
				{icon}
			</div>
			<span className="font-medium text-foreground text-sm">{label}</span>
		</Link>
	);
}

function formatXAF(amount: number) {
	return new Intl.NumberFormat("fr-CM", {
		style: "currency",
		currency: "XAF",
		maximumFractionDigits: 0,
	}).format(amount);
}

function formatDate(date: string | Date) {
	return new Intl.DateTimeFormat("fr-CM", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	}).format(new Date(date));
}

const FEE_TYPE_KEYS: Record<string, string> = {
	tuition: "dashboard.fee_tuition",
	registration: "dashboard.fee_registration",
	exam: "dashboard.fee_exam",
	school_fees: "dashboard.fee_school_fees",
	other: "dashboard.fee_other",
};
const FEE_TYPE_FB: Record<string, string> = {
	tuition: "Tuition",
	registration: "Registration",
	exam: "Exam fees",
	school_fees: "School fees",
	other: "Other",
};

export function AdminDashboard() {
	const { t } = useTranslation();

	const { data: studentsData } = trpc.students.list.useQuery({ pageSize: 1 });
	const { data: classesData } = trpc.classes.list.useQuery({ pageSize: 1 });
	const { data: staffData } = trpc.staff.list.useQuery({ pageSize: 1 });
	const { data: subjectsData } = trpc.subjects.list.useQuery({ pageSize: 1 });

	const { data: academicYears = [] } = trpc.academicYears.list.useQuery();
	const activeYear = academicYears.find((y) => y.status === "active");

	const { data: activeYearClassesData } = trpc.classes.list.useQuery(
		{ pageSize: 1, academicYearId: activeYear?.id ?? "" },
		{ enabled: !!activeYear },
	);

	const { data: activeYearEnrollmentsData } = trpc.enrollments.list.useQuery(
		{ pageSize: 1, academicYearId: activeYear?.id ?? "" },
		{ enabled: !!activeYear },
	);

	const { data: recentPayments = [] } = trpc.finance.listPayments.useQuery({
		limit: 5,
	});

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-bold text-2xl text-foreground">
					{t("dashboard.title", "Dashboard")}
				</h1>
				<p className="text-muted-foreground text-sm">
					{t("dashboard.subtitle", "School overview")}
				</p>
			</div>

			{/* KPI cards */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard
					label={t("dashboard.students", "Students")}
					value={studentsData?.total ?? "—"}
					icon={<Users className="h-6 w-6" />}
				/>
				<StatCard
					label={t("dashboard.classes", "Classes")}
					value={classesData?.total ?? "—"}
					icon={<School className="h-6 w-6" />}
				/>
				<StatCard
					label={t("dashboard.staff", "Staff")}
					value={staffData?.total ?? "—"}
					icon={<GraduationCap className="h-6 w-6" />}
				/>
				<StatCard
					label={t("dashboard.subjects", "Subjects")}
					value={subjectsData?.total ?? "—"}
					icon={<BookOpen className="h-6 w-6" />}
				/>
			</div>

			{/* Second row */}
			<div className="grid gap-4 lg:grid-cols-2">
				{/* Recent payments */}
				<div className="overflow-hidden rounded-xl border border-border bg-card">
					<div className="border-border border-b px-5 py-4">
						<h2 className="font-semibold text-base text-card-foreground">
							{t("dashboard.recent_payments", "Recent payments")}
						</h2>
					</div>
					{recentPayments.length === 0 ? (
						<div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
							<CreditCard className="h-8 w-8 opacity-20" />
							<p className="text-sm">
								{t("dashboard.no_payments", "No payments recorded.")}
							</p>
						</div>
					) : (
						<table className="w-full text-sm">
							<thead className="border-border border-b bg-muted/60 text-muted-foreground">
								<tr>
									<th className="px-5 py-2.5 text-left font-medium text-muted-foreground">
										{t("dashboard.date", "Date")}
									</th>
									<th className="px-5 py-2.5 text-left font-medium text-muted-foreground">
										{t("dashboard.type", "Type")}
									</th>
									<th className="px-5 py-2.5 text-right font-medium text-muted-foreground">
										{t("dashboard.amount", "Amount")}
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{recentPayments.map((p) => (
									<tr key={p.id} className="hover:bg-muted/20">
										<td className="px-5 py-2.5 text-muted-foreground">
											{formatDate(p.paidAt)}
										</td>
										<td className="px-5 py-2.5 text-foreground">
											{t(
												FEE_TYPE_KEYS[p.feeType] ?? "",
												FEE_TYPE_FB[p.feeType] ?? p.feeType,
											)}
										</td>
										<td className="px-5 py-2.5 text-right font-medium text-foreground">
											{formatXAF(p.amount)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
					<div className="border-border border-t px-5 py-3 text-right">
						<Link
							to="/finance"
							className="text-primary text-sm hover:underline"
						>
							{t("dashboard.see_all_payments", "View all payments →")}
						</Link>
					</div>
				</div>

				{/* Active year summary */}
				<div className="rounded-xl border border-border bg-card">
					<div className="border-border border-b px-5 py-4">
						<h2 className="font-semibold text-base text-card-foreground">
							{t("dashboard.active_year", "Active academic year")}
						</h2>
					</div>
					<div className="p-5">
						{activeYear ? (
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground text-sm">
										{t("dashboard.year", "Year")}
									</span>
									<span className="font-semibold text-foreground text-sm">
										{activeYear.name}
									</span>
								</div>
								<div className="flex items-center justify-between border-border border-t pt-4">
									<span className="text-muted-foreground text-sm">
										{t("dashboard.classes_this_year", "Classes")}
									</span>
									<span className="font-semibold text-foreground text-sm">
										{activeYearClassesData?.total ?? "—"}
									</span>
								</div>
								<div className="flex items-center justify-between border-border border-t pt-4">
									<span className="text-muted-foreground text-sm">
										{t("dashboard.enrollments_this_year", "Enrollments")}
									</span>
									<span className="font-semibold text-foreground text-sm">
										{activeYearEnrollmentsData?.total ?? "—"}
									</span>
								</div>
							</div>
						) : (
							<div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
								<LayoutDashboard className="h-8 w-8 opacity-20" />
								<p className="text-sm">
									{t("dashboard.no_active_year", "No active academic year.")}
								</p>
								<Link
									to="/settings"
									className="text-primary text-xs hover:underline"
								>
									{t("dashboard.configure_year", "Configure →")}
								</Link>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Quick access */}
			<div>
				<h2 className="mb-3 font-semibold text-base text-foreground">
					{t("dashboard.quick_access", "Quick access")}
				</h2>
				<div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
					<QuickLink
						to="/students"
						icon={<Users className="h-5 w-5" />}
						label={t("nav.students", "Élèves")}
					/>
					<QuickLink
						to="/classes"
						icon={<School className="h-5 w-5" />}
						label={t("nav.classes", "Classes")}
					/>
					<QuickLink
						to="/staff"
						icon={<GraduationCap className="h-5 w-5" />}
						label={t("nav.staff", "Personnel")}
					/>
					<QuickLink
						to="/grades"
						icon={<BookOpen className="h-5 w-5" />}
						label={t("nav.grades", "Notes")}
					/>
					<QuickLink
						to="/finance"
						icon={<CreditCard className="h-5 w-5" />}
						label={t("nav.finance", "Finance")}
					/>
					<QuickLink
						to="/settings"
						icon={<Settings className="h-5 w-5" />}
						label={t("nav.settings", "Paramètres")}
					/>
				</div>
			</div>
		</div>
	);
}
