import { ArrowLeft, School, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

function Badge({ children }: { children: React.ReactNode }) {
	return (
		<span className="inline-flex items-center rounded-md border border-border bg-muted px-2.5 py-0.5 font-medium text-muted-foreground text-xs">
			{children}
		</span>
	);
}

function RosterSkeleton() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-4 w-24" />
			<div className="space-y-2">
				<Skeleton className="h-8 w-48" />
				<div className="flex gap-2">
					<Skeleton className="h-5 w-14" />
					<Skeleton className="h-5 w-20" />
				</div>
			</div>
			<div className="overflow-hidden rounded-xl border border-border">
				{Array.from({ length: 5 }, (_, i) => (
					<div
						key={i}
						className="flex gap-4 border-border border-b px-4 py-3 last:border-0"
					>
						<Skeleton className="h-4 w-48" />
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-4 w-12" />
					</div>
				))}
			</div>
		</div>
	);
}

export function ClassDetail() {
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();

	const { data: klass, isLoading: isLoadingClass } = trpc.classes.get.useQuery(
		{ id: id! },
		{ enabled: !!id },
	);

	const { data: roster = [], isLoading: isLoadingRoster } =
		trpc.classes.getRoster.useQuery({ classId: id! }, { enabled: !!id });

	const isLoading = isLoadingClass || isLoadingRoster;

	if (isLoading) return <RosterSkeleton />;

	if (!klass) {
		return (
			<div className="flex flex-col items-center gap-3 py-24 text-muted-foreground">
				<School className="h-10 w-10 opacity-30" />
				<p className="font-medium">{t("common.no_data")}</p>
			</div>
		);
	}

	const genderLabel = (g: string | null | undefined) => {
		if (!g) return "—";
		if (g === "M") return t("students.gender_m");
		if (g === "F") return t("students.gender_f");
		return g;
	};

	return (
		<div className="space-y-6">
			{/* Back */}
			<Link
				to="/classes"
				className="inline-flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground"
			>
				<ArrowLeft className="h-4 w-4" />
				{t("nav.classes")}
			</Link>

			{/* Header */}
			<div className="space-y-2">
				<h1 className="font-bold text-2xl text-foreground">{klass.name}</h1>
				<div className="flex flex-wrap gap-2">
					{klass.code && <Badge>{klass.code}</Badge>}
					{klass.level && <Badge>{klass.level}</Badge>}
				</div>
			</div>

			{/* Roster section */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="font-semibold text-foreground text-lg">
						{t("classes.roster")}
					</h2>
					<span className="text-muted-foreground text-sm">
						{roster.length} {t("classes.students_enrolled")}
					</span>
				</div>

				<div className="overflow-hidden rounded-xl border border-border">
					<table className="w-full text-sm">
						<thead className="bg-muted/40 text-muted-foreground">
							<tr>
								<th className="px-4 py-3 text-left font-medium">
									{t("students.col_name")}
								</th>
								<th className="px-4 py-3 text-left font-medium">
									{t("students.registration_number")}
								</th>
								<th className="px-4 py-3 text-left font-medium">
									{t("students.col_gender")}
								</th>
								<th className="px-4 py-3 text-left font-medium">
									{t("common.status")}
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{roster.length === 0 ? (
								<tr>
									<td
										colSpan={4}
										className="px-4 py-12 text-center text-muted-foreground"
									>
										<div className="flex flex-col items-center gap-3">
											<Users className="h-10 w-10 opacity-30" />
											<p className="font-medium">{t("students.empty_title")}</p>
											<p className="text-xs">{t("students.empty_desc")}</p>
										</div>
									</td>
								</tr>
							) : (
								roster.map((item) => (
									<tr
										key={item.enrollment.id}
										className="transition-colors hover:bg-muted/30"
									>
										<td className="px-4 py-3">
											<Link
												to={`/students/${item.student.id}`}
												className="font-medium text-foreground hover:text-primary hover:underline"
											>
												{item.student.firstName} {item.student.lastName}
											</Link>
										</td>
										<td className="px-4 py-3 text-muted-foreground">
											{item.student.registrationNumber ?? "—"}
										</td>
										<td className="px-4 py-3 text-muted-foreground">
											{genderLabel(item.student.gender)}
										</td>
										<td className="px-4 py-3 text-muted-foreground">
											{item.enrollment.status}
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
