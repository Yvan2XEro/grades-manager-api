import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { createCallable } from "react-call";
import { useMutationFlow } from "react-call/mutation-flow";
import { useTranslation } from "react-i18next";
import {
	CallableDialog,
	DIALOG_EXIT_MS,
} from "@/components/callable/callable-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
import { deliberationErrorMessage } from "../services/deliberation-errors";
import {
	JURY_MEMBER_ROLE,
	JURY_PRESIDENT_ROLE,
	type JuryMember,
	splitJury,
} from "../services/jury";

interface Props {
	deliberationId: string;
	juryMembers: JuryMember[];
	juryNumber: string | null;
}

type MemberRow = { key: number; name: string; role: string };

/**
 * Edits who sits on a jury: the president and the members (free-text names,
 * an optional title per member) and the jury number. Resolves `true` once
 * saved.
 */
export const JuryCompositionDialog = createCallable<Props, boolean>(
	({ call, deliberationId, juryMembers, juryNumber }) => {
		const { t } = useTranslation();
		const initial = splitJury(juryMembers);
		const [president, setPresident] = useState(initial.president?.name ?? "");
		const [number, setNumber] = useState(juryNumber ?? "");
		const [members, setMembers] = useState<MemberRow[]>(
			initial.members.map((m, i) => ({
				key: i,
				name: m.name,
				role: m.role === JURY_MEMBER_ROLE ? "" : m.role,
			})),
		);
		const [nextKey, setNextKey] = useState(initial.members.length);

		const addMember = () => {
			setMembers((prev) => [...prev, { key: nextKey, name: "", role: "" }]);
			setNextKey((k) => k + 1);
		};
		const patchMember = (key: number, patch: Partial<MemberRow>) =>
			setMembers((prev) =>
				prev.map((m) => (m.key === key ? { ...m, ...patch } : m)),
			);
		const removeMember = (key: number) =>
			setMembers((prev) => prev.filter((m) => m.key !== key));

		const save = useMutationFlow(call, async (call) => {
			const next: JuryMember[] = [];
			if (president.trim()) {
				next.push({ name: president.trim(), role: JURY_PRESIDENT_ROLE });
			}
			for (const m of members) {
				if (!m.name.trim()) continue;
				next.push({
					name: m.name.trim(),
					role: m.role.trim() || JURY_MEMBER_ROLE,
				});
			}
			try {
				await trpcClient.deliberations.update.mutate({
					id: deliberationId,
					juryMembers: next,
					juryNumber: number.trim() || null,
				});
				toast.success(t("admin.deliberations.juryEdit.saved"));
				call.end(true);
			} catch (err) {
				toast.error(deliberationErrorMessage(t, err));
			}
		});

		return (
			<CallableDialog
				call={call}
				dismissValue={false}
				preventDismiss={save.pending}
				className="sm:max-w-xl"
				title={t("admin.deliberations.juryEdit.title")}
				description={t("admin.deliberations.juryEdit.description")}
			>
				<div className="space-y-5">
					<div className="space-y-2">
						<Label htmlFor="jury-number">
							{t("admin.deliberations.detail.juryNumber")}
						</Label>
						<Input
							id="jury-number"
							value={number}
							onChange={(e) => setNumber(e.target.value)}
							placeholder={t("admin.deliberations.juryEdit.numberPlaceholder")}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="jury-president">
							{t("admin.deliberations.detail.president")}
						</Label>
						<Input
							id="jury-president"
							value={president}
							onChange={(e) => setPresident(e.target.value)}
							placeholder={t(
								"admin.deliberations.juryEdit.presidentPlaceholder",
							)}
						/>
					</div>

					<div className="space-y-2">
						<Label>{t("admin.deliberations.juryEdit.members")}</Label>
						{members.length === 0 && (
							<p className="text-muted-foreground text-sm">
								{t("admin.deliberations.juryEdit.noMembers")}
							</p>
						)}
						{members.map((m) => (
							<div key={m.key} className="flex items-center gap-2">
								<Input
									value={m.name}
									onChange={(e) => patchMember(m.key, { name: e.target.value })}
									placeholder={t(
										"admin.deliberations.juryEdit.memberNamePlaceholder",
									)}
									aria-label={t("admin.deliberations.juryEdit.memberName")}
								/>
								<Input
									className="w-44 shrink-0"
									value={m.role}
									onChange={(e) => patchMember(m.key, { role: e.target.value })}
									placeholder={t("admin.deliberations.juryEdit.memberRole")}
									aria-label={t("admin.deliberations.juryEdit.memberRole")}
								/>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									onClick={() => removeMember(m.key)}
									aria-label={t("admin.deliberations.juryEdit.removeMember")}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>
						))}
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={addMember}
						>
							<Plus className="mr-1.5 h-4 w-4" />
							{t("admin.deliberations.juryEdit.addMember")}
						</Button>
					</div>

					<div className="flex justify-end gap-2">
						<Button
							variant="outline"
							onClick={() => call.end(false)}
							disabled={save.pending}
						>
							{t("common.actions.cancel")}
						</Button>
						<Button onClick={() => save()} disabled={save.pending}>
							{save.pending && <Spinner className="mr-2 h-4 w-4" />}
							{t("common.actions.save")}
						</Button>
					</div>
				</div>
			</CallableDialog>
		);
	},
	DIALOG_EXIT_MS,
);
