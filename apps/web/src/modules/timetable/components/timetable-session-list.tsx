import { Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Session } from "../types";

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat"] as const;

interface Props {
	title: string;
	sessions: Session[];
	onEdit: (session: Session) => void;
	onDelete: (session: Session) => void;
}

/** Sessions of the selected course, one line each with edit/delete. */
export function TimetableSessionList({
	title,
	sessions,
	onEdit,
	onDelete,
}: Props) {
	const { t } = useTranslation();
	const dayLabel = (day: string) =>
		(DAY_KEYS as readonly string[]).includes(day)
			? t(`teacher.timetable.days.${day as (typeof DAY_KEYS)[number]}`)
			: day;

	return (
		<div className="space-y-1.5">
			<p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
				{title}
			</p>
			{sessions.map((s) => (
				<div
					key={s.id}
					className="flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm"
				>
					<Badge variant="outline" className="shrink-0 text-xs">
						{dayLabel(s.dayOfWeek)}
					</Badge>
					<span className="font-medium tabular-nums">
						{s.startTime} – {s.endTime}
					</span>
					{(s.roomRef?.name ?? s.room) && (
						<span className="text-muted-foreground">
							{s.roomRef?.name ?? s.room}
						</span>
					)}
					{(s.validFrom || s.validUntil) && (
						<span className="ml-auto shrink-0 text-muted-foreground text-xs">
							{t("teacher.timetable.validity")}: {s.validFrom ?? "…"} →{" "}
							{s.validUntil ?? "…"}
						</span>
					)}
					<div className="ml-auto flex shrink-0 gap-1">
						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-7 text-muted-foreground hover:text-foreground"
							onClick={() => onEdit(s)}
						>
							<Pencil className="h-3.5 w-3.5" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-7 text-destructive/70 hover:text-destructive"
							onClick={() => onDelete(s)}
						>
							<Trash2 className="h-3.5 w-3.5" />
						</Button>
					</div>
				</div>
			))}
		</div>
	);
}
