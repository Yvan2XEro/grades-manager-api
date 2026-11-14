import { Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";
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
					<SelectValue
						placeholder={t("dean.history.teacherFilter", {
							defaultValue: "All teachers",
						})}
					/>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">
						{t("dean.history.allTeachers", { defaultValue: "All teachers" })}
					</SelectItem>
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
				<input
					type="date"
					value={history.dateFrom}
					onChange={(e) => history.setDateFrom(e.target.value)}
					className="rounded-md border bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
					title={t("dean.history.dateFrom", { defaultValue: "From" })}
				/>
				<span className="text-muted-foreground text-xs">—</span>
				<input
					type="date"
					value={history.dateTo}
					onChange={(e) => history.setDateTo(e.target.value)}
					className="rounded-md border bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
					title={t("dean.history.dateTo", { defaultValue: "To" })}
				/>
			</div>
		</ExamFilters>
	);
}
