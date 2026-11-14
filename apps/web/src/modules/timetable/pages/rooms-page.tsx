import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { confirmAction } from "@/components/callable/confirm";
import { DataTable, type RowAction } from "@/components/data-table";
import { ListLayout } from "@/components/layouts/ListLayout";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { RoomFormDialog } from "../components/room-form-dialog";
import {
	useDeleteRoom,
	useRooms,
	useToggleRoomActive,
} from "../hooks/use-rooms";
import { getRoomsColumns } from "../table/rooms-columns";
import type { Room } from "../types";

export default function RoomsPage() {
	const { t } = useTranslation();
	const { rooms, isLoading } = useRooms();
	const toggleActive = useToggleRoomActive();
	const deleteRoom = useDeleteRoom();

	const columns = useMemo(
		() =>
			getRoomsColumns(t, {
				onToggleActive: (room, isActive) =>
					toggleActive.mutate({ id: room.id, isActive }),
				disabled: toggleActive.isPending,
			}),
		[t, toggleActive.mutate, toggleActive.isPending],
	);

	const openCreate = () => RoomFormDialog.call({});
	const openEdit = (room: Room) => RoomFormDialog.call({ room });

	const confirmDelete = (id: string) =>
		confirmAction({
			title: t("common.confirmDelete"),
			message: t("common.confirmDeleteDesc"),
			confirmText: t("common.delete"),
			cancelText: t("common.cancel"),
			onConfirm: () => deleteRoom.mutateAsync(id).catch(() => undefined),
		});

	const rowActions = (room: Room): RowAction[] => [
		{
			label: t("common.actions.edit", { defaultValue: "Edit" }),
			icon: Pencil,
			onSelect: () => openEdit(room),
		},
		{
			label: t("common.delete"),
			icon: Trash2,
			destructive: true,
			separator: true,
			onSelect: () => confirmDelete(room.id),
		},
	];

	return (
		<ListLayout
			header={
				<PageHeader
					title={t("teacher.rooms.title")}
					description={t("teacher.rooms.description")}
					actions={
						<Button onClick={openCreate}>
							<Plus className="mr-1.5 h-4 w-4" />
							{t("teacher.rooms.add")}
						</Button>
					}
				/>
			}
		>
			<DataTable
				columns={columns}
				data={rooms}
				isLoading={isLoading}
				rowActions={rowActions}
				empty={
					<EmptyState
						className="m-4"
						icon={<Building2 className="h-6 w-6" />}
						title={t("teacher.rooms.empty.title")}
						description={t("teacher.rooms.empty.description")}
						cta={{
							label: t("teacher.rooms.add"),
							onClick: openCreate,
							icon: <Plus className="h-4 w-4" />,
						}}
					/>
				}
			/>
		</ListLayout>
	);
}
