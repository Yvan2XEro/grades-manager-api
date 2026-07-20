import { cn } from "@/lib/utils";

export type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface GridSession {
	id: string;
	dayOfWeek: string;
	startTime: string;
	endTime: string;
	room: string | null;
	label: string;
	subLabel?: string;
	color?: string;
}

const DAY_LABELS: Record<DayOfWeek, string> = {
	mon: "Lun",
	tue: "Mar",
	wed: "Mer",
	thu: "Jeu",
	fri: "Ven",
	sat: "Sam",
	sun: "Dim",
};

const DAY_ORDER: DayOfWeek[] = [
	"mon",
	"tue",
	"wed",
	"thu",
	"fri",
	"sat",
	"sun",
];
const COLORS = [
	"bg-blue-100 border-blue-300 text-blue-900",
	"bg-emerald-100 border-emerald-300 text-emerald-900",
	"bg-violet-100 border-violet-300 text-violet-900",
	"bg-amber-100 border-amber-300 text-amber-900",
	"bg-rose-100 border-rose-300 text-rose-900",
	"bg-cyan-100 border-cyan-300 text-cyan-900",
];

interface WeeklyGridProps {
	sessions: GridSession[];
	onSessionClick?: (session: GridSession) => void;
	className?: string;
}

export function WeeklyGrid({
	sessions,
	onSessionClick,
	className,
}: WeeklyGridProps) {
	const activeDays = DAY_ORDER.filter((d) =>
		sessions.some((s) => s.dayOfWeek === d),
	);
	const days =
		activeDays.length > 0
			? activeDays
			: (["mon", "tue", "wed", "thu", "fri"] as DayOfWeek[]);

	const colorMap = new Map<string, string>();
	let colorIdx = 0;

	const sessionsByDay: Record<string, GridSession[]> = {};
	for (const day of days) {
		sessionsByDay[day] = sessions
			.filter((s) => s.dayOfWeek === day)
			.sort((a, b) => a.startTime.localeCompare(b.startTime));
	}

	for (const session of sessions) {
		if (!colorMap.has(session.id)) {
			colorMap.set(session.id, COLORS[colorIdx % COLORS.length]);
			colorIdx++;
		}
	}

	return (
		<div className={cn("w-full overflow-x-auto", className)}>
			<div
				className="grid min-w-[480px] gap-px bg-border"
				style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}
			>
				{days.map((day) => (
					<div
						key={day}
						className="bg-muted/50 px-3 py-2 text-center font-medium text-muted-foreground text-xs uppercase tracking-wide"
					>
						{DAY_LABELS[day]}
					</div>
				))}

				{days.map((day) => (
					<div
						key={day}
						className="flex min-h-[200px] flex-col gap-1.5 bg-background p-2"
					>
						{sessionsByDay[day].length === 0 ? (
							<div className="flex h-full items-center justify-center text-muted-foreground/40 text-xs">
								—
							</div>
						) : (
							sessionsByDay[day].map((session) => (
								<button
									key={session.id}
									type="button"
									onClick={() => onSessionClick?.(session)}
									className={cn(
										"w-full rounded-md border px-2 py-1.5 text-left text-xs transition-opacity hover:opacity-80",
										colorMap.get(session.id) ?? COLORS[0],
										onSessionClick && "cursor-pointer",
									)}
								>
									<p className="truncate font-semibold leading-tight">
										{session.label}
									</p>
									<p className="mt-0.5 tabular-nums">
										{session.startTime} – {session.endTime}
									</p>
									{session.room && (
										<p className="truncate text-[10px] opacity-70">
											{session.room}
										</p>
									)}
									{session.subLabel && (
										<p className="truncate text-[10px] opacity-70">
											{session.subLabel}
										</p>
									)}
								</button>
							))
						)}
					</div>
				))}
			</div>
		</div>
	);
}
