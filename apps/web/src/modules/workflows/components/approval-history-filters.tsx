import { Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DatePicker } from "@/components/ui/date-picker";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { useApprovalHistory } from "../hooks/use-approval-history";
import type { HistoryStatus } from "../types";
import { ExamFilters } from "./exam-filters";

type History = ReturnType<typeof useApprovalHistory>;

export function ApprovalHistoryFilters({ history }: { history: History }) {
	const { t } = useTranslation();
	return (
		<ExamFilters
			{...history.filters}
			searchPlaceholder={t("dean.history.searchPlaceholder")}
		>
			{/* Status filter */}
			<Select
				value={history.statusFilter}
				onValueChange={(v: string) =>
					history.setStatusFilter(v as HistoryStatus)
				}
			>
				<SelectTrigger className="w-[150px]">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">{t("common.all")}</SelectItem>
					<SelectItem value="approved">{t("dean.history.approved")}</SelectItem>
					<SelectItem value="rejected">{t("dean.history.rejected")}</SelectItem>
				</SelectContent>
			</Select>

			{/* Teacher filter */}
			<Select
				value={history.teacherFilter}
				onValueChange={history.setTeacherFilter}
			>
				<SelectTrigger className="w-[170px]">
					<SelectValue placeholder={t("dean.history.teacherFilter")} />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">{t("dean.history.allTeachers")}</SelectItem>
					{history.teachers.map((u) => (
						<SelectItem key={u.id} value={u.id}>
							{u.firstName} {u.lastName}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			{/* Date range filter */}
			<div className="flex items-center gap-1.5">
				<Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
				<DatePicker
					value={history.dateFrom}
					onChange={history.setDateFrom}
					placeholder={t("dean.history.dateFrom")}
					className="w-44"
				/>
				<span className="text-muted-foreground text-xs">—</span>
				<DatePicker
					value={history.dateTo}
					onChange={history.setDateTo}
					placeholder={t("dean.history.dateTo")}
					className="w-44"
				/>
			</div>
		</ExamFilters>
	);
}
