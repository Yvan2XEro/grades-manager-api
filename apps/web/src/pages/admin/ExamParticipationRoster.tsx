import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { trpc, trpcClient } from "@/utils/trpc";

type ExamItem = { id: string; name: string; classCourse: string };
type ClassCourseItem = { id: string; code: string; courseName?: string | null };

export default function ExamParticipationRoster() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const [academicYearId, setAcademicYearId] = useState<string | null>(null);
	const [classCourseId, setClassCourseId] = useState<string | null>(null);
	const [examId, setExamId] = useState<string | null>(null);
	const [overrideDialog, setOverrideDialog] = useState<{
		studentId: string;
		studentName: string | null;
		currentEligible: boolean;
	} | null>(null);
	const [overrideEligible, setOverrideEligible] = useState(true);
	const [overrideReason, setOverrideReason] = useState("");

	const { data: classCourses } = useQuery({
		queryKey: ["classCourses-for-participation", academicYearId],
		queryFn: async () => {
			const { items } = await trpcClient.classCourses.list.query({
				academicYearId: academicYearId ?? undefined,
				limit: 500,
			});
			return items as ClassCourseItem[];
		},
	});

	const { data: exams } = useQuery({
		queryKey: ["exams-for-participation", classCourseId],
		queryFn: async () => {
			if (!classCourseId) return [];
			const { items } = await trpcClient.exams.list.query({
				classCourseId,
				limit: 200,
			});
			return items as ExamItem[];
		},
		enabled: !!classCourseId,
	});

	const rosterStatusQuery = useQuery({
		...trpc.attendance.getExamRosterStatus.queryOptions({
			examId: examId ?? "",
		}),
		enabled: !!examId,
	});

	const rosterQuery = useQuery({
		...trpc.attendance.getExamRoster.queryOptions({ examId: examId ?? "" }),
		enabled: !!examId,
	});

	const generateMutation = useMutation({
		mutationFn: () =>
			trpcClient.attendance.generateExamRoster.mutate({
				examId: examId!,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.attendance.getExamRoster.queryKey({ examId: examId! }),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.attendance.getExamRosterStatus.queryKey({
					examId: examId!,
				}),
			});
		},
	});

	const lockMutation = useMutation({
		mutationFn: () =>
			trpcClient.attendance.lockExamRoster.mutate({ examId: examId! }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.attendance.getExamRoster.queryKey({ examId: examId! }),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.attendance.getExamRosterStatus.queryKey({
					examId: examId!,
				}),
			});
		},
	});

	const overrideMutation = useMutation({
		mutationFn: (vars: {
			studentId: string;
			eligible: boolean;
			reason: string | null;
		}) =>
			trpcClient.attendance.overrideEligibility.mutate({
				examId: examId!,
				studentId: vars.studentId,
				eligible: vars.eligible,
				reason: vars.reason,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.attendance.getExamRoster.queryKey({ examId: examId! }),
			});
			setOverrideDialog(null);
			setOverrideReason("");
		},
	});

	const rows = rosterQuery.data ?? [];
	const status = rosterStatusQuery.data;
	const isLocked = status?.locked ?? false;
	const hasRoster = status?.exists ?? false;

	function openOverride(row: {
		studentId: string;
		studentName: string | null;
		eligible: boolean;
	}) {
		setOverrideEligible(!row.eligible);
		setOverrideReason("");
		setOverrideDialog({
			studentId: row.studentId,
			studentName: row.studentName,
			currentEligible: row.eligible,
		});
	}

	return (
		<div className="space-y-4">
			{/* Filters */}
			<div className="flex flex-wrap gap-4">
				<div className="w-52 space-y-1">
					<Label className="text-xs">
						{t("admin.examParticipation.academicYear")}
					</Label>
					<AcademicYearSelect
						value={academicYearId}
						onChange={(v) => {
							setAcademicYearId(v);
							setClassCourseId(null);
							setExamId(null);
						}}
					/>
				</div>
				<div className="w-52 space-y-1">
					<Label className="text-xs">
						{t("admin.examParticipation.classCourse")}
					</Label>
					<Select
						value={classCourseId ?? ""}
						onValueChange={(v) => {
							setClassCourseId(v || null);
							setExamId(null);
						}}
					>
						<SelectTrigger className="text-xs">
							<SelectValue
								placeholder={t("admin.examParticipation.classCourseLabel")}
							/>
						</SelectTrigger>
						<SelectContent>
							{(classCourses ?? []).map((cc) => (
								<SelectItem key={cc.id} value={cc.id}>
									{cc.code}
									{cc.courseName ? ` — ${cc.courseName}` : ""}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="w-52 space-y-1">
					<Label className="text-xs">{t("admin.examParticipation.exam")}</Label>
					<Select
						value={examId ?? ""}
						onValueChange={(v) => setExamId(v || null)}
						disabled={!classCourseId}
					>
						<SelectTrigger className="text-xs">
							<SelectValue
								placeholder={t("admin.examParticipation.examPlaceholder")}
							/>
						</SelectTrigger>
						<SelectContent>
							{(exams ?? []).map((e) => (
								<SelectItem key={e.id} value={e.id}>
									{e.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{!examId ? (
				<Empty>
					<EmptyHeader>
						<span className="text-3xl text-muted-foreground/40">📋</span>
					</EmptyHeader>
					<EmptyTitle>{t("admin.examParticipation.emptyTitle")}</EmptyTitle>
					<EmptyDescription>
						{t("admin.examParticipation.emptyDescription")}
					</EmptyDescription>
				</Empty>
			) : rosterQuery.isLoading ? (
				<div className="flex justify-center py-8">
					<Spinner />
				</div>
			) : (
				<div className="space-y-3">
					{/* Actions bar */}
					<div className="flex items-center gap-2">
						{isLocked ? (
							<Badge variant="secondary">
								{t("admin.examParticipation.locked")}
							</Badge>
						) : (
							<>
								<Button
									size="sm"
									variant="outline"
									onClick={() => generateMutation.mutate()}
									disabled={generateMutation.isPending}
								>
									{generateMutation.isPending ? (
										<Spinner className="mr-2 h-3 w-3" />
									) : null}
									{t("admin.examParticipation.generate")}
								</Button>
								{hasRoster && (
									<Button
										size="sm"
										onClick={() => lockMutation.mutate()}
										disabled={lockMutation.isPending}
									>
										{lockMutation.isPending ? (
											<Spinner className="mr-2 h-3 w-3" />
										) : null}
										{t("admin.examParticipation.lock")}
									</Button>
								)}
							</>
						)}
						{rows.length > 0 && (
							<span className="ml-auto text-muted-foreground text-xs">
								{rows.filter((r) => r.eligible).length}/{rows.length}{" "}
								{t("admin.examParticipation.eligible")}
							</span>
						)}
					</div>

					{rows.length === 0 ? (
						<Empty>
							<EmptyHeader>
								<span className="text-3xl text-muted-foreground/40">📭</span>
							</EmptyHeader>
							<EmptyTitle>
								{t("admin.examParticipation.noRosterTitle")}
							</EmptyTitle>
							<EmptyDescription>
								{t("admin.examParticipation.noRosterDescription")}
							</EmptyDescription>
						</Empty>
					) : (
						<div className="overflow-hidden rounded-lg border">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
										<th className="px-4 py-2 text-left">
											{t("admin.examParticipation.columns.student")}
										</th>
										<th className="px-4 py-2 text-left">
											{t("admin.examParticipation.columns.regNumber")}
										</th>
										<th className="px-4 py-2 text-center">
											{t("admin.examParticipation.columns.eligible")}
										</th>
										<th className="px-4 py-2 text-left">
											{t("admin.examParticipation.columns.reason")}
										</th>
										{!isLocked && (
											<th className="px-4 py-2 text-right">
												{t("admin.examParticipation.columns.actions")}
											</th>
										)}
									</tr>
								</thead>
								<tbody>
									{rows.map((row) => (
										<tr
											key={row.studentId}
											className="border-b last:border-0 hover:bg-muted/20"
										>
											<td className="px-4 py-2">
												{row.studentName ?? "—"}
												{row.exempted && (
													<Badge variant="outline" className="ml-2 text-[10px]">
														{t("admin.examParticipation.exempted")}
													</Badge>
												)}
											</td>
											<td className="px-4 py-2 font-mono text-muted-foreground text-xs">
												{row.studentRegistrationNumber ?? "—"}
											</td>
											<td className="px-4 py-2 text-center">
												{row.eligible ? (
													<Badge variant="default" className="text-xs">
														{t("admin.examParticipation.yes")}
													</Badge>
												) : (
													<Badge variant="destructive" className="text-xs">
														{t("admin.examParticipation.no")}
													</Badge>
												)}
											</td>
											<td className="max-w-xs truncate px-4 py-2 text-muted-foreground text-xs">
												{row.reason ?? "—"}
											</td>
											{!isLocked && (
												<td className="px-4 py-2 text-right">
													<Button
														size="sm"
														variant="ghost"
														className="h-7 text-xs"
														onClick={() => openOverride(row)}
													>
														{t("admin.examParticipation.override")}
													</Button>
												</td>
											)}
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			)}

			{/* Override eligibility dialog */}
			<Dialog
				open={!!overrideDialog}
				onOpenChange={(open) => {
					if (!open) {
						setOverrideDialog(null);
						setOverrideReason("");
					}
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{t("admin.examParticipation.overrideDialog.title")}
						</DialogTitle>
						<DialogDescription>
							{overrideDialog?.studentName ?? overrideDialog?.studentId}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-3">
						<div className="flex gap-2">
							<Button
								variant={overrideEligible ? "default" : "outline"}
								size="sm"
								onClick={() => setOverrideEligible(true)}
							>
								{t("admin.examParticipation.yes")}
							</Button>
							<Button
								variant={!overrideEligible ? "destructive" : "outline"}
								size="sm"
								onClick={() => setOverrideEligible(false)}
							>
								{t("admin.examParticipation.no")}
							</Button>
						</div>
						<div className="space-y-1">
							<Label className="text-xs">
								{t("admin.examParticipation.overrideDialog.reason")}
							</Label>
							<Textarea
								rows={2}
								value={overrideReason}
								onChange={(e) => setOverrideReason(e.target.value)}
								placeholder={t(
									"admin.examParticipation.overrideDialog.reasonPlaceholder",
								)}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setOverrideDialog(null);
								setOverrideReason("");
							}}
						>
							{t("common.cancel")}
						</Button>
						<Button
							disabled={overrideMutation.isPending}
							onClick={() => {
								if (!overrideDialog) return;
								overrideMutation.mutate({
									studentId: overrideDialog.studentId,
									eligible: overrideEligible,
									reason: overrideReason.trim() || null,
								});
							}}
						>
							{overrideMutation.isPending ? (
								<Spinner className="mr-2 h-3 w-3" />
							) : null}
							{t("common.save")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
