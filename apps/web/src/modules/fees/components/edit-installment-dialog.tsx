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

export const EditInstallmentDialog = createCallable<
	{
		installment: { id: string; label: string; amount: string; dueDate: string };
		currency: string;
		onSaved: () => void;
	},
	void
>(({ call, installment, currency, onSaved }) => {
	const { t } = useTranslation();
	const [form, setForm] = useState({
		label: installment.label,
		amount: installment.amount,
		dueDate: installment.dueDate,
	});

	const mut = useMutation({
		mutationFn: () =>
			trpcClient.feeClearance.updateInstallment.mutate({
				id: installment.id,
				label: form.label || undefined,
				amount: form.amount ? Number(form.amount) : undefined,
				dueDate: form.dueDate || undefined,
			}),
		onSuccess: () => {
			toast.success(t("common.saved"));
			onSaved();
			call.end();
		},
		onError: (e) => toast.error(e.message),
	});

	return (
		<Dialog open={!call.ended} onOpenChange={(o) => !o && call.end()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{t("feeClearance.structures.installments.edit")}
					</DialogTitle>
				</DialogHeader>
				<DialogBody className="space-y-4">
					<InstallmentFormFields
						value={form}
						onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
						currency={currency}
					/>
				</DialogBody>
				<DialogFooter>
					<Button variant="outline" onClick={() => call.end()}>
						{t("common.cancel")}
					</Button>
					<Button
						disabled={!form.label || mut.isPending}
						onClick={() => mut.mutate()}
					>
						{t("common.save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}, DIALOG_EXIT_MS);
