import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { confirmAction } from "@/components/callable/confirm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { toast } from "@/lib/toast";
import { type RouterOutputs, trpc, trpcClient } from "@/utils/trpc";
import { RoomFormDialog } from "./RoomFormDialog";

type Room = RouterOutputs["rooms"]["list"][number];

export default function RoomsManagement() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const { data: rooms, isLoading } = useQuery(trpc.rooms.list.queryOptions({}));

	const invalidate = () =>
		queryClient.invalidateQueries(trpc.rooms.list.queryFilter({}));

	const toggleActiveMut = useMutation({
		mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
			trpcClient.rooms.update.mutate({ id, isActive }),
		onSuccess: () => invalidate(),
		onError: (e) => toast.error(e.message),
	});

	const deleteMut = useMutation({
		mutationFn: (id: string) => trpcClient.rooms.delete.mutate({ id }),
		onSuccess: () => {
			toast.success(t("common.deleted"));
			invalidate();
		},
		onError: (e) => toast.error(e.message),
	});

	const openCreate = () => RoomFormDialog.call({});

	const openEdit = (room: Room) => RoomFormDialog.call({ room });

	const confirmDelete = (id: string) =>
		confirmAction({
			title: t("common.confirmDelete"),
			message: t("common.confirmDeleteDesc"),
			confirmText: t("common.delete"),
			cancelText: t("common.cancel"),
			onConfirm: () => deleteMut.mutateAsync(id).catch(() => undefined),
		});

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-semibold text-xl">{t("teacher.rooms.title")}</h2>
					<p className="text-muted-foreground text-sm">
						{t("teacher.rooms.description")}
					</p>
				</div>
				<Button onClick={openCreate}>
					<Plus className="mr-1.5 h-4 w-4" />
					{t("teacher.rooms.add")}
				</Button>
			</div>

			{isLoading ? (
				<div className="space-y-2">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="h-12 w-full" />
					))}
				</div>
			) : !rooms || rooms.length === 0 ? (
				<Empty>
					<EmptyHeader>
						<Building2 className="h-8 w-8 text-muted-foreground/40" />
					</EmptyHeader>
					<EmptyTitle>{t("teacher.rooms.empty.title")}</EmptyTitle>
					<EmptyDescription>
						{t("teacher.rooms.empty.description")}
					</EmptyDescription>
				</Empty>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t("teacher.rooms.fields.code")}</TableHead>
							<TableHead>{t("teacher.rooms.fields.name")}</TableHead>
							<TableHead>{t("teacher.rooms.fields.capacity")}</TableHead>
							<TableHead>{t("teacher.rooms.fields.building")}</TableHead>
							<TableHead>{t("teacher.rooms.fields.campus")}</TableHead>
							<TableHead>{t("common.active")}</TableHead>
							<TableHead />
						</TableRow>
					</TableHeader>
					<TableBody>
						{rooms.map((room) => (
							<TableRow key={room.id}>
								<TableCell className="font-mono text-xs">{room.code}</TableCell>
								<TableCell className="font-medium">{room.name}</TableCell>
								<TableCell>
									{room.capacity ? (
										<Badge variant="outline">
											{room.capacity} {t("teacher.rooms.seats")}
										</Badge>
									) : (
										<span className="text-muted-foreground">—</span>
									)}
								</TableCell>
								<TableCell className="text-muted-foreground">
									{room.building ?? "—"}
								</TableCell>
								<TableCell className="text-muted-foreground">
									{room.campus ?? "—"}
								</TableCell>
								<TableCell>
									<Switch
										checked={room.isActive}
										onCheckedChange={(v) =>
											toggleActiveMut.mutate({ id: room.id, isActive: v })
										}
										disabled={toggleActiveMut.isPending}
									/>
								</TableCell>
								<TableCell className="flex justify-end gap-1">
									<Button
										size="icon"
										variant="ghost"
										onClick={() => openEdit(room)}
									>
										<Pencil className="h-4 w-4" />
									</Button>
									<Button
										size="icon"
										variant="ghost"
										onClick={() => confirmDelete(room.id)}
									>
										<Trash2 className="h-4 w-4 text-destructive" />
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</div>
	);
}
