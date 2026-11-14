import { useMutation } from "@tanstack/react-query";
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
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
import { useStudentSearch } from "../hooks/use-fee-options";
import { FeeStructureSelect } from "./fee-structure-select";

export const AssignStudentDialog = createCallable<
	{
		onDone: () => void;
	},
	void
>(({ call, onDone }) => {
	const { t } = useTranslation();
	const [yearId, setYearId] = useState("");
	const [structureId, setStructureId] = useState("");
	const [studentSearch, setStudentSearch] = useState("");
	const [studentId, setStudentId] = useState("");
	const [discountAmount, setDiscountAmount] = useState("0");
	const [discountReason, setDiscountReason] = useState("");
	const [notes, setNotes] = useState("");

	const { data: studentResults } = useStudentSearch(studentSearch, 15);

	const mut = useMutation({
		mutationFn: () =>
			trpcClient.feeClearance.assignStudent.mutate({
				studentId,
				academicYearId: yearId,
				feeStructureId: structureId,
				discountAmount: Number(discountAmount) || 0,
				discountReason: discountReason || undefined,
				notes: notes || undefined,
			}),
		onSuccess: () => {
			toast.success(t("common.saved"));
			onDone();
			call.end();
			setStudentId("");
			setStudentSearch("");
			setStructureId("");
			setDiscountAmount("0");
			setDiscountReason("");
			setNotes("");
		},
		onError: (e) => toast.error(e.message),
	});

	const selectedStudent = studentResults?.items?.find(
		(s) => s.id === studentId,
	);
	const selectedName = selectedStudent
		? `${selectedStudent.profile?.firstName ?? ""} ${selectedStudent.profile?.lastName ?? ""}`.trim()
		: "";

	return (
		<Dialog open={!call.ended} onOpenChange={(o) => !o && call.end()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{t("feeClearance.assignments.assignStudentTitle")}
					</DialogTitle>
				</DialogHeader>
				<DialogBody className="space-y-4">
					<div>
						<Label>{t("feeClearance.structures.fields.academicYear")}</Label>
						<AcademicYearSelect
							value={yearId || null}
							onChange={(v) => {
								setYearId(v);
								setStructureId("");
							}}
							autoSelectActive
						/>
					</div>
					<FeeStructureSelect
						academicYearId={yearId}
						value={structureId}
						onChange={setStructureId}
					/>
					<div className="space-y-2">
						<Label>{t("feeClearance.assignments.fields.student")}</Label>
						{studentId && selectedName && (
							<p className="rounded bg-muted px-2 py-1 text-sm">
								{selectedName}
								<button
									type="button"
									className="ml-2 text-muted-foreground hover:text-destructive"
									onClick={() => {
										setStudentId("");
										setStudentSearch("");
									}}
								>
									&#x2715;
								</button>
							</p>
						)}
						{!studentId && (
							<>
								<Input
									placeholder={t("common.search")}
									value={studentSearch}
									onChange={(e) => setStudentSearch(e.target.value)}
								/>
								{studentResults?.items && studentResults.items.length > 0 && (
									<div className="max-h-40 overflow-y-auto rounded border text-sm">
										{studentResults.items.map((s) => {
											const name =
												`${s.profile?.firstName ?? ""} ${s.profile?.lastName ?? ""}`.trim();
											return (
												<button
													key={s.id}
													type="button"
													className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-muted/50"
													onClick={() => {
														setStudentId(s.id);
														setStudentSearch(name || s.registrationNumber);
													}}
												>
													<span>{name || s.registrationNumber}</span>
													<span className="ml-auto text-muted-foreground">
														{s.registrationNumber}
													</span>
												</button>
											);
										})}
									</div>
								)}
							</>
						)}
					</div>
					<div>
						<Label>{t("feeClearance.assignments.discountLabel")}</Label>
						<Input
							type="number"
							min={0}
							value={discountAmount}
							onChange={(e) => setDiscountAmount(e.target.value)}
						/>
					</div>
					{Number(discountAmount) > 0 && (
						<div>
							<Label>{t("feeClearance.assignments.discountReasonLabel")}</Label>
							<Input
								value={discountReason}
								placeholder={t("common.optional")}
								onChange={(e) => setDiscountReason(e.target.value)}
							/>
						</div>
					)}
					<div>
						<Label>{t("feeClearance.bankImport.notes")}</Label>
						<Input
							value={notes}
							placeholder={t("common.optional")}
							onChange={(e) => setNotes(e.target.value)}
						/>
					</div>
				</DialogBody>
				<DialogFooter>
					<Button variant="outline" onClick={() => call.end()}>
						{t("common.cancel")}
					</Button>
					<Button
						disabled={!studentId || !yearId || !structureId || mut.isPending}
						onClick={() => mut.mutate()}
					>
						{t("feeClearance.assignments.assignStudentSubmit")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}, DIALOG_EXIT_MS);
