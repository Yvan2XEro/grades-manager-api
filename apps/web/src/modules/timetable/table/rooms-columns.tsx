import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import type { Room } from "../types";

export function getRoomsColumns(
	t: TFunction,
	toggle: {
		onToggleActive: (room: Room, isActive: boolean) => void;
		disabled: boolean;
	},
): ColumnDef<Room>[] {
	return [
		{
			id: "code",
			header: t("teacher.rooms.fields.code"),
			cell: ({ row }) => (
				<span className="font-mono text-xs">{row.original.code}</span>
			),
		},
		{
			id: "name",
			header: t("teacher.rooms.fields.name"),
			cell: ({ row }) => (
				<span className="font-medium">{row.original.name}</span>
			),
		},
		{
			id: "capacity",
			header: t("teacher.rooms.fields.capacity"),
			cell: ({ row: { original: room } }) =>
				room.capacity ? (
					<Badge variant="outline">
						{room.capacity} {t("teacher.rooms.seats")}
					</Badge>
				) : (
					<span className="text-muted-foreground">—</span>
				),
		},
		{
			id: "building",
			header: t("teacher.rooms.fields.building"),
			cell: ({ row }) => (
				<span className="text-muted-foreground">
					{row.original.building ?? "—"}
				</span>
			),
		},
		{
			id: "campus",
			header: t("teacher.rooms.fields.campus"),
			cell: ({ row }) => (
				<span className="text-muted-foreground">
					{row.original.campus ?? "—"}
				</span>
			),
		},
		{
			id: "active",
			header: t("common.active"),
			cell: ({ row: { original: room } }) => (
				<Switch
					checked={room.isActive}
					onCheckedChange={(v) => toggle.onToggleActive(room, v)}
					disabled={toggle.disabled}
				/>
			),
		},
	];
}
