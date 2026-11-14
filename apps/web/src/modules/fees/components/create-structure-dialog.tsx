import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { createCallable } from "react-call";
import { useTranslation } from "react-i18next";
import { DIALOG_EXIT_MS } from "@/components/callable/callable-dialog";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
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
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";

export const CreateStructureDialog = createCallable<
	{
		onCreated: () => void;
	},
	void
>(({ call, onCreated }) => {
	const { t } = useTranslation();
	const [form, setForm] = useState({
		name: "",
		academicYearId: "",
		totalAmount: "",
		currency: "XAF",
		description: "",
		programId: "",
		cycleLevelId: "",
	});
	const [studyCycleId, setStudyCycleId] = useState("");

	const { data: programs } = useQuery(trpc.programs.list.queryOptions({}));

	// Derive cycle from selected program (programs carry their own cycleId)
	const selectedProgram = programs?.items?.find((p) => p.id === form.programId);
	const derivedCycleId = selectedProgram?.cycleId ?? "";

	// studyCycleId tracks either the auto-derived cycle or a manual override
	const activeCycleId = derivedCycleId || studyCycleId;

	const { data: allCycles } = useQuery(
		trpc.studyCycles.listCycles.queryOptions({}),
	);
	const { data: levels } = useQuery({
		...trpc.studyCycles.listLevels.queryOptions({ cycleId: activeCycleId }),
		enabled: !!activeCycleId,
	});

	const mut = useMutation({
		mutationFn: () =>
			trpcClient.feeClearance.createStructure.mutate({
				name: form.name,
				academicYearId: form.academicYearId,
				totalAmount: Number(form.totalAmount),
				currency: form.currency,
				description: form.description || undefined,
				programId: form.programId || undefined,
				cycleLevelId: form.cycleLevelId || undefined,
			}),
		onSuccess: () => {
			toast.success(t("common.created"));
			onCreated();
			call.end();
			setForm({
				name: "",
				academicYearId: "",
				totalAmount: "",
				currency: "XAF",
				description: "",
				programId: "",
				cycleLevelId: "",
			});
			setStudyCycleId("");
		},
	});

	return (
		<Dialog open={!call.ended} onOpenChange={(o) => !o && call.end()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("feeClearance.structures.create")}</DialogTitle>
				</DialogHeader>
				<DialogBody className="space-y-4">
					<div>
						<Label>{t("feeClearance.structures.fields.name")}</Label>
						<Input
							value={form.name}
							onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
						/>
					</div>
					<div>
						<Label>{t("feeClearance.structures.fields.academicYear")}</Label>
						<AcademicYearSelect
							value={form.academicYearId || null}
							onChange={(v) => setForm((f) => ({ ...f, academicYearId: v }))}
							autoSelectActive
						/>
					</div>
					<div className="flex gap-2">
						<div className="flex-1">
							<Label>{t("feeClearance.structures.fields.totalAmount")}</Label>
							<Input
								type="number"
								min={0}
								value={form.totalAmount}
								onChange={(e) =>
									setForm((f) => ({ ...f, totalAmount: e.target.value }))
								}
							/>
						</div>
						<div className="w-28">
							<Label>{t("feeClearance.structures.fields.currency")}</Label>
							<Input
								value={form.currency}
								onChange={(e) =>
									setForm((f) => ({ ...f, currency: e.target.value }))
								}
							/>
						</div>
					</div>
					<div>
						<Label>{t("feeClearance.structures.fields.description")}</Label>
						<Input
							value={form.description}
							onChange={(e) =>
								setForm((f) => ({ ...f, description: e.target.value }))
							}
						/>
					</div>
					<div>
						<Label>{t("feeClearance.structures.fields.program")}</Label>
						<Select
							value={form.programId || "_none_"}
							onValueChange={(v) => {
								setForm((f) => ({
									...f,
									programId: v === "_none_" ? "" : v,
									cycleLevelId: "",
								}));
								setStudyCycleId("");
							}}
						>
							<SelectTrigger>
								<SelectValue placeholder={t("common.optional")} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="_none_">{t("common.none")}</SelectItem>
								{programs?.items?.map((p) => (
									<SelectItem key={p.id} value={p.id}>
										{p.shortName ?? p.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					{/* Show cycle select only when no program is chosen (or program has no cycle) */}
					{!derivedCycleId && (
						<div>
							<Label>{t("feeClearance.structures.fields.studyCycle")}</Label>
							<Select
								value={studyCycleId || "_none_"}
								onValueChange={(v) => {
									const val = v === "_none_" ? "" : v;
									setStudyCycleId(val);
									setForm((f) => ({ ...f, cycleLevelId: "" }));
								}}
							>
								<SelectTrigger>
									<SelectValue placeholder={t("common.optional")} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="_none_">{t("common.none")}</SelectItem>
									{allCycles?.items?.map((c) => (
										<SelectItem key={c.id} value={c.id}>
											{c.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}
					{activeCycleId && (
						<div>
							<Label>{t("feeClearance.structures.fields.cycleLevel")}</Label>
							<Select
								value={form.cycleLevelId || "_none_"}
								onValueChange={(v) =>
									setForm((f) => ({
										...f,
										cycleLevelId: v === "_none_" ? "" : v,
									}))
								}
							>
								<SelectTrigger>
									<SelectValue placeholder={t("common.optional")} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="_none_">{t("common.none")}</SelectItem>
									{levels?.map((l) => (
										<SelectItem key={l.id} value={l.id}>
											{l.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}
				</DialogBody>
				<DialogFooter>
					<Button variant="outline" onClick={() => call.end()}>
						{t("common.cancel")}
					</Button>
					<Button
						disabled={
							!form.name ||
							!form.academicYearId ||
							!form.totalAmount ||
							mut.isPending
						}
						onClick={() => mut.mutate()}
					>
						{t("common.save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}, DIALOG_EXIT_MS);
