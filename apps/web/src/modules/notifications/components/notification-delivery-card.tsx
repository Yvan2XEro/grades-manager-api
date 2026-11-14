import { CheckCircle2, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
	channelLabels,
	formatDeliveryDate,
	statusConfig,
} from "../services/delivery-status";
import { humanizeType } from "../services/notification-types";
import type { DeliveryNotification } from "../types";
import { PayloadPreview } from "./payload-preview";

/** One delivery record: status, channel, payload and its actions. */
export function NotificationDeliveryCard({
	item,
	selected,
	onToggle,
	onAcknowledge,
	isAcknowledging,
	onRetry,
	isRetrying,
}: {
	item: DeliveryNotification;
	selected: boolean;
	onToggle: () => void;
	onAcknowledge: () => void;
	isAcknowledging: boolean;
	onRetry: () => void;
	isRetrying: boolean;
}) {
	const { t } = useTranslation();
	const s = statusConfig[item.status as keyof typeof statusConfig];
	return (
		<div
			className={cn(
				"group relative flex items-start gap-4 rounded-xl border bg-card px-5 py-4 transition-shadow hover:shadow-sm",
				selected && "border-primary/40 bg-primary/5",
			)}
		>
			{/* Select */}
			<Checkbox
				checked={selected}
				onCheckedChange={onToggle}
				aria-label={item.type}
				className="mt-1"
			/>

			{/* Status icon */}
			<div
				className={cn(
					"flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
					s?.badge,
				)}
			>
				{s?.icon}
			</div>

			{/* Content */}
			<div className="min-w-0 flex-1">
				<div className="flex flex-wrap items-center gap-2">
					<p className="font-semibold text-foreground text-sm">
						{humanizeType(item.type)}
					</p>
					{s && (
						<span
							className={cn(
								"inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium text-[11px]",
								s.badge,
							)}
						>
							<span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
							{t(s.labelKey)}
						</span>
					)}
					{item.channel && (
						<span className="rounded border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
							{channelLabels[item.channel] ?? item.channel}
						</span>
					)}
				</div>

				<p className="mt-0.5 text-muted-foreground text-xs">
					{formatDeliveryDate(item.createdAt)}
				</p>

				{item.payload &&
					typeof item.payload === "object" &&
					Object.keys(item.payload).length > 0 && (
						<PayloadPreview payload={item.payload} />
					)}
			</div>

			{/* Actions */}
			<div className="flex shrink-0 gap-1 self-start opacity-0 transition-opacity group-hover:opacity-100">
				{item.status === "pending" && (
					<Button
						variant="ghost"
						size="sm"
						className="h-7 text-xs"
						onClick={onAcknowledge}
						disabled={isAcknowledging}
					>
						<CheckCircle2 className="mr-1 h-3.5 w-3.5" />
						{t("admin.notifications.actions.ack", {
							defaultValue: "Accuser réception",
						})}
					</Button>
				)}
				{item.status === "failed" && (
					<Button
						variant="ghost"
						size="sm"
						className="h-7 text-amber-600 text-xs hover:text-amber-700"
						onClick={onRetry}
						disabled={isRetrying}
					>
						<RotateCcw className="mr-1 h-3.5 w-3.5" />
						{t("admin.notifications.actions.retry", {
							defaultValue: "Relancer",
						})}
					</Button>
				)}
			</div>
		</div>
	);
}
