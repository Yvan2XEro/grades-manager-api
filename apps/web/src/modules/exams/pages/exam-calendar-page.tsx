import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BookOpen, Calendar, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { trpc } from "@/utils/trpc";
import {
	PastExamCard,
	UpcomingExamCard,
} from "../components/student-exam-cards";

export default function ExamCalendarPage() {
	const { t } = useTranslation();
	const examsQuery = useQuery(trpc.exams.upcomingForStudent.queryOptions());

	const exams = examsQuery.data ?? [];
	const upcoming = exams.filter((e) => new Date(e.date) >= new Date());
	const past = exams.filter((e) => new Date(e.date) < new Date());

	return (
		<div className="space-y-6">
			<PageHeader
				title={t("student.exams.title")}
				description={
					upcoming.length > 0
						? `${upcoming.length} ${t("student.exams.upcoming").toLowerCase()}`
						: t("student.exams.noExams")
				}
			/>

			{examsQuery.isPending ? (
				<div className="flex h-48 items-center justify-center">
					<Spinner className="h-8 w-8 text-primary" />
				</div>
			) : exams.length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-10 text-center">
					<Calendar className="h-8 w-8 text-muted-foreground/40" />
					<div>
						<p className="font-medium text-foreground text-sm">
							{t("student.exams.noExams")}
						</p>
						<p className="mt-1 text-muted-foreground text-xs">
							{t("student.exams.noExamsHint")}
						</p>
					</div>
				</div>
			) : (
				<motion.div
					variants={staggerContainer}
					initial="hidden"
					animate="visible"
					className="space-y-8"
				>
					{upcoming.length > 0 && (
						<motion.div variants={staggerItem} className="space-y-3">
							<h2 className="flex items-center gap-2 font-semibold text-base text-foreground">
								<Clock className="h-4 w-4 text-primary" />
								{t("student.exams.upcoming")}
								<span className="font-normal text-muted-foreground text-xs">
									· {upcoming.length}
								</span>
							</h2>
							<div className="space-y-2">
								{upcoming.map((exam) => (
									<UpcomingExamCard key={exam.id} exam={exam} />
								))}
							</div>
						</motion.div>
					)}

					{past.length > 0 && (
						<motion.div variants={staggerItem} className="space-y-3">
							<h2 className="flex items-center gap-2 font-semibold text-muted-foreground text-sm">
								<BookOpen className="h-4 w-4" />
								{t("student.exams.past")}
								<span className="font-normal text-xs">· {past.length}</span>
							</h2>
							<div className="space-y-2 opacity-70">
								{past.slice(0, 5).map((exam) => (
									<PastExamCard key={exam.id} exam={exam} />
								))}
							</div>
						</motion.div>
					)}
				</motion.div>
			)}
		</div>
	);
}
