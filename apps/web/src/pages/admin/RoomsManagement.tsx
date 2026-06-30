import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogBody,
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
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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

const roomSchema = z.object({
	code: z.string().min(1, "Required").max(20),
	name: z.string().min(1, "Required"),
	capacity: z.preprocess(
		(v) => (v === "" || v === undefined ? undefined : Number(v)),
		z.number().int().positive().optional(),
	),
	building: z.string().optional(),
	campus: z.string().optional(),
});
type RoomForm = z.infer<typeof roomSchema>;

export default function RoomsManagement() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editing, setEditing] = useState<Room | null>(null);

	const form = useForm<RoomForm>({
		resolver: zodResolver(roomSchema),
		defaultValues: {
			code: "",
			name: "",
			capacity: undefined,
			building: "",
			campus: "",
		},
	});

	const { data: rooms, isLoading } = useQuery(trpc.rooms.list.queryOptions({}));

	const invalidate = () =>
		queryClient.invalidateQueries(trpc.rooms.list.queryFilter({}));

	const createMut = useMutation({
		mutationFn: (values: RoomForm) =>
			trpcClient.rooms.create.mutate({
				code: values.code,
				name: values.name,
				capacity: values.capacity,
				building: values.building || undefined,
				campus: values.campus || undefined,
			}),
		onSuccess: () => {
			toast.success(t("common.saved"));
			invalidate();
			closeDialog();
		},
		onError: (e) => toast.error(e.message),
	});

	const updateMut = useMutation({
		mutationFn: (values: RoomForm) =>
			trpcClient.rooms.update.mutate({
				id: editing!.id,
				code: values.code,
				name: values.name,
				capacity: values.capacity ?? null,
				building: values.building || null,
				campus: values.campus || null,
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
			toast.success(t("common.deleted"));
			invalidate();
		},
		onError: (e) => toast.error(e.message),
	});

	function openCreate() {
		setEditing(null);
		form.reset({
			code: "",
			name: "",
			capacity: undefined,
			building: "",
			campus: "",
		});
		setDialogOpen(true);
	}

	function openEdit(room: Room) {
		setEditing(room);
		form.reset({
			code: room.code,
			name: room.name,
			capacity: room.capacity ?? undefined,
			building: room.building ?? "",
			campus: room.campus ?? "",
		});
		setDialogOpen(true);
	}

	function closeDialog() {
		setDialogOpen(false);
		setEditing(null);
		form.reset();
	}

	function onSubmit(values: RoomForm) {
		if (editing) {
			updateMut.mutate(values);
		} else {
			createMut.mutate(values);
		}
	}

	const isPending = createMut.isPending || updateMut.isPending;

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
									<input
										type="checkbox"
										checked={room.isActive}
										onChange={(e) =>
											toggleActiveMut.mutate({
												id: room.id,
												isActive: e.target.checked,
											})
										}
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
							{editing ? t("teacher.rooms.edit") : t("teacher.rooms.add")}
						</DialogTitle>
					</DialogHeader>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)}>
							<DialogBody className="space-y-3">
								<div className="grid grid-cols-2 gap-3">
									<FormField
										control={form.control}
										name="code"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("teacher.rooms.fields.code")} *
												</FormLabel>
												<FormControl>
													<Input
														{...field}
														maxLength={20}
														placeholder="AMP-A"
														onChange={(e) =>
															field.onChange(e.target.value.toUpperCase())
														}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="capacity"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("teacher.rooms.fields.capacity")}
												</FormLabel>
												<FormControl>
													<Input
														type="number"
														min={1}
														placeholder="120"
														value={field.value ?? ""}
														onChange={(e) => field.onChange(e.target.value)}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t("teacher.rooms.fields.name")} *</FormLabel>
											<FormControl>
												<Input
													{...field}
													placeholder={t("teacher.rooms.placeholders.roomName")}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<div className="grid grid-cols-2 gap-3">
									<FormField
										control={form.control}
										name="building"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("teacher.rooms.fields.building")}
												</FormLabel>
												<FormControl>
													<Input
														{...field}
														placeholder={t(
															"teacher.rooms.placeholders.building",
														)}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="campus"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("teacher.rooms.fields.campus")}
												</FormLabel>
												<FormControl>
													<Input
														{...field}
														placeholder={t("teacher.rooms.placeholders.campus")}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</DialogBody>
							<DialogFooter>
								<Button type="button" variant="outline" onClick={closeDialog}>
									{t("common.cancel")}
								</Button>
								<Button type="submit" disabled={isPending}>
									{t("common.save")}
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
