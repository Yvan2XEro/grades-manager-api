import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { createCallable } from "react-call";
import { useTranslation } from "react-i18next";
import { DIALOG_EXIT_MS } from "@/components/callable/callable-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import {
	DEFAULT_PREFERENCES,
	RELATIONSHIP_TYPES,
	type RelationshipType,
} from "../types";

// ─── Add Guardian Dialog ──────────────────────────────────────────────────────

export const AddGuardianDialog = createCallable<
	{
		onCreated: () => void;
	},
	void
>(({ call, onCreated }) => {
	const { t } = useTranslation();
	const [form, setForm] = useState({
		firstName: "",
		lastName: "",
		email: "",
		phone: "",
		studentId: "",
		relationshipType: "guardian",
		isPrimary: false,
		isEmergencyContact: false,
	});

	const { data: students } = useQuery(
		trpc.students.list.queryOptions({ limit: 200 }),
	);

	const mut = useMutation({
		mutationFn: () =>
			trpcClient.guardians.create.mutate({
				studentId: form.studentId,
				firstName: form.firstName.trim(),
				lastName: form.lastName.trim(),
				email: form.email.trim(),
				phone: form.phone.trim() || undefined,
				relationshipType: form.relationshipType as RelationshipType,
				isPrimary: form.isPrimary,
				isEmergencyContact: form.isEmergencyContact,
				preferences: DEFAULT_PREFERENCES,
			}),
		onSuccess: () => {
			toast.success(t("guardians.admin.toasts.saved"));
			onCreated();
			call.end();
			setForm({
				firstName: "",
				lastName: "",
				email: "",
				phone: "",
				studentId: "",
				relationshipType: "guardian",
				isPrimary: false,
				isEmergencyContact: false,
			});
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const isValid =
		form.firstName && form.lastName && form.email && form.studentId;

	return (
		<Dialog open={!call.ended} onOpenChange={(o) => !o && call.end()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("guardians.admin.createTitle")}</DialogTitle>
				</DialogHeader>
				<DialogBody className="grid gap-4 md:grid-cols-2">
					<div className="space-y-2">
						<Label>{t("guardians.fields.firstName")}</Label>
						<Input
							value={form.firstName}
							onChange={(e) =>
								setForm((f) => ({ ...f, firstName: e.target.value }))
							}
						/>
					</div>
					<div className="space-y-2">
						<Label>{t("guardians.fields.lastName")}</Label>
						<Input
							value={form.lastName}
							onChange={(e) =>
								setForm((f) => ({ ...f, lastName: e.target.value }))
							}
						/>
					</div>
					<div className="space-y-2">
						<Label>{t("guardians.fields.email")}</Label>
						<Input
							type="email"
							value={form.email}
							onChange={(e) =>
								setForm((f) => ({ ...f, email: e.target.value }))
							}
						/>
					</div>
					<div className="space-y-2">
						<Label>{t("guardians.fields.phone")}</Label>
						<Input
							value={form.phone}
							onChange={(e) =>
								setForm((f) => ({ ...f, phone: e.target.value }))
							}
						/>
					</div>
					<div className="space-y-2 md:col-span-2">
						<Label>
							{t("guardians.admin.students", {
								defaultValue: "Link to student",
							})}
						</Label>
						<Select
							value={form.studentId}
							onValueChange={(v) => setForm((f) => ({ ...f, studentId: v }))}
						>
							<SelectTrigger>
								<SelectValue
									placeholder={t("guardians.admin.selectStudent", {
										defaultValue: "Select student…",
									})}
								/>
							</SelectTrigger>
							<SelectContent>
								{(students?.items ?? []).map((s) => (
									<SelectItem key={s.id} value={s.id}>
										{s.profile?.firstName} {s.profile?.lastName}
										{s.registrationNumber ? ` — ${s.registrationNumber}` : ""}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label>{t("guardians.fields.relationshipType")}</Label>
						<Select
							value={form.relationshipType}
							onValueChange={(v) =>
								setForm((f) => ({ ...f, relationshipType: v }))
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{RELATIONSHIP_TYPES.map((r) => (
									<SelectItem key={r} value={r}>
										{t(`guardians.relationships.${r}`)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="flex flex-col justify-end gap-3">
						<label className="flex items-center gap-2 text-sm">
							<Checkbox
								checked={form.isPrimary}
								onCheckedChange={(v) =>
									setForm((f) => ({ ...f, isPrimary: v === true }))
								}
							/>
							{t("guardians.fields.isPrimary")}
						</label>
						<label className="flex items-center gap-2 text-sm">
							<Checkbox
								checked={form.isEmergencyContact}
								onCheckedChange={(v) =>
									setForm((f) => ({ ...f, isEmergencyContact: v === true }))
								}
							/>
							{t("guardians.fields.isEmergencyContact")}
						</label>
					</div>
				</DialogBody>
				<DialogFooter>
					<Button variant="outline" onClick={() => call.end()}>
						{t("common.actions.cancel")}
					</Button>
					<Button
						disabled={!isValid || mut.isPending}
						onClick={() => mut.mutate()}
					>
						{t("guardians.admin.save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}, DIALOG_EXIT_MS);
