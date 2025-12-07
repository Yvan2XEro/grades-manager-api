import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	ArrowDown,
	ArrowLeft,
	ArrowUp,
	Hash,
	PlusCircle,
	Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { RouterOutputs } from "@/utils/trpc";
import { trpc, trpcClient } from "@/utils/trpc";
import type {
	RegistrationCounterScope,
	RegistrationFormatField,
	RegistrationNumberFormatDefinition,
} from "../../../../server/src/db/schema/registration-number-types";
import {
	registrationCounterScopes,
	registrationFormatFields,
} from "../../../../server/src/db/schema/registration-number-types";

type FormatRecord = RouterOutputs["registrationNumbers"]["list"][number];
type Segment = RegistrationNumberFormatDefinition["segments"][number];

type DraftFormat = {
	id?: string;
	name: string;
	description?: string | null;
	isActive: boolean;
	definition: RegistrationNumberFormatDefinition;
};

const defaultField: RegistrationFormatField = registrationFormatFields[0];

const createSegment = (kind: Segment["kind"]): Segment => {
	switch (kind) {
		case "literal":
			return { kind: "literal", value: "" };
		case "field":
			return {
				kind: "field",
				field: defaultField,
				transform: "upper",
			};
		case "counter":
		default:
			return {
				kind: "counter",
				width: 4,
				scope: ["global"],
				start: 1,
				padChar: "0",
			};
	}
};

const createEmptyDraft = (): DraftFormat => ({
	name: "",
	description: "",
	isActive: false,
	definition: { segments: [] },
});

const RegistrationNumberFormatDetail = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { formatId } = useParams<{ formatId: string }>();
	const isCreateMode = !formatId || formatId === "+";

	const [draft, setDraft] = useState<DraftFormat>(createEmptyDraft());
	const [previewClassId, setPreviewClassId] = useState("");
	const [previewProfile, setPreviewProfile] = useState({
		firstName: "",
		lastName: "",
		nationality: "",
	});
	const [previewResult, setPreviewResult] = useState("");

	const classesQuery = useQuery(trpc.classes.list.queryOptions({ limit: 100 }));

	const formatsQuery = useQuery({
		...trpc.registrationNumbers.list.queryOptions({ includeInactive: true }),
		enabled: !isCreateMode,
	});

	const classOptions = useMemo(
		() => classesQuery.data?.items ?? [],
		[classesQuery.data],
	);

	useEffect(() => {
		if (!previewClassId && classOptions.length) {
			setPreviewClassId(classOptions[0].id);
		}
	}, [classOptions, previewClassId]);

	const existingFormat = useMemo(
		() => formatsQuery.data?.find((item) => item.id === formatId),
		[formatsQuery.data, formatId],
	);

	useEffect(() => {
		if (!isCreateMode && existingFormat) {
			setDraft({
				id: existingFormat.id,
				name: existingFormat.name,
				description: existingFormat.description,
				isActive: existingFormat.isActive,
				definition: existingFormat.definition,
			});
		}
	}, [existingFormat, isCreateMode]);

	const invalidateList = () =>
		queryClient.invalidateQueries(
			trpc.registrationNumbers.list.queryKey({ includeInactive: true }),
		);

	const updateSegments = (
		updater: (
			segments: RegistrationNumberFormatDefinition["segments"],
		) => RegistrationNumberFormatDefinition["segments"],
	) => {
		setDraft((prev) => ({
			...prev,
			definition: { segments: updater(prev.definition.segments) },
		}));
	};

	const handleSegmentKindChange = (index: number, kind: Segment["kind"]) => {
		updateSegments((segments) =>
			segments.map((segment, idx) =>
				idx === index ? createSegment(kind) : segment,
			),
		);
	};

	const handleSegmentUpdate = (index: number, segment: Segment) => {
		updateSegments((segments) =>
			segments.map((existing, idx) => (idx === index ? segment : existing)),
		);
	};

	const moveSegment = (index: number, direction: "up" | "down") => {
		updateSegments((segments) => {
			const newSegments = [...segments];
			const targetIndex = direction === "up" ? index - 1 : index + 1;
			if (targetIndex < 0 || targetIndex >= newSegments.length) return segments;
			const temp = newSegments[index];
			newSegments[index] = newSegments[targetIndex];
			newSegments[targetIndex] = temp;
			return newSegments;
		});
	};

	const removeSegment = (index: number) => {
		updateSegments((segments) => segments.filter((_, idx) => idx !== index));
	};

	const addSegment = (kind: Segment["kind"]) => {
		updateSegments((segments) => [...segments, createSegment(kind)]);
	};

	const toggleScope = (
		segment: Extract<Segment, { kind: "counter" }>,
		scope: RegistrationCounterScope,
		index: number,
	) => {
		let current = segment.scope ?? ["global"];
		if (current.includes(scope)) {
			if (current.length === 1) return;
			current = current.filter((item) => item !== scope);
		} else {
			current = [...current, scope];
		}
		handleSegmentUpdate(index, { ...segment, scope: current });
	};

	const upsertMutation = useMutation({
		mutationFn: async () => {
			if (!draft.name.trim()) {
				throw new Error(
					t("admin.registrationNumbers.errors.missingName", {
						defaultValue: "Name is required",
					}),
				);
			}
			if (!draft.definition.segments.length) {
				throw new Error(
					t("admin.registrationNumbers.errors.missingSegments", {
						defaultValue: "Add at least one segment",
					}),
				);
			}
			const payload = {
				name: draft.name.trim(),
				description: draft.description?.trim() ? draft.description : undefined,
				definition: draft.definition,
				isActive: draft.isActive,
			};
			if (draft.id) {
				return trpcClient.registrationNumbers.update.mutate({
					id: draft.id,
					...payload,
				});
			}
			return trpcClient.registrationNumbers.create.mutate(payload);
		},
		onSuccess: (result) => {
			toast.success(
				t("admin.registrationNumbers.toast.saved", {
					defaultValue: "Format saved",
				}),
			);
			invalidateList();
			if (!draft.id) {
				navigate(`/admin/registration-numbers/${result.id}`, { replace: true });
			} else {
				setDraft((prev) => ({
					...prev,
					id: result.id,
				}));
			}
		},
		onError: (error) => toast.error(error.message),
	});

	const deleteMutation = useMutation({
		mutationFn: async () => {
			if (!draft.id) return;
			return trpcClient.registrationNumbers.delete.mutate({ id: draft.id });
		},
		onSuccess: () => {
			toast.success(
				t("admin.registrationNumbers.toast.deleted", {
					defaultValue: "Format deleted",
				}),
			);
			invalidateList();
			navigate("/admin/registration-numbers");
		},
		onError: (error) => toast.error(error.message),
	});

	const previewMutation = useMutation({
		mutationFn: async () => {
			if (!previewClassId) {
				throw new Error(
					t("admin.registrationNumbers.errors.previewClass", {
						defaultValue: "Select a class to preview",
					}),
				);
			}
			const response = await trpcClient.registrationNumbers.preview.mutate({
				classId: previewClassId,
				formatId: draft.id,
				definition: draft.definition,
				profile: {
					firstName: previewProfile.firstName || undefined,
					lastName: previewProfile.lastName || undefined,
					nationality: previewProfile.nationality || undefined,
				},
			});
			return response.preview;
		},
		onSuccess: (preview) => setPreviewResult(preview),
		onError: (error) => toast.error(error.message),
	});

	const isLoadingExisting = !isCreateMode && formatsQuery.isPending;

	if (isLoadingExisting) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Spinner className="h-8 w-8" />
			</div>
		);
	}

	if (!isCreateMode && !existingFormat) {
		return (
			<div className="space-y-4">
				<Button
					variant="ghost"
					className="flex items-center gap-2"
					onClick={() => navigate("/admin/registration-numbers")}
				>
					<ArrowLeft className="h-4 w-4" />
					{t("common.actions.back", { defaultValue: "Back" })}
				</Button>
				<Card>
					<CardContent className="py-10 text-center text-gray-600">
						{t("admin.registrationNumbers.errors.notFound", {
							defaultValue: "Format not found.",
						})}
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="space-y-1">
					<button
						type="button"
						className="flex items-center gap-2 text-muted-foreground text-sm hover:text-foreground"
						onClick={() => navigate("/admin/registration-numbers")}
					>
						<ArrowLeft className="h-4 w-4" />
						{t("common.actions.back", { defaultValue: "Back" })}
					</button>
					<h1 className="font-semibold text-2xl text-gray-900">
						{draft.id
							? t("admin.registrationNumbers.dialog.editTitle", {
									defaultValue: "Edit format",
								})
							: t("admin.registrationNumbers.dialog.createTitle", {
									defaultValue: "New format",
								})}
					</h1>
					<p className="text-gray-600">
						{t("admin.registrationNumbers.subtitle", {
							defaultValue:
								"Design templates for automatic matricule generation.",
						})}
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					{draft.id && draft.isActive && (
						<Badge variant="secondary">
							{t("admin.registrationNumbers.list.active", {
								defaultValue: "Active",
							})}
						</Badge>
					)}
					<Button
						onClick={() => upsertMutation.mutate()}
						disabled={upsertMutation.isPending}
					>
						{t("admin.registrationNumbers.actions.save", {
							defaultValue: "Save format",
						})}
					</Button>
					{draft.id && !draft.isActive && (
						<Button
							variant="destructive"
							onClick={() => {
								if (
									window.confirm(
										t("admin.registrationNumbers.list.confirmDelete", {
											defaultValue: "Delete this format permanently?",
										}),
									)
								) {
									deleteMutation.mutate();
								}
							}}
							disabled={deleteMutation.isPending}
						>
							{t("admin.registrationNumbers.list.delete", {
								defaultValue: "Delete",
							})}
						</Button>
					)}
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				<div className="space-y-6 lg:col-span-2">
					<Card>
						<CardContent className="space-y-4 pt-6">
							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label>
										{t("admin.registrationNumbers.form.name", {
											defaultValue: "Format name",
										})}
									</Label>
									<Input
										value={draft.name}
										onChange={(event) =>
											setDraft((prev) => ({
												...prev,
												name: event.target.value,
											}))
										}
									/>
								</div>
								<div className="flex items-center justify-between rounded-lg border px-4 py-2">
									<div>
										<p className="font-medium text-gray-900 text-sm">
											{t("admin.registrationNumbers.form.activeLabel", {
												defaultValue: "Activate on save",
											})}
										</p>
										<p className="text-gray-600 text-xs">
											{t("admin.registrationNumbers.form.activeHelp", {
												defaultValue:
													"Switching on will deactivate other templates.",
											})}
										</p>
									</div>
									<Switch
										checked={draft.isActive}
										onCheckedChange={(checked) =>
											setDraft((prev) => ({ ...prev, isActive: checked }))
										}
									/>
								</div>
							</div>
							<div className="space-y-2">
								<Label>
									{t("admin.registrationNumbers.form.description", {
										defaultValue: "Description",
									})}
								</Label>
								<Textarea
									value={draft.description ?? ""}
									rows={3}
									onChange={(event) =>
										setDraft((prev) => ({
											...prev,
											description: event.target.value,
										}))
									}
								/>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
							<CardTitle>
								{t("admin.registrationNumbers.segments.title", {
									defaultValue: "Segments",
								})}
							</CardTitle>
							<div className="flex flex-wrap gap-2">
								<Button
									type="button"
									size="sm"
									variant="outline"
									onClick={() => addSegment("literal")}
								>
									<PlusCircle className="mr-2 h-4 w-4" />
									{t("admin.registrationNumbers.segments.addLiteral", {
										defaultValue: "Add literal",
									})}
								</Button>
								<Button
									type="button"
									size="sm"
									variant="outline"
									onClick={() => addSegment("field")}
								>
									<PlusCircle className="mr-2 h-4 w-4" />
									{t("admin.registrationNumbers.segments.addField", {
										defaultValue: "Add field",
									})}
								</Button>
								<Button
									type="button"
									size="sm"
									variant="outline"
									onClick={() => addSegment("counter")}
								>
									<PlusCircle className="mr-2 h-4 w-4" />
									{t("admin.registrationNumbers.segments.addCounter", {
										defaultValue: "Add counter",
									})}
								</Button>
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							{draft.definition.segments.length === 0 && (
								<p className="text-gray-600 text-sm">
									{t("admin.registrationNumbers.segments.empty", {
										defaultValue:
											"Combine literals, fields, and counters to craft a pattern.",
									})}
								</p>
							)}
							{draft.definition.segments.map((segment, index) => (
								<Card key={`segment-${index}`} className="border border-dashed">
									<CardContent className="space-y-4 pt-4">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2 font-medium text-gray-900 text-sm">
												<Hash className="h-4 w-4" />
												{t("admin.registrationNumbers.segments.segmentLabel", {
													defaultValue: "Segment {{index}}",
													index: index + 1,
												})}
											</div>
											<div className="flex items-center gap-2">
												<Button
													type="button"
													variant="ghost"
													size="icon"
													disabled={index === 0}
													onClick={() => moveSegment(index, "up")}
												>
													<ArrowUp className="h-4 w-4" />
												</Button>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													disabled={
														index === draft.definition.segments.length - 1
													}
													onClick={() => moveSegment(index, "down")}
												>
													<ArrowDown className="h-4 w-4" />
												</Button>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													onClick={() => removeSegment(index)}
												>
													<Trash2 className="h-4 w-4 text-red-500" />
												</Button>
											</div>
										</div>
										<div className="space-y-2">
											<Label>
												{t("admin.registrationNumbers.segments.typeLabel", {
													defaultValue: "Segment type",
												})}
											</Label>
											<Select
												value={segment.kind}
												onValueChange={(value) =>
													handleSegmentKindChange(
														index,
														value as Segment["kind"],
													)
												}
											>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="literal">
														{t("admin.registrationNumbers.segments.literal", {
															defaultValue: "Literal text",
														})}
													</SelectItem>
													<SelectItem value="field">
														{t("admin.registrationNumbers.segments.field", {
															defaultValue: "Data field",
														})}
													</SelectItem>
													<SelectItem value="counter">
														{t("admin.registrationNumbers.segments.counter", {
															defaultValue: "Counter",
														})}
													</SelectItem>
												</SelectContent>
											</Select>
										</div>

										{segment.kind === "literal" && (
											<div className="space-y-2">
												<Label>
													{t(
														"admin.registrationNumbers.segments.literalValue",
														{ defaultValue: "Text value" },
													)}
												</Label>
												<Input
													value={segment.value}
													onChange={(event) =>
														handleSegmentUpdate(index, {
															...segment,
															value: event.target.value,
														})
													}
												/>
											</div>
										)}

										{segment.kind === "field" && (
											<div className="grid gap-4 md:grid-cols-2">
												<div className="space-y-2">
													<Label>
														{t(
															"admin.registrationNumbers.segments.fieldSelect",
															{ defaultValue: "Select field" },
														)}
													</Label>
													<Select
														value={segment.field}
														onValueChange={(value) =>
															handleSegmentUpdate(index, {
																...segment,
																field: value as RegistrationFormatField,
															})
														}
													>
														<SelectTrigger>
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															{registrationFormatFields.map((field) => (
																<SelectItem key={field} value={field}>
																	{field}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												</div>
												<div className="space-y-2">
													<Label>
														{t("admin.registrationNumbers.segments.transform", {
															defaultValue: "Transform",
														})}
													</Label>
													<Select
														value={segment.transform ?? "upper"}
														onValueChange={(value) =>
															handleSegmentUpdate(index, {
																...segment,
																transform: value as "upper" | "lower" | "none",
															})
														}
													>
														<SelectTrigger>
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="upper">
																{t(
																	"admin.registrationNumbers.segments.uppercase",
																	{ defaultValue: "Uppercase" },
																)}
															</SelectItem>
															<SelectItem value="lower">
																{t(
																	"admin.registrationNumbers.segments.lowercase",
																	{ defaultValue: "Lowercase" },
																)}
															</SelectItem>
															<SelectItem value="none">
																{t("admin.registrationNumbers.segments.none", {
																	defaultValue: "Original",
																})}
															</SelectItem>
														</SelectContent>
													</Select>
												</div>
												<div className="space-y-2">
													<Label>
														{t("admin.registrationNumbers.segments.length", {
															defaultValue: "Max length",
														})}
													</Label>
													<Input
														type="number"
														min={1}
														value={segment.length?.toString() ?? ""}
														onChange={(event) => {
															const value = event.target.value;
															handleSegmentUpdate(index, {
																...segment,
																length: value ? Number(value) : undefined,
															});
														}}
													/>
												</div>
												<div className="space-y-2">
													<Label>
														{t("admin.registrationNumbers.segments.fallback", {
															defaultValue: "Fallback",
														})}
													</Label>
													<Input
														value={segment.fallback ?? ""}
														onChange={(event) =>
															handleSegmentUpdate(index, {
																...segment,
																fallback: event.target.value || undefined,
															})
														}
													/>
												</div>
											</div>
										)}

										{segment.kind === "counter" && (
											<div className="space-y-4">
												<div className="grid gap-4 md:grid-cols-2">
													<div className="space-y-2">
														<Label>
															{t(
																"admin.registrationNumbers.segments.counterWidth",
																{ defaultValue: "Width" },
															)}
														</Label>
														<Input
															type="number"
															min={1}
															value={segment.width?.toString() ?? ""}
															onChange={(event) =>
																handleSegmentUpdate(index, {
																	...segment,
																	width: event.target.value
																		? Number(event.target.value)
																		: undefined,
																})
															}
														/>
													</div>
													<div className="space-y-2">
														<Label>
															{t(
																"admin.registrationNumbers.segments.counterStart",
																{ defaultValue: "Start value" },
															)}
														</Label>
														<Input
															type="number"
															min={0}
															value={segment.start?.toString() ?? ""}
															onChange={(event) =>
																handleSegmentUpdate(index, {
																	...segment,
																	start: event.target.value
																		? Number(event.target.value)
																		: undefined,
																})
															}
														/>
													</div>
												</div>
												<div className="space-y-2">
													<Label>
														{t(
															"admin.registrationNumbers.segments.counterPad",
															{ defaultValue: "Pad character" },
														)}
													</Label>
													<Input
														value={segment.padChar ?? "0"}
														maxLength={1}
														onChange={(event) =>
															handleSegmentUpdate(index, {
																...segment,
																padChar: event.target.value || "0",
															})
														}
													/>
												</div>
												<div className="space-y-2">
													<Label>
														{t(
															"admin.registrationNumbers.segments.counterScope",
															{ defaultValue: "Counter scope" },
														)}
													</Label>
													<div className="flex flex-wrap gap-3">
														{registrationCounterScopes.map((scope) => (
															<label
																key={scope}
																className="flex items-center gap-2 text-gray-700 text-sm"
															>
																<Checkbox
																	checked={
																		segment.scope?.includes(scope) ?? false
																	}
																	onCheckedChange={() =>
																		toggleScope(segment, scope, index)
																	}
																/>
																{scope}
															</label>
														))}
													</div>
												</div>
											</div>
										)}
									</CardContent>
								</Card>
							))}
						</CardContent>
					</Card>
				</div>
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>
								{t("admin.registrationNumbers.preview.title", {
									defaultValue: "Preview",
								})}
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<p className="text-gray-600 text-sm">
								{t("admin.registrationNumbers.preview.subtitle", {
									defaultValue:
										"Select a class and optional student info to test the pattern.",
								})}
							</p>
							<div className="space-y-2">
								<Label>
									{t("admin.registrationNumbers.preview.class", {
										defaultValue: "Class",
									})}
								</Label>
								<Select
									value={previewClassId}
									onValueChange={setPreviewClassId}
								>
									<SelectTrigger>
										<SelectValue
											placeholder={t(
												"admin.registrationNumbers.preview.classPlaceholder",
												{ defaultValue: "Select class" },
											)}
										/>
									</SelectTrigger>
									<SelectContent>
										{classOptions.map((klass) => (
											<SelectItem key={klass.id} value={klass.id}>
												{klass.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>
									{t("admin.registrationNumbers.preview.firstName", {
										defaultValue: "First name",
									})}
								</Label>
								<Input
									value={previewProfile.firstName}
									onChange={(event) =>
										setPreviewProfile((prev) => ({
											...prev,
											firstName: event.target.value,
										}))
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									{t("admin.registrationNumbers.preview.lastName", {
										defaultValue: "Last name",
									})}
								</Label>
								<Input
									value={previewProfile.lastName}
									onChange={(event) =>
										setPreviewProfile((prev) => ({
											...prev,
											lastName: event.target.value,
										}))
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									{t("admin.registrationNumbers.preview.nationality", {
										defaultValue: "Nationality",
									})}
								</Label>
								<Input
									value={previewProfile.nationality}
									onChange={(event) =>
										setPreviewProfile((prev) => ({
											...prev,
											nationality: event.target.value,
										}))
									}
								/>
							</div>
							<Button
								type="button"
								variant="secondary"
								onClick={() => previewMutation.mutate()}
								disabled={
									previewMutation.isPending ||
									!previewClassId ||
									draft.definition.segments.length === 0
								}
							>
								{t("admin.registrationNumbers.preview.run", {
									defaultValue: "Generate preview",
								})}
							</Button>
							{previewResult && (
								<div className="rounded-lg border bg-white p-4">
									<p className="font-medium text-gray-700 text-sm">
										{t("admin.registrationNumbers.preview.result", {
											defaultValue: "Preview result",
										})}
									</p>
									<p className="font-semibold text-2xl text-gray-900">
										{previewResult}
									</p>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
};

export default RegistrationNumberFormatDetail;
