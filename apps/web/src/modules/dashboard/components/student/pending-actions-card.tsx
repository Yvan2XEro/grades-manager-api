import { Bell, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { NotifItem } from "../../types";

import { NOTIF_ACTION_CONFIGS } from "./notification-actions";
import { ActionRow, InfoRow } from "./pending-action-rows";

export function PendingActionsCard({
	items,
	onMarkRead,
	isMarkingRead,
}: {
	items: NotifItem[];
	onMarkRead: (id: string) => void;
	isMarkingRead: boolean;
}) {
	const { t } = useTranslation();
	const MAX_SHOWN = 5;

	const actionItems = items
		.filter((i) => (NOTIF_ACTION_CONFIGS[i.type]?.kind ?? "info") === "action")
		.slice(0, MAX_SHOWN);
	const infoItems = items
		.filter((i) => (NOTIF_ACTION_CONFIGS[i.type]?.kind ?? "info") === "info")
		.slice(0, MAX_SHOWN);

	return (
		<div className="overflow-hidden rounded-xl border bg-card shadow-sm">
			{/* Header */}
			<div className="flex items-center justify-between border-b px-4 py-3">
				<div className="flex items-center gap-2">
					<Bell className="h-4 w-4 text-primary" />
					<span className="font-semibold text-foreground text-sm">
						{t("student.pendingActions.title")}
					</span>
					{actionItems.length > 0 && (
						<Badge className="h-5 bg-amber-500 px-1.5 text-[10px] text-white">
							{actionItems.length}
						</Badge>
					)}
				</div>
				<Button variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
					<Link to="/notifications">
						{t("student.pendingActions.viewAll")}
						<ChevronRight className="ml-1 h-3 w-3" />
					</Link>
				</Button>
			</div>

			{items.length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
					<Bell className="h-8 w-8 text-muted-foreground/40" />
					<p className="text-muted-foreground text-sm">
						{t("student.pendingActions.empty")}
					</p>
				</div>
			) : (
				<>
					{/* Actions requises — amber background, CTA buttons */}
					{actionItems.length > 0 && (
						<div>
							<p className="border-amber-200 border-b bg-amber-100 px-4 py-1.5 font-bold text-[10px] text-amber-800 uppercase tracking-widest dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
								⚡ {t("student.pendingActions.sectionActions")}
							</p>
							<ul className="divide-y divide-amber-100 dark:divide-amber-900/30">
								{actionItems.map((item) => (
									<ActionRow
										key={item.id}
										item={item}
										onMarkRead={onMarkRead}
										isMarkingRead={isMarkingRead}
										t={t}
									/>
								))}
							</ul>
						</div>
					)}

					{/* Informations — muted, compact */}
					{infoItems.length > 0 && (
						<div className={actionItems.length > 0 ? "border-t" : ""}>
							<p className="border-b bg-muted/30 px-4 py-1.5 font-semibold text-[10px] text-muted-foreground uppercase tracking-widest">
								{t("student.pendingActions.sectionInfo")}
							</p>
							<ul className="divide-y">
								{infoItems.map((item) => (
									<InfoRow
										key={item.id}
										item={item}
										onMarkRead={onMarkRead}
										isMarkingRead={isMarkingRead}
										t={t}
									/>
								))}
							</ul>
						</div>
					)}
				</>
			)}

			{items.length > actionItems.length + infoItems.length && (
				<div className="border-t px-4 py-2 text-center">
					<Link
						to="/notifications"
						className="text-muted-foreground text-xs hover:text-foreground hover:underline"
					>
						{t("student.pendingActions.moreItems", {
							count: items.length - actionItems.length - infoItems.length,
						})}
					</Link>
				</div>
			)}
		</div>
	);
}
