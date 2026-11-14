import { motion } from "framer-motion";
import {
	BookOpen,
	ClipboardCheck,
	GraduationCap,
	School,
	Users,
	Wallet,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { staggerContainer } from "@/lib/animations";
import type { KpiCard } from "../../types";
import { StatCard } from "./stat-card";

type Overview = {
	activeStudents?: number;
	admissionsTotal?: number;
	examsPending?: number;
	deliberationsOpen?: number;
	feeCollectionRate?: number;
};

export function AdminKpiGrid({
	ov,
	enrollmentTotal,
}: {
	ov: Overview | undefined;
	enrollmentTotal: number;
}) {
	const { t } = useTranslation();
	const kpiCards: KpiCard[] = [
		{
			key: "activeStudents",
			count: ov?.activeStudents ?? 0,
			icon: <Users className="h-5 w-5" />,
			gradient: "bg-primary/10",
			iconColor: "text-primary",
			href: "/users/people",
		},
		{
			key: "enrollments",
			count: enrollmentTotal,
			icon: <GraduationCap className="h-5 w-5" />,
			gradient: "bg-primary/10",
			iconColor: "text-primary",
			href: "/classes/enrollments",
		},
		{
			key: "admissionsTotal",
			count: ov?.admissionsTotal ?? 0,
			icon: <School className="h-5 w-5" />,
			gradient: "bg-primary/10",
			iconColor: "text-primary",
			href: "/admissions",
		},
		{
			key: "examsPending",
			count: ov?.examsPending ?? 0,
			icon: <ClipboardCheck className="h-5 w-5" />,
			gradient: "bg-amber-500/10",
			iconColor: "text-amber-600 dark:text-amber-400",
			href: "/exams",
		},
		{
			key: "deliberationsOpen",
			count: ov?.deliberationsOpen ?? 0,
			icon: <BookOpen className="h-5 w-5" />,
			gradient: "bg-blue-500/10",
			iconColor: "text-blue-600 dark:text-blue-400",
			href: "/academic-results/deliberations",
		},
		{
			key: "feeCollectionRate",
			count: ov?.feeCollectionRate ?? 0,
			icon: <Wallet className="h-5 w-5" />,
			gradient: "bg-green-500/10",
			iconColor: "text-green-600 dark:text-green-400",
			href: "/fee-clearance",
			suffix: "%",
		},
	];

	return (
		<motion.div
			variants={staggerContainer}
			initial="hidden"
			animate="visible"
			className="grid grid-cols-2 gap-4 lg:grid-cols-3"
		>
			{kpiCards.map((card) => (
				<StatCard
					key={card.key}
					card={card}
					label={t(`admin.dashboard.stats.${card.key}`, {
						defaultValue: card.key,
					})}
				/>
			))}
		</motion.div>
	);
}
