import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { RouterOutputs } from "@/utils/trpc";
import { trpc, trpcClient } from "@/utils/trpc";

type FormatRecord = RouterOutputs["registrationNumbers"]["list"][number];

const describeSegment = (
	segment: FormatRecord["definition"]["segments"][number],
) => {
	switch (segment.kind) {
		case "literal":
			return `"${segment.value}"`;
		case "field":
			return `{{${segment.field}}}`;
		case "counter":
			return `#(${segment.scope?.join(",") ?? "global"})`;
		default:
			return "";
	}
};

const RegistrationNumberFormats = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const formatsQuery = useQuery(
		trpc.registrationNumbers.list.queryOptions({ includeInactive: true }),
	);

	const invalidateList = () =>
		queryClient.invalidateQueries(
			trpc.registrationNumbers.list.queryKey({ includeInactive: true }),
		);

	const activateMutation = useMutation({
		mutationFn: (id: string) =>
			trpcClient.registrationNumbers.update.mutate({ id, isActive: true }),
		onSuccess: () => {
			toast.success(
				t("admin.registrationNumbers.toast.activated", {
					defaultValue: "Format activated",
				}),
			);
			invalidateList();
		},
		onError: (error) => toast.error(error.message),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) =>
			trpcClient.registrationNumbers.delete.mutate({ id }),
		onSuccess: () => {
			toast.success(
				t("admin.registrationNumbers.toast.deleted", {
					defaultValue: "Format deleted",
				}),
			);
			invalidateList();
		},
		onError: (error) => toast.error(error.message),
	});

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="font-semibold text-2xl text-gray-900">
						{t("admin.registrationNumbers.title", {
							defaultValue: "Registration number formats",
						})}
					</h1>
					<p className="text-gray-600">
						{t("admin.registrationNumbers.subtitle", {
							defaultValue:
								"Design templates for automatic matricule generation.",
						})}
					</p>
				</div>
				<Button onClick={() => navigate("/admin/registration-numbers/+")}>
					<PlusCircle className="mr-2 h-4 w-4" />
					{t("admin.registrationNumbers.actions.new", {
						defaultValue: "New format",
					})}
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>
						{t("admin.registrationNumbers.list.title", {
							defaultValue: "Existing formats",
						})}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>
										{t("admin.registrationNumbers.table.name", {
											defaultValue: "Name",
										})}
									</TableHead>
									<TableHead>
										{t("admin.registrationNumbers.table.description", {
											defaultValue: "Description",
										})}
									</TableHead>
									<TableHead>
										{t("admin.registrationNumbers.table.pattern", {
											defaultValue: "Pattern",
										})}
									</TableHead>
									<TableHead className="text-right">
										{t("common.table.actions", { defaultValue: "Actions" })}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{formatsQuery.isPending && (
									<TableRow>
										<TableCell colSpan={4}>
											{t("common.loading", { defaultValue: "Loading..." })}
										</TableCell>
									</TableRow>
								)}
								{!formatsQuery.isPending &&
									(formatsQuery.data?.length ?? 0) === 0 && (
										<TableRow>
											<TableCell colSpan={4}>
												{t("admin.registrationNumbers.list.empty", {
													defaultValue: "No formats yet. Create your first one.",
												})}
											</TableCell>
										</TableRow>
									)}
								{formatsQuery.data?.map((format) => (
									<TableRow key={format.id}>
										<TableCell className="font-medium">
											<div className="flex items-center gap-2">
												{format.name}
												{format.isActive && (
													<Badge variant="secondary">
														{t("admin.registrationNumbers.list.active", {
															defaultValue: "Active",
														})}
													</Badge>
												)}
											</div>
										</TableCell>
										<TableCell>{format.description || "-"}</TableCell>
										<TableCell>
											<div className="flex flex-wrap gap-2 text-xs text-gray-700">
												{format.definition.segments.map((segment, idx) => (
													<span
														key={`${format.id}-${idx}`}
														className="rounded bg-gray-100 px-2 py-1"
													>
														{describeSegment(segment)}
													</span>
												))}
											</div>
										</TableCell>
										<TableCell className="text-right">
											<div className="flex flex-wrap justify-end gap-2">
												<Button
													size="sm"
													variant="outline"
													onClick={() =>
														navigate(`/admin/registration-numbers/${format.id}`)
													}
												>
													{t("admin.registrationNumbers.list.edit", {
														defaultValue: "Edit",
													})}
												</Button>
												{!format.isActive && (
													<Button
														size="sm"
														variant="secondary"
														onClick={() => activateMutation.mutate(format.id)}
														disabled={activateMutation.isPending}
													>
														{t("admin.registrationNumbers.list.activate", {
															defaultValue: "Activate",
														})}
													</Button>
												)}
												<Button
													size="sm"
													variant="destructive"
													onClick={() => {
														if (
															window.confirm(
																t(
																	"admin.registrationNumbers.list.confirmDelete",
																	{
																		defaultValue:
																			"Delete this format permanently?",
																	},
																),
															)
														) {
															deleteMutation.mutate(format.id);
														}
													}}
													disabled={format.isActive || deleteMutation.isPending}
												>
													{t("admin.registrationNumbers.list.delete", {
														defaultValue: "Delete",
													})}
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default RegistrationNumberFormats;
