import { ArrowLeft, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { Skeleton } from "@/components/ui/skeleton";
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

function DetailSkeleton() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-4 w-24" />
			<div className="space-y-1">
				<Skeleton className="h-8 w-56" />
				<Skeleton className="h-4 w-32" />
			</div>
			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
				<div className="space-y-5 rounded-xl border border-border p-5">
					{Array.from({ length: 5 }, (_, i) => (
						<div key={i} className="space-y-1">
							<Skeleton className="h-3 w-20" />
							<Skeleton className="h-4 w-36" />
						</div>
					))}
				</div>
				<div className="space-y-5 rounded-xl border border-border p-5">
					{Array.from({ length: 5 }, (_, i) => (
						<div key={i} className="space-y-1">
							<Skeleton className="h-3 w-20" />
							<Skeleton className="h-4 w-36" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

export function StudentDetail() {
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();

	const { data: student, isLoading } = trpc.students.get.useQuery(
		{ id: id! },
		{ enabled: !!id },
	);

	if (isLoading) return <DetailSkeleton />;

	if (!student) {
		return (
			<div className="flex flex-col items-center gap-3 py-24 text-muted-foreground">
				<User className="h-10 w-10 opacity-30" />
				<p className="font-medium">{t("common.no_data")}</p>
			</div>
		);
	}

	const formatDate = (value: Date | string | null | undefined) => {
		if (!value) return "—";
		return new Date(value).toLocaleDateString();
	};

	const genderLabel = (g: string | null | undefined) => {
		if (!g) return "—";
		if (g === "M") return t("students.gender_m");
		if (g === "F") return t("students.gender_f");
		return g;
	};

	const langLabel = (l: string | null | undefined) => {
		if (!l) return "—";
		if (l === "fr") return "Français";
		if (l === "en") return "English";
		return l;
	};

	return (
		<div className="space-y-6">
			{/* Back */}
			<Link
				to="/students"
				className="inline-flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground"
			>
				<ArrowLeft className="h-4 w-4" />
				{t("nav.students")}
			</Link>

			{/* Title */}
			<div>
				<h1 className="font-bold text-2xl text-foreground">
					{student.firstName} {student.lastName}
				</h1>
				<p className="text-muted-foreground text-sm">
					{student.registrationNumber}
				</p>
			</div>

			{/* Info grid */}
			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
				{/* Left column */}
				<div className="space-y-5 rounded-xl border border-border p-5">
					<InfoRow
						label={t("students.registration_number")}
						value={student.registrationNumber}
					/>
					<InfoRow label={t("students.mnu")} value={student.mnu} />
					<InfoRow
						label={t("students.gender")}
						value={genderLabel(student.gender)}
					/>
					<InfoRow
						label={t("students.dob")}
						value={formatDate(student.dateOfBirth)}
					/>
					<InfoRow label={t("students.pob")} value={student.placeOfBirth} />
				</div>

				{/* Right column */}
				<div className="space-y-5 rounded-xl border border-border p-5">
					<InfoRow
						label={t("students.contact_name")}
						value={student.contactName}
					/>
					<InfoRow
						label={t("students.contact_phone")}
						value={student.contactPhone}
					/>
					<InfoRow
						label={t("students.contact_email")}
						value={student.contactEmail}
					/>
					<InfoRow
						label={t("students.contact_relation")}
						value={student.contactRelation}
					/>
					<InfoRow
						label={t("students.report_card_language")}
						value={langLabel(student.reportCardLanguage)}
					/>
				</div>
			</div>
		</div>
	);
}
