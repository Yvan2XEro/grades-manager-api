import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { createCallable } from "react-call";
import { useMutationFlow } from "react-call/mutation-flow";
import { useTranslation } from "react-i18next";
import { DIALOG_EXIT_MS } from "@/components/callable/callable-dialog";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
import { deliberationRulesKey } from "../hooks/use-deliberation-rules";
import {
	emptyRuleForm,
	RULE_CATEGORIES,
	toRulePayload,
} from "../services/deliberation-rules";
import { DELIBERATION_DECISIONS } from "../services/deliberation-status";
import type { RuleFormState } from "../types";

/** Creates or edits a deliberation rule; resolves `true` once saved. */
export const DeliberationRuleFormDialog = createCallable<
	{ initial?: RuleFormState },
	boolean
>(({ call, initial }) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [form, setForm] = useState<RuleFormState>(initial ?? emptyRuleForm);

	const save = useMutationFlow(call, async (call) => {
		let payload: ReturnType<typeof toRulePayload>;
		try {
			payload = toRulePayload(form);
		} catch {
			toast.error(t("admin.deliberations.rules.invalidJson"));
			return;
		}
		try {
			if (form.id) {
				await trpcClient.deliberations.rules.update.mutate({
					id: form.id,
					...payload,
				});
				toast.success(t("admin.deliberations.rules.toast.updateSuccess"));
			} else {
				await trpcClient.deliberations.rules.create.mutate(payload);
				toast.success(t("admin.deliberations.rules.toast.createSuccess"));
			}
			queryClient.invalidateQueries({ queryKey: deliberationRulesKey });
			call.end(true);
		} catch (err) {
			toast.error((err as Error).message);
		}
	});

	return (
		<Dialog
			open={!call.ended}
			onOpenChange={(o) => !o && !save.pending && call.end(false)}
		>
			<DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{form.id
							? t("common.actions.edit")
							: t("admin.deliberations.rules.create")}
					</DialogTitle>
				</DialogHeader>

				<DialogBody className="space-y-4 px-6 pb-4">
					<div className="space-y-2">
						<Label>{t("admin.deliberations.rules.name")}</Label>
						<Input
							value={form.name}
							onChange={(e) =>
								setForm((f) => ({
									...f,
									name: e.target.value,
								}))
							}
							placeholder={t("admin.deliberations.rules.namePlaceholder")}
						/>
					</div>

					<div className="space-y-2">
						<Label>{t("admin.deliberations.rules.description")}</Label>
						<Textarea
							value={form.description}
							onChange={(e) =>
								setForm((f) => ({
									...f,
									description: e.target.value,
								}))
							}
							rows={2}
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>{t("admin.deliberations.rules.category")}</Label>
							<Select
								value={form.category}
								onValueChange={(v) =>
									setForm((f) => ({
										...f,
										category: v,
									}))
								}
							>
								<SelectTrigger>
									<SelectValue
										placeholder={t(
											"admin.deliberations.rules.categoryPlaceholder",
										)}
									/>
								</SelectTrigger>
								<SelectContent>
									{RULE_CATEGORIES.map((c) => (
										<SelectItem key={c} value={c}>
											{t(`admin.deliberations.rules.categories.${c}`)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label>{t("admin.deliberations.rules.decision")}</Label>
							<Select
								value={form.decision}
								onValueChange={(v) =>
									setForm((f) => ({
										...f,
										decision: v,
									}))
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{DELIBERATION_DECISIONS.map((d) => (
										<SelectItem key={d} value={d}>
											{t(`admin.deliberations.decision.${d}`)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="space-y-2">
						<Label>{t("admin.deliberations.rules.priority")}</Label>
						<Input
							type="number"
							value={form.priority}
							onChange={(e) =>
								setForm((f) => ({
									...f,
									priority: Number(e.target.value),
								}))
							}
							min={1}
						/>
						<p className="text-muted-foreground text-xs">
							{t("admin.deliberations.rules.priorityHelp")}
						</p>
					</div>

					<div className="space-y-2">
						<Label>{t("admin.deliberations.rules.ruleset")}</Label>
						<Textarea
							value={form.ruleset}
							onChange={(e) =>
								setForm((f) => ({
									...f,
									ruleset: e.target.value,
								}))
							}
							rows={8}
							className="font-mono text-xs"
						/>
						<p className="text-muted-foreground text-xs">
							{t("admin.deliberations.rules.rulesetHelp")}
						</p>
					</div>
				</DialogBody>

				<DialogFooter>
					<Button
						variant="outline"
						disabled={save.pending}
						onClick={() => call.end(false)}
					>
						{t("common.actions.cancel")}
					</Button>
					<Button
						onClick={() => save()}
						disabled={
							!form.name || !form.category || !form.decision || save.pending
						}
					>
						{save.pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						{t("common.actions.save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}, DIALOG_EXIT_MS);
