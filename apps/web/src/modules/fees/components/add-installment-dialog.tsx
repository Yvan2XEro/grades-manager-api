import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { createCallable } from "react-call";
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
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
import { InstallmentFormFields } from "./installment-form-fields";

export const AddInstallmentDialog = createCallable<
	{
		feeStructureId: string;
		nextIndex: number;
		onAdded: () => void;
	},
	void
>(({ call, feeStructureId, nextIndex, onAdded }) => {
	const { t } = useTranslation();
	const [form, setForm] = useState({ label: "", amount: "", dueDate: "" });

	const mut = useMutation({
		mutationFn: () =>
			trpcClient.feeClearance.addInstallment.mutate({
				feeStructureId,
				label: form.label,
				amount: Number(form.amount),
				dueDate: form.dueDate || undefined,
				orderIndex: nextIndex,
			}),
		onSuccess: () => {
			toast.success(t("common.saved"));
			onAdded();
			call.end();
			setForm({ label: "", amount: "", dueDate: "" });
		},
	});

	return (
		<Dialog open={!call.ended} onOpenChange={(o) => !o && call.end()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{t("feeClearance.structures.installments.add")}
					</DialogTitle>
				</DialogHeader>
				<DialogBody className="space-y-4">
					<InstallmentFormFields
						value={form}
						onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
					/>
				</DialogBody>
				<DialogFooter>
					<Button variant="outline" onClick={() => call.end()}>
						{t("common.cancel")}
					</Button>
					<Button
						disabled={!form.label || !form.amount || mut.isPending}
						onClick={() => mut.mutate()}
					>
						{t("common.save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}, DIALOG_EXIT_MS);
