import { CheckCircle2, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDeliberationContext } from "./DeliberationContext";

export default function DeliberationActivityTab() {
	const { t } = useTranslation();
	const { logs, logsLoading } = useDeliberationContext();

	return (
		<div className="space-y-4 pt-6">
			<div className="rounded-xl border bg-card p-5 shadow-sm">
				<h3 className="mb-3 font-medium text-foreground text-sm">
					{t("admin.deliberations.logs.title")}
				</h3>
				{logsLoading ? (
					<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
				) : (
					<div className="max-h-96 space-y-1 overflow-y-auto text-sm">
						{logs.map((log) => {
							const actor = log.actor
								? `${log.actor.firstName} ${log.actor.lastName}`.trim()
								: null;
							return (
								<div
									key={log.id}
									className="flex items-start gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/40"
								>
									<CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
									<div className="min-w-0 flex-1">
										<span className="font-medium">
											{t(`admin.deliberations.logs.${log.action}`, {
												defaultValue: log.action,
											})}
										</span>
										{actor && (
											<span className="ml-1 text-muted-foreground">
												{t("admin.deliberations.logs.by", { name: actor })}
											</span>
										)}
									</div>
									<span className="shrink-0 text-muted-foreground text-xs">
										{new Date(log.createdAt).toLocaleString()}
									</span>
								</div>
							);
						})}
						{logs.length === 0 && <p className="text-muted-foreground">—</p>}
					</div>
				)}
			</div>
		</div>
	);
}
