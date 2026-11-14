import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createCallable } from "react-call";
import { useTranslation } from "react-i18next";
import { DIALOG_EXIT_MS } from "@/components/callable/callable-dialog";
import { QuickCreate } from "@/components/callable/quick-create";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { ClassFormDialog } from "@/modules/classes/components/class-form-dialog";
import { trpcClient } from "@/utils/trpc";

import {
	outcomeVariant,
	RESOLVE_OUTCOMES,
} from "../services/transition-status";
import type { TransitionItem, TransitionOutcome } from "../types";

const targetClassesKey = (academicYearId?: string | null) => [
	"classes",
	"target",
	academicYearId,
];

const fetchTargetClasses = (academicYearId?: string | null) =>
	academicYearId
		? trpcClient.classes.list.query({ academicYearId, limit: 500 })
		: Promise.resolve({ items: [] });

/**
 * Resolves a blocked transition item; resolves `true` once saved. A missing
 * destination class can be created in place from the "+" next to its select.
 */
export const ResolveItemSheet = createCallable<
	{
		item: TransitionItem;
		targetAcademicYearId?: string | null;
	},
	boolean
>(({ call, item, targetAcademicYearId }) => {
	const { t } = useTranslation();
	const [outcome, setOutcome] = useState<TransitionOutcome>(
		item.finalOutcome === "review" ? "repeat" : item.finalOutcome,
	);
	const [targetClassId, setTargetClassId] = useState(
		item.targetClass?.id ?? "",
	);
	const [reason, setReason] = useState(item.overrideReason ?? "");

	const queryClient = useQueryClient();
	const { data: targetClassesData } = useQuery({
		queryKey: targetClassesKey(targetAcademicYearId),
		queryFn: () => fetchTargetClasses(targetAcademicYearId),
		enabled: Boolean(targetAcademicYearId),
	});
	const targetClasses = targetClassesData?.items ?? [];

	// The class list rows are enriched server-side, so it is refetched rather
	// than patched before the new class gets selected.
	const createTargetClass = async () => {
		if (!targetAcademicYearId) return;
		const created = await ClassFormDialog.call({
			defaults: { academicYearId: targetAcademicYearId },
			lockAcademicYear: true,
		});
		if (!created) return;
		await queryClient.invalidateQueries({
			queryKey: targetClassesKey(targetAcademicYearId),
		});
		setTargetClassId(created.id);
	};

	const mutation = useMutation({
		mutationFn: () =>
			trpcClient.academicYearTransitions.resolveItem.mutate({
				transitionId: item.transitionId,
				itemId: item.id,
				outcome: outcome as Exclude<TransitionOutcome, "review">,
				targetClassId:
					outcome === "promote" || outcome === "repeat" ? targetClassId : null,
				reason,
			}),
		onSuccess: () => {
			toast.success(t("admin.academicYearTransitions.toast.resolved"));
			call.end(true);
		},
		onError: (error) => toast.error(error.message),
	});

	const needsTarget = outcome === "promote" || outcome === "repeat";

	return (
		<Sheet open={!call.ended} onOpenChange={(o) => !o && call.end(false)}>
			<SheetContent className="w-full overflow-y-auto sm:max-w-xl">
				<SheetHeader>
					<SheetTitle>
						{item
							? `${item.student.lastName} ${item.student.firstName}`
							: t("admin.academicYearTransitions.item.title")}
					</SheetTitle>
					<SheetDescription>
						{item?.student.registrationNumber}
					</SheetDescription>
				</SheetHeader>
				{item && (
					<div className="space-y-5 px-4 pb-6">
						<div className="grid gap-3 rounded-lg border p-4 text-sm">
							<div className="flex justify-between gap-3">
								<span className="text-muted-foreground">
									{t("admin.academicYearTransitions.table.decision")}
								</span>
								<span>
									{item.decision
										? t(
												`admin.academicYearTransitions.decision.${item.decision}`,
											)
										: "-"}
								</span>
							</div>
							<div className="flex justify-between gap-3">
								<span className="text-muted-foreground">
									{t("admin.academicYearTransitions.table.source")}
								</span>
								<span>
									{item.sourceClass.code} - {item.sourceClass.name}
								</span>
							</div>
							<div className="flex justify-between gap-3">
								<span className="text-muted-foreground">
									{t("admin.academicYearTransitions.table.outcome")}
								</span>
								<Badge variant={outcomeVariant(item.finalOutcome)}>
									{t(
										`admin.academicYearTransitions.outcome.${item.finalOutcome}`,
									)}
								</Badge>
							</div>
							<div className="flex justify-between gap-3">
								<span className="text-muted-foreground">
									{t("admin.academicYearTransitions.table.destination")}
								</span>
								<span>
									{item.targetClass
										? `${item.targetClass.code} - ${item.targetClass.name}`
										: "-"}
								</span>
							</div>
							{item.blockerCode && (
								<div className="rounded-md bg-amber-500/10 p-3 text-amber-700 text-sm dark:text-amber-300">
									{t(
										`admin.academicYearTransitions.blocker.${item.blockerCode}`,
										{ defaultValue: item.blockerCode },
									)}
								</div>
							)}
						</div>

						<div className="space-y-3">
							<h3 className="font-medium text-sm">
								{t("admin.academicYearTransitions.resolve.title")}
							</h3>
							<div className="space-y-2">
								<Label>
									{t("admin.academicYearTransitions.resolve.outcome")}
								</Label>
								<Select
									value={outcome}
									onValueChange={(value) =>
										setOutcome(value as TransitionOutcome)
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{RESOLVE_OUTCOMES.map((value) => (
											<SelectItem key={value} value={value}>
												{t(`admin.academicYearTransitions.outcome.${value}`)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							{needsTarget && (
								<div className="space-y-2">
									<Label>
										{t("admin.academicYearTransitions.resolve.targetClass")}
									</Label>
									<QuickCreate
										onCreate={createTargetClass}
										label={t("admin.classes.actions.add")}
										disabled={!targetAcademicYearId}
									>
										<Select
											value={targetClassId}
											onValueChange={setTargetClassId}
										>
											<SelectTrigger>
												<SelectValue
													placeholder={t(
														"admin.academicYearTransitions.placeholders.targetClass",
													)}
												/>
											</SelectTrigger>
											<SelectContent>
												{targetClasses.map((klass) => (
													<SelectItem key={klass.id} value={klass.id}>
														{klass.code} - {klass.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</QuickCreate>
								</div>
							)}
							<div className="space-y-2">
								<Label>
									{t("admin.academicYearTransitions.resolve.reason")}
								</Label>
								<Textarea
									value={reason}
									onChange={(event) => setReason(event.target.value)}
									placeholder={t(
										"admin.academicYearTransitions.placeholders.reason",
									)}
								/>
							</div>
							<Button
								className="w-full"
								disabled={
									mutation.isPending ||
									reason.trim().length < 5 ||
									(needsTarget && !targetClassId)
								}
								onClick={() => mutation.mutate()}
							>
								{t("admin.academicYearTransitions.actions.resolve")}
							</Button>
						</div>
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}, DIALOG_EXIT_MS);
