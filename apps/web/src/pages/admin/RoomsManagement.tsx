import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type Room = RouterOutputs["rooms"]["list"][number];

const EMPTY_FORM = {
	code: "",
	name: "",
	capacity: "",
	building: "",
	campus: "",
};

export default function RoomsManagement() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editing, setEditing] = useState<Room | null>(null);
	const [form, setForm] = useState(EMPTY_FORM);

	const { data: rooms, isLoading } = useQuery(trpc.rooms.list.queryOptions({}));

	const invalidate = () =>
		queryClient.invalidateQueries(trpc.rooms.list.queryFilter({}));

	const createMut = useMutation({
		mutationFn: () =>
			trpcClient.rooms.create.mutate({
				code: form.code,
				name: form.name,
				capacity: form.capacity ? Number(form.capacity) : undefined,
				building: form.building || undefined,
				campus: form.campus || undefined,
			}),
		onSuccess: () => {
			toast.success(t("common.saved"));
			invalidate();
			closeDialog();
		},
		onError: (e) => toast.error(e.message),
	});

	const updateMut = useMutation({
		mutationFn: () =>
			trpcClient.rooms.update.mutate({
				id: editing!.id,
				code: form.code,
				name: form.name,
				capacity: form.capacity ? Number(form.capacity) : null,
				building: form.building || null,
				campus: form.campus || null,
			}),
		onSuccess: () => {
			toast.success(t("common.saved"));
			invalidate();
			closeDialog();
		},
		onError: (e) => toast.error(e.message),
	});

	const toggleActiveMut = useMutation({
		mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
			trpcClient.rooms.update.mutate({ id, isActive }),
		onSuccess: () => invalidate(),
		onError: (e) => toast.error(e.message),
	});

	const deleteMut = useMutation({
		mutationFn: (id: string) => trpcClient.rooms.delete.mutate({ id }),
		onSuccess: () => {
			toast.success(t("common.deleted", { defaultValue: "Supprimé" }));
			invalidate();
		},
		onError: (e) => toast.error(e.message),
	});

	function openCreate() {
		setEditing(null);
		setForm(EMPTY_FORM);
		setDialogOpen(true);
	}

	function openEdit(room: Room) {
		setEditing(room);
		setForm({
			code: room.code,
			name: room.name,
			capacity: room.capacity ? String(room.capacity) : "",
			building: room.building ?? "",
			campus: room.campus ?? "",
		});
		setDialogOpen(true);
	}

	function closeDialog() {
		setDialogOpen(false);
		setEditing(null);
		setForm(EMPTY_FORM);
	}

	const isPending = createMut.isPending || updateMut.isPending;

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-semibold text-xl">
						{t("rooms.title", { defaultValue: "Salles et amphithéâtres" })}
					</h2>
					<p className="text-muted-foreground text-sm">
						{t("rooms.description", {
							defaultValue:
								"Gérez les salles disponibles pour la planification des cours.",
						})}
					</p>
				</div>
				<Button onClick={openCreate}>
					<Plus className="mr-1.5 h-4 w-4" />
					{t("rooms.add", { defaultValue: "Nouvelle salle" })}
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
					<EmptyTitle>
						{t("rooms.empty.title", { defaultValue: "Aucune salle" })}
					</EmptyTitle>
					<EmptyDescription>
						{t("rooms.empty.description", {
							defaultValue:
								"Ajoutez des salles pour les affecter aux sessions de cours.",
						})}
					</EmptyDescription>
				</Empty>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>
								{t("rooms.fields.code", { defaultValue: "Code" })}
							</TableHead>
							<TableHead>
								{t("rooms.fields.name", { defaultValue: "Nom" })}
							</TableHead>
							<TableHead>
								{t("rooms.fields.capacity", { defaultValue: "Capacité" })}
							</TableHead>
							<TableHead>
								{t("rooms.fields.building", { defaultValue: "Bâtiment" })}
							</TableHead>
							<TableHead>
								{t("rooms.fields.campus", { defaultValue: "Campus" })}
							</TableHead>
							<TableHead>
								{t("common.active", { defaultValue: "Actif" })}
							</TableHead>
							<TableHead />
						</TableRow>
					</TableHeader>
					<TableBody>
						{rooms.map((room) => (
							<TableRow key={room.id}>
								<TableCell className="font-medium font-mono">
									{room.code}
								</TableCell>
								<TableCell>{room.name}</TableCell>
								<TableCell>
									{room.capacity ? (
										<Badge variant="outline">{room.capacity} places</Badge>
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
									/>
								</TableCell>
								<TableCell className="flex items-center justify-end gap-1">
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
										onClick={() => deleteMut.mutate(room.id)}
									>
										<Trash2 className="h-4 w-4 text-destructive" />
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}

			<Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{editing
								? t("rooms.edit", { defaultValue: "Modifier la salle" })
								: t("rooms.add", { defaultValue: "Nouvelle salle" })}
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label>
									{t("rooms.fields.code", { defaultValue: "Code" })} *
								</Label>
								<Input
									value={form.code}
									maxLength={20}
									placeholder="AMP-A"
									onChange={(e) =>
										setForm((f) => ({
											...f,
											code: e.target.value.toUpperCase(),
										}))
									}
								/>
							</div>
							<div className="space-y-1.5">
								<Label>
									{t("rooms.fields.capacity", { defaultValue: "Capacité" })}
								</Label>
								<Input
									type="number"
									min={1}
									value={form.capacity}
									placeholder="120"
									onChange={(e) =>
										setForm((f) => ({ ...f, capacity: e.target.value }))
									}
								/>
							</div>
						</div>
						<div className="space-y-1.5">
							<Label>{t("rooms.fields.name", { defaultValue: "Nom" })} *</Label>
							<Input
								value={form.name}
								placeholder="Amphithéâtre A"
								onChange={(e) =>
									setForm((f) => ({ ...f, name: e.target.value }))
								}
							/>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label>
									{t("rooms.fields.building", { defaultValue: "Bâtiment" })}
								</Label>
								<Input
									value={form.building}
									placeholder="Bâtiment principal"
									onChange={(e) =>
										setForm((f) => ({ ...f, building: e.target.value }))
									}
								/>
							</div>
							<div className="space-y-1.5">
								<Label>
									{t("rooms.fields.campus", { defaultValue: "Campus" })}
								</Label>
								<Input
									value={form.campus}
									placeholder="Campus central"
									onChange={(e) =>
										setForm((f) => ({ ...f, campus: e.target.value }))
									}
								/>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={closeDialog}>
							{t("common.cancel")}
						</Button>
						<Button
							disabled={!form.code || !form.name || isPending}
							onClick={() =>
								editing ? updateMut.mutate() : createMut.mutate()
							}
						>
							{t("common.save")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
