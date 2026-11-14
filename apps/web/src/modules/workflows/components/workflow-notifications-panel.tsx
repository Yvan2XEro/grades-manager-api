import { ArrowRight, ClipboardCheck, Clock3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TablePagination } from "@/components/ui/table-pagination";
import type { RouterOutputs } from "@/utils/trpc";

type NotificationsPage = RouterOutputs["notifications"]["listPaged"];

/** Pending workflow notifications, paginated. */
export function WorkflowNotificationsPanel({
	data,
	page,
	pageSize,
	onPageChange,
	onPageSizeChange,
}: {
	data: NotificationsPage | undefined;
	page: number;
	pageSize: number;
	onPageChange: (page: number) => void;
	onPageSizeChange: (size: number) => void;
}) {
	const { t } = useTranslation();
	const pendingNotifications = data?.items ?? [];
	return (
		<div className="rounded-xl border-0 bg-card p-6 shadow-sm">
			<h2 className="font-heading font-semibold text-foreground text-lg">
				{t("dean.workflows.notifications", {
					defaultValue: "Workflow notifications",
				})}
			</h2>
			<ul className="mt-4 space-y-2">
				{pendingNotifications.length ? (
					pendingNotifications.map((notification) => (
						<li
							key={notification.id}
							className="flex items-center justify-between rounded-lg bg-primary/5 p-3"
						>
							<div className="flex items-center space-x-3">
								<div className="rounded-full bg-card p-2 text-primary">
									{notification.type.includes("enrollment") ? (
										<Clock3 className="h-5 w-5" />
									) : (
										<ClipboardCheck className="h-5 w-5" />
									)}
								</div>
								<div>
									<p className="font-medium text-foreground">
										{notification.type}
									</p>
									<p className="text-muted-foreground text-xs">
										{JSON.stringify(notification.payload)}
									</p>
								</div>
							</div>
							<ArrowRight className="h-4 w-4 text-muted-foreground/60" />
						</li>
					))
				) : (
					<li className="rounded-lg bg-muted/50 p-3 text-muted-foreground text-sm">
						{t("dean.workflows.notificationsEmpty", {
							defaultValue: "No notifications",
						})}
					</li>
				)}
			</ul>
			<TablePagination
				page={page}
				pageCount={data?.pageCount ?? 1}
				total={data?.total ?? 0}
				pageSize={pageSize}
				onPageChange={onPageChange}
				onPageSizeChange={onPageSizeChange}
			/>
		</div>
	);
}
