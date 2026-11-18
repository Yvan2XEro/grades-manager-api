import type { RouterOutputs } from "@/utils/trpc";

/** Notification of the current user (bell, `/notifications`). */
export type MyNotification =
	RouterOutputs["notifications"]["myNotifications"]["items"][number];

/** Delivery record listed in the notifications center (admin). */
export type DeliveryNotification =
	RouterOutputs["notifications"]["listPaged"]["items"][number];

export type StatusFilter = "all" | "pending" | "retrying" | "sent" | "failed";
