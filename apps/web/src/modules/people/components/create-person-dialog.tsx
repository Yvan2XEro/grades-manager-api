import { useQueryClient } from "@tanstack/react-query";
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
import { toast } from "@/lib/toast";
import { type RouterOutputs, trpc, trpcClient } from "@/utils/trpc";

/** Creates a person profile; resolves with it, or `undefined` when dismissed. */
export const CreatePersonDialog = createCallable<
	void,
	RouterOutputs["users"]["createProfile"] | undefined
>(({ call }) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [form, setForm] = useState({
		firstName: "",
		lastName: "",
		email: "",
	});

	const submit = useMutationFlow(call, async (call) => {
		try {
			const created = await trpcClient.users.createProfile.mutate({
				firstName: form.firstName.trim(),
				lastName: form.lastName.trim(),
				email: form.email.trim(),
			});
			toast.success(
				t("usersHub.people.created", { defaultValue: "Person created." }),
			);
			queryClient.invalidateQueries({
				queryKey: trpc.users.listPaged.queryKey(),
			});
			call.end(created);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : String(err));
		}
	});
	const submitting = submit.pending;

	return (
		<CallableDialog
			call={call}
			dismissValue={undefined}
			preventDismiss={submitting}
			className="sm:max-w-lg"
			title={t("usersHub.people.add", { defaultValue: "Add person" })}
		>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					submit();
				}}
				className="space-y-4"
			>
				<div className="space-y-1">
					<Label htmlFor="cp-first">
						{t("common.fields.firstName", { defaultValue: "First name" })}
					</Label>
					<Input
						id="cp-first"
						required
						value={form.firstName}
						onChange={(e) =>
							setForm((f) => ({ ...f, firstName: e.target.value }))
						}
					/>
				</div>
				<div className="space-y-1">
					<Label htmlFor="cp-last">
						{t("common.fields.lastName", { defaultValue: "Last name" })}
					</Label>
					<Input
						id="cp-last"
						required
						value={form.lastName}
						onChange={(e) =>
							setForm((f) => ({ ...f, lastName: e.target.value }))
						}
					/>
				</div>
				<div className="space-y-1">
					<Label htmlFor="cp-email">
						{t("common.fields.email", { defaultValue: "Email" })}
					</Label>
					<Input
						id="cp-email"
						type="email"
						required
						value={form.email}
						onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
					/>
				</div>
				<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
					<Button
						type="button"
						variant="outline"
						disabled={submitting}
						onClick={() => call.end(undefined)}
					>
						{t("common.cancel", { defaultValue: "Cancel" })}
					</Button>
					<Button type="submit" disabled={submitting}>
						{submitting
							? t("common.saving", { defaultValue: "Saving…" })
							: t("common.create", { defaultValue: "Create" })}
					</Button>
				</div>
			</form>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);
