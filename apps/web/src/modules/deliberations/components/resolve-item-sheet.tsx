import { Loader2, Plus } from "lucide-react";
import { createCallable } from "react-call";
import { useTranslation } from "react-i18next";
import { DIALOG_EXIT_MS } from "@/components/callable/callable-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useResolveItems } from "../hooks/use-resolve-items";
import {
	outcomeVariant,
	RESOLVE_OUTCOMES,
} from "../services/transition-status";
import type { TransitionItem, TransitionOutcome } from "../types";

/**
 * Resolves one or several items of a transition plan with the same outcome,
 * destination and reason; resolves `true` once saved.
 */
export const ResolveItemSheet = createCallable<
	{
		items: TransitionItem[];
		targetAcademicYearId?: string | null;
	},
	boolean
>(({ call, items, targetAcademicYearId }) => {
	const { t } = useTranslation();
	const form = useResolveItems({
		items,
		targetAcademicYearId,
		onResolved: () => call.end(true),
	});
	const { single } = form;
	const classLabel = (klass: { code: string; name: string }) =>
		`${klass.code} - ${klass.name}`;

	return (
		<Sheet open={!call.ended} onOpenChange={(o) => !o && call.end(false)}>
			<SheetContent className="w-full overflow-y-auto sm:max-w-xl">
				<SheetHeader>
					<SheetTitle>
						{single
							? `${single.student.lastName} ${single.student.firstName}`
							: t("admin.academicYearTransitions.resolve.bulkTitle", {
									count: items.length,
								})}
					</SheetTitle>
					<SheetDescription>
						{single
							? single.student.registrationNumber
							: items
									.map((i) => `${i.student.lastName} ${i.student.firstName}`)
									.join(" · ")}
					</SheetDescription>
				</SheetHeader>
				<div className="space-y-5 px-4 pb-6">
					{single && <ItemSummary item={single} />}

					<div className="space-y-3">
						<h3 className="font-medium text-sm">
							{t("admin.academicYearTransitions.resolve.title")}
						</h3>
						<div className="space-y-2">
							<Label>
								{t("admin.academicYearTransitions.resolve.outcome")}
							</Label>
							<Select
								value={form.outcome}
								onValueChange={(value) =>
									form.changeOutcome(
										value as Exclude<TransitionOutcome, "review">,
									)
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
						{form.needsTarget && (
							<div className="space-y-2">
								<Label>
									{t("admin.academicYearTransitions.resolve.targetClass")}
								</Label>
								{form.mixedSources ? (
									<p className="rounded-md bg-amber-500/10 p-3 text-amber-700 text-sm dark:text-amber-300">
										{t("admin.academicYearTransitions.resolve.mixedSources")}
									</p>
								) : form.targetsLoading ? (
									<Skeleton className="h-9 w-full" />
								) : (
									<>
										<Select
											value={form.targetClassId}
											onValueChange={form.setTargetClassId}
										>
											<SelectTrigger>
												<SelectValue
													placeholder={t(
														"admin.academicYearTransitions.placeholders.targetClass",
													)}
												/>
											</SelectTrigger>
											<SelectContent>
												{form.suggestedClasses.length > 0 && (
													<SelectGroup>
														<SelectLabel>
															{t(
																"admin.academicYearTransitions.resolve.suggested",
															)}
														</SelectLabel>
														{form.suggestedClasses.map((klass) => (
															<SelectItem key={klass.id} value={klass.id}>
																{classLabel(klass)}
															</SelectItem>
														))}
													</SelectGroup>
												)}
												{form.otherClasses.length > 0 && (
													<SelectGroup>
														<SelectLabel>
															{t(
																"admin.academicYearTransitions.resolve.otherClasses",
															)}
														</SelectLabel>
														{form.otherClasses.map((klass) => (
															<SelectItem key={klass.id} value={klass.id}>
																{classLabel(klass)}
															</SelectItem>
														))}
													</SelectGroup>
												)}
											</SelectContent>
										</Select>
										<p className="text-muted-foreground text-xs">
											{t("admin.academicYearTransitions.resolve.targetHint")}
										</p>
										{form.canCreateSuggested && (
											<Button
												type="button"
												variant="outline"
												size="sm"
												disabled={form.creating}
												onClick={form.createSuggested}
											>
												{form.creating ? (
													<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
												) : (
													<Plus className="mr-1.5 h-3.5 w-3.5" />
												)}
												{t("admin.deliberations.promote.noTargetFound.create", {
													name: `${form.programName ?? ""} – ${form.suggestedLevel?.name ?? ""}`,
												})}
											</Button>
										)}
									</>
								)}
							</div>
						)}
						<div className="space-y-2">
							<Label>
								{t("admin.academicYearTransitions.resolve.reason")}
								<span className="text-destructive"> *</span>
							</Label>
							<Textarea
								value={form.reason}
								onChange={(event) => form.setReason(event.target.value)}
								placeholder={t(
									"admin.academicYearTransitions.placeholders.reason",
								)}
							/>
						</div>
						<Button
							className="w-full"
							disabled={!form.canSubmit}
							onClick={form.submit}
						>
							{items.length > 1
								? t("admin.academicYearTransitions.actions.resolveCount", {
										count: items.length,
									})
								: t("admin.academicYearTransitions.actions.resolve")}
						</Button>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}, DIALOG_EXIT_MS);

/** Decision, source, outcome and blocker of a single item. */
function ItemSummary({ item }: { item: TransitionItem }) {
	const { t } = useTranslation();
	return (
		<div className="grid gap-3 rounded-lg border p-4 text-sm">
			<div className="flex justify-between gap-3">
				<span className="text-muted-foreground">
					{t("admin.academicYearTransitions.table.decision")}
				</span>
				<span>
					{item.decision
						? t(`admin.academicYearTransitions.decision.${item.decision}`)
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
					{t(`admin.academicYearTransitions.outcome.${item.finalOutcome}`)}
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
					{t(`admin.academicYearTransitions.blocker.${item.blockerCode}`, {
						defaultValue: item.blockerCode,
					})}
				</div>
			)}
		</div>
	);
}
