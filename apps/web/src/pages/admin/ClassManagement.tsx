import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
	Download,
	FileSpreadsheet,
	FileText,
	MoreHorizontal,
	Pencil,
	Plus,
	Trash2,
	Users,
	Wand2,
} from "lucide-react";
import { useState } from "react";
import { createCallable } from "react-call";
import { useMutationFlow } from "react-call/mutation-flow";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import * as XLSX from "xlsx";
import { BulkClassExportDialog } from "@/components/admin/document-templates/BulkClassExportDialog";
import { DIALOG_EXIT_MS } from "@/components/callable/callable-dialog";
import { confirmAction } from "@/components/callable/confirm";
import { ClassFormDialog } from "@/components/callable/forms/ClassFormDialog";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { SemesterSelect } from "@/components/inputs/SemesterSelect";
import { Badge } from "@/components/ui/badge";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ClipboardCopy } from "@/components/ui/clipboard-copy";
import {
	ContextMenuItem,
	ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { useRowSelection } from "@/hooks/useRowSelection";
import { toast } from "@/lib/toast";
import { Button } from "../../components/ui/button";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Spinner } from "../../components/ui/spinner";
import type { RouterOutputs } from "../../utils/trpc";
import { trpc, trpcClient } from "../../utils/trpc";

interface Class {
	id: string;
	code: string;
	name: string;
	programId: string;
	academicYearId: string;
	cycleLevelId: string;
	programOptionId: string;
	semesterId: string | null;
	totalCredits: number;
	assignedCredits: number;
	program: {
		name: string;
		code: string;
		cycleName?: string | null;
		cycleCode?: string | null;
	};
	academicYear: { name: string };
	cycle?: { id: string; name: string; code: string };
	cycleLevel?: { id: string; name: string; code: string };
	programOption?: { id: string; name: string; code: string };
	semester?: { id: string; code: string; name: string };
	studentCount: number;
}

export default function ClassManagement() {
	const navigate = useNavigate();
	const [filterYear, setFilterYear] = useState<string | null>(null);
	const [filterSemester, setFilterSemester] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);

	const handleFilter =
		<T,>(setter: (v: T) => void) =>
		(value: T) => {
			setter(value);
			setPage(1);
		};

	const queryClient = useQueryClient();
	const { t } = useTranslation();

	const { data, isLoading } = useQuery(
		trpc.classes.listPaged.queryOptions({
			page,
			pageSize,
			academicYearId: filterYear || undefined,
			semesterId: filterSemester || undefined,
		}),
	);

	const classes: Class[] = (data?.items ?? []).map((c) => ({
		id: c.id,
		code: c.code,
		name: c.name,
		programId: c.program ?? "",
		academicYearId: c.academicYear ?? "",
		cycleLevelId: c.cycleLevelId ?? "",
		programOptionId: c.programOptionId ?? "",
		semesterId: c.semesterId ?? null,
		totalCredits: c.totalCredits ?? 0,
		assignedCredits: c.assignedCredits ?? 0,
		program: {
			name: c.programInfo?.name ?? "",
			code: c.programInfo?.code ?? "",
			cycleName: c.cycle?.name,
			cycleCode: c.cycle?.code,
		},
		academicYear: { name: c.academicYearInfo?.name ?? "" },
		cycle: c.cycle?.id
			? { id: c.cycle.id, name: c.cycle.name ?? "", code: c.cycle.code ?? "" }
			: undefined,
		cycleLevel: c.cycleLevel?.id
			? {
					id: c.cycleLevel.id,
					name: c.cycleLevel.name ?? "",
					code: c.cycleLevel.code ?? "",
				}
			: undefined,
		programOption: c.programOption?.id
			? {
					id: c.programOption.id,
					name: c.programOption.name ?? "",
					code: c.programOption.code ?? "",
				}
			: undefined,
		semester: c.semester?.id
			? {
					id: c.semester.id,
					code: c.semester.code ?? "",
					name: c.semester.name ?? "",
				}
			: undefined,
		studentCount: c.studentCount ?? 0,
	}));
	const selection = useRowSelection(classes ?? []);

	const handleExportStudentListPDF = async (classData: Class) => {
		// New pipeline: render via the institution's `student_list` template
		// (resolves class → program → institution default, picks the centre
		// variant when the program is attached to a center). Falls back to
		// the legacy jsPDF generator when the new pipeline fails (e.g. no
		// template seeded, server unreachable).
		try {
			const result =
				await trpcClient.academicDocuments.generateStudentList.mutate({
					classId: classData.id,
					format: "pdf",
					demoMode: false,
				});
			const r = result as {
				data: string;
				filename: string;
				mimeType: string;
				usedTemplate?: { name: string; variant: "standard" | "center" };
			};
			const byteChars = atob(r.data);
			const byteNumbers = new Array(byteChars.length);
			for (let i = 0; i < byteChars.length; i++) {
				byteNumbers[i] = byteChars.charCodeAt(i);
			}
			const blob = new Blob([new Uint8Array(byteNumbers)], {
				type: r.mimeType,
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = r.filename;
			a.click();
			URL.revokeObjectURL(url);
			if (r.usedTemplate) {
				toast.success(
					`Modèle utilisé : ${r.usedTemplate.name}${r.usedTemplate.variant === "center" ? " (centre)" : ""}`,
				);
			} else {
				toast.success(
					t("admin.classes.export.success", {
						defaultValue: "Student list exported successfully",
					}),
				);
			}
			return;
		} catch (err) {
			console.warn(
				"[handleExportStudentListPDF] template pipeline failed, falling back to jsPDF",
				err,
			);
			toast.warning(
				`Le modèle officiel n'a pas pu être rendu (${err instanceof Error ? err.message : "erreur inconnue"}). Génération basique via jsPDF.`,
			);
		}
		try {
			// Legacy fallback (basic jsPDF, no template).
			// Fetch institution info
			const institution = await trpcClient.institutions.get.query();

			// Fetch full student list with details
			const studentsData = await trpcClient.students.list.query({
				classId: classData.id,
				limit: 1000,
			});

			// Create PDF
			const doc = new jsPDF();

			// Header - Institution info
			doc.setFontSize(16);
			doc.setFont("helvetica", "bold");
			const institutionName =
				institution?.nameFr || institution?.nameEn || "Institution";
			doc.text(institutionName, 105, 20, { align: "center" });

			doc.setFontSize(10);
			doc.setFont("helvetica", "normal");
			if (institution?.shortName) {
				doc.text(institution.shortName, 105, 27, { align: "center" });
			}

			// Title
			doc.setFontSize(14);
			doc.setFont("helvetica", "bold");
			doc.text(
				`${t("admin.classes.export.title", { defaultValue: "Student List" })}`,
				105,
				40,
				{ align: "center" },
			);

			// Class info
			doc.setFontSize(11);
			doc.setFont("helvetica", "normal");
			doc.text(`${t("admin.classes.table.name")}: ${classData.name}`, 14, 50);
			doc.text(`${t("admin.classes.table.code")}: ${classData.code}`, 14, 56);
			doc.text(
				`${t("admin.classes.table.program")}: ${classData.program?.name}`,
				14,
				62,
			);
			doc.text(
				`${t("admin.classes.table.academicYear")}: ${classData.academicYear?.name}`,
				14,
				68,
			);
			doc.text(
				`${t("admin.classes.export.totalStudents", { defaultValue: "Total students" })}: ${studentsData.items.length}`,
				14,
				74,
			);

			// Sort students alphabetically by last name, then first name
			const sortedStudents = [...studentsData.items].sort(
				(a, b) =>
					(a.profile.lastName ?? "").localeCompare(b.profile.lastName ?? "") ||
					(a.profile.firstName ?? "").localeCompare(b.profile.firstName ?? ""),
			);

			// Student table
			const tableData = sortedStudents.map((student, index) => [
				index + 1,
				student.registrationNumber || "-",
				student.profile.lastName,
				student.profile.firstName,
				student.profile.dateOfBirth
					? new Date(student.profile.dateOfBirth).toLocaleDateString()
					: "-",
				student.profile.gender === "male"
					? t("common.gender.male", { defaultValue: "M" })
					: student.profile.gender === "female"
						? t("common.gender.female", { defaultValue: "F" })
						: "-",
			]);

			autoTable(doc, {
				head: [
					[
						"#",
						t("admin.students.table.registrationNumber", {
							defaultValue: "Reg. Number",
						}),
						t("admin.students.table.lastName", { defaultValue: "Last Name" }),
						t("admin.students.table.firstName", {
							defaultValue: "First Name",
						}),
						t("admin.students.table.dateOfBirth", {
							defaultValue: "Birth Date",
						}),
						t("admin.students.table.gender", { defaultValue: "Gender" }),
					],
				],
				body: tableData,
				startY: 82,
				styles: { fontSize: 9, cellPadding: 2 },
				headStyles: { fillColor: [41, 128, 185], fontStyle: "bold" },
				alternateRowStyles: { fillColor: [245, 245, 245] },
			});

			// Footer
			const pageCount = (doc as any).internal.getNumberOfPages();
			for (let i = 1; i <= pageCount; i++) {
				doc.setPage(i);
				doc.setFontSize(8);
				doc.text(
					`${t("admin.classes.export.page", { defaultValue: "Page" })} ${i}/${pageCount}`,
					105,
					290,
					{ align: "center" },
				);
				doc.text(
					`${t("admin.classes.export.generatedOn", { defaultValue: "Generated on" })}: ${new Date().toLocaleString()}`,
					14,
					290,
				);
			}

			// Save PDF
			doc.save(
				`students_${classData.code}_${new Date().toISOString().split("T")[0]}.pdf`,
			);

			toast.success(
				t("admin.classes.export.success", {
					defaultValue: "Student list exported successfully",
				}),
			);
		} catch (error) {
			console.error("Error exporting PDF:", error);
			toast.error(
				t("admin.classes.export.error", {
					defaultValue: "Failed to export student list",
				}),
			);
		}
	};

	const handleExportStudentListExcel = async (classData: Class) => {
		try {
			// Fetch institution info
			const institution = await trpcClient.institutions.get.query();

			// Fetch full student list with details
			const studentsData = await trpcClient.students.list.query({
				classId: classData.id,
				limit: 1000,
			});

			// Prepare header info
			const institutionName =
				institution?.nameFr || institution?.nameEn || "Institution";
			const headerRows = [
				[institutionName],
				[institution?.shortName || ""],
				[],
				[t("admin.classes.export.title", { defaultValue: "Student List" })],
				[],
				[`${t("admin.classes.table.name")}: ${classData.name}`],
				[`${t("admin.classes.table.code")}: ${classData.code}`],
				[`${t("admin.classes.table.program")}: ${classData.program?.name}`],
				[
					`${t("admin.classes.table.academicYear")}: ${classData.academicYear?.name}`,
				],
				[
					`${t("admin.classes.export.totalStudents", { defaultValue: "Total students" })}: ${studentsData.items.length}`,
				],
				[],
				[
					"#",
					t("admin.students.table.registrationNumber", {
						defaultValue: "Reg. Number",
					}),
					t("admin.students.table.lastName", { defaultValue: "Last Name" }),
					t("admin.students.table.firstName", { defaultValue: "First Name" }),
					t("admin.students.table.dateOfBirth", {
						defaultValue: "Birth Date",
					}),
					t("admin.students.table.gender", { defaultValue: "Gender" }),
				],
			];

			// Sort students alphabetically by last name, then first name
			const sortedStudents = [...studentsData.items].sort(
				(a, b) =>
					(a.profile.lastName ?? "").localeCompare(b.profile.lastName ?? "") ||
					(a.profile.firstName ?? "").localeCompare(b.profile.firstName ?? ""),
			);

			// Prepare student data rows
			const dataRows = sortedStudents.map((student, index) => [
				index + 1,
				student.registrationNumber || "-",
				student.profile.lastName,
				student.profile.firstName,
				student.profile.dateOfBirth
					? new Date(student.profile.dateOfBirth).toLocaleDateString()
					: "-",
				student.profile.gender === "male"
					? t("common.gender.male", { defaultValue: "M" })
					: student.profile.gender === "female"
						? t("common.gender.female", { defaultValue: "F" })
						: "-",
			]);

			// Combine all rows
			const worksheetData = [...headerRows, ...dataRows];

			// Create workbook and worksheet
			const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
			const workbook = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(
				workbook,
				worksheet,
				t("admin.classes.export.sheetName", { defaultValue: "Students" }),
			);

			// Apply some basic styling to header row
			const headerRowIndex = 11; // 0-indexed, row 12 in spreadsheet
			const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
			for (let C = range.s.c; C <= range.e.c; ++C) {
				const address = XLSX.utils.encode_col(C) + (headerRowIndex + 1);
				if (!worksheet[address]) continue;
				if (!worksheet[address].s) worksheet[address].s = {};
				worksheet[address].s = {
					font: { bold: true },
					fill: { fgColor: { rgb: "2980B9" } },
				};
			}

			// Set column widths
			worksheet["!cols"] = [
				{ wch: 5 }, // #
				{ wch: 15 }, // Registration Number
				{ wch: 20 }, // Last Name
				{ wch: 20 }, // First Name
				{ wch: 12 }, // Birth Date
				{ wch: 8 }, // Gender
			];

			// Generate and download Excel file
			XLSX.writeFile(
				workbook,
				`students_${classData.code}_${new Date().toISOString().split("T")[0]}.xlsx`,
			);

			toast.success(
				t("admin.classes.export.excelSuccess", {
					defaultValue: "Student list exported successfully",
				}),
			);
		} catch (error) {
			console.error("Error exporting Excel:", error);
			toast.error(
				t("admin.classes.export.excelError", {
					defaultValue: "Failed to export student list",
				}),
			);
		}
	};

	const classCodes = classes.map((cls) => cls.code).filter(Boolean);

	const openCreate = async () => {
		const created = await ClassFormDialog.call({
			defaults: { academicYearId: filterYear ?? undefined },
			existingCodes: classCodes,
		});
		if (created?.id) navigate(`/admin/classes/${created.id}/details`);
	};

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			await trpcClient.classes.delete.mutate({ id });
		},
		onSuccess: () => {
			queryClient.invalidateQueries(trpc.classes.listPaged.queryKey());
			toast.success(t("admin.classes.toast.deleteSuccess"));
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.classes.toast.deleteError");
			toast.error(message);
		},
	});

	const bulkDeleteMutation = useMutation({
		mutationFn: async (ids: string[]) => {
			await Promise.all(
				ids.map((id) => trpcClient.classes.delete.mutate({ id })),
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries(trpc.classes.listPaged.queryKey());
			selection.clear();
			toast.success(
				t("common.bulkActions.deleteSuccess", {
					defaultValue: "Items deleted successfully",
				}),
			);
		},
		onError: () =>
			toast.error(
				t("common.bulkActions.deleteError", {
					defaultValue: "Failed to delete items",
				}),
			),
	});

	const openDeleteModal = (id: string) => {
		const studentCount = classes.find((c) => c.id === id)?.studentCount ?? 0;
		return confirmAction({
			title: t("admin.classes.delete.title"),
			message:
				studentCount > 0
					? t("admin.classes.delete.messageWithStudents", {
							count: studentCount,
						})
					: t("admin.classes.delete.message"),
			confirmText: t("common.actions.delete"),
			onConfirm: () => deleteMutation.mutateAsync(id).catch(() => undefined),
		});
	};

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<span className="loading loading-spinner loading-lg" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-foreground">{t("admin.classes.title")}</h1>
					<p className="text-base-content/60">{t("admin.classes.subtitle")}</p>
				</div>
				<div className="flex gap-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => BulkGenerateClassesDialog.call()}
					>
						<Wand2 className="mr-2 h-4 w-4" />
						{t("admin.classes.actions.bulkGenerate", {
							defaultValue: "Générer les classes",
						})}
					</Button>
					<Button
						type="button"
						variant="outline"
						onClick={() => BulkClassExportDialog.call({ classes })}
						disabled={classes.length === 0}
					>
						<Download className="mr-2 h-4 w-4" />
						Exporter en lot
					</Button>
					<Button
						type="button"
						onClick={openCreate}
						className="btn btn-primary"
					>
						<Plus className="mr-2 h-5 w-5" />
						{t("admin.classes.actions.add")}
					</Button>
				</div>
			</div>

			<Card className="mb-4">
				<CardHeader className="pb-3">
					<CardTitle className="font-medium text-muted-foreground text-sm">
						{t("admin.classes.filters.title", { defaultValue: "Filters" })}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap items-end gap-4">
						<div className="w-56">
							<Label className="mb-1 block font-medium text-sm">
								{t("admin.classes.filters.academicYear", {
									defaultValue: "Academic Year",
								})}
							</Label>
							<AcademicYearSelect
								value={filterYear}
								onChange={handleFilter(setFilterYear)}
							/>
						</div>
						<div className="w-56">
							<Label className="mb-1 block font-medium text-sm">
								{t("admin.classes.filters.semester", {
									defaultValue: "Semester",
								})}
							</Label>
							<SemesterSelect
								value={filterSemester}
								onChange={handleFilter(setFilterSemester)}
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			<BulkActionBar
				selectedCount={selection.selectedCount}
				onClear={selection.clear}
			>
				<Button
					variant="destructive"
					size="sm"
					onClick={() =>
						confirmAction({
							title: t("common.bulkActions.confirmDeleteTitle", {
								defaultValue: "Delete selected items?",
							}),
							message: t("common.bulkActions.confirmDelete", {
								defaultValue:
									"Are you sure you want to delete the selected items?",
							}),
							confirmText: t("common.actions.delete"),
							onConfirm: () =>
								bulkDeleteMutation.mutate([...selection.selectedIds]),
						})
					}
					disabled={bulkDeleteMutation.isPending}
				>
					<Trash2 className="mr-1.5 h-3.5 w-3.5" />
					{t("common.actions.delete")}
				</Button>
			</BulkActionBar>

			<Card className="overflow-x-auto">
				{classes?.length === 0 ? (
					<div className="card-body items-center py-12 text-center">
						<Users className="mx-auto h-16 w-16 text-base-content/20" />
						<h2 className="mt-4 font-semibold text-foreground text-lg">
							{t("admin.classes.empty.title")}
						</h2>
						<p className="text-base-content/60">
							{t("admin.classes.empty.description")}
						</p>
						<Button
							type="button"
							onClick={openCreate}
							className="btn btn-primary mt-4"
						>
							<Plus className="mr-2 h-4 w-4" />
							{t("admin.classes.actions.add")}
						</Button>
					</div>
				) : isLoading ? (
					<TableSkeleton columns={8} rows={8} />
				) : (
					<Table className="table-fixed">
						<TableHeader>
							<TableRow>
								<TableHead className="w-10">
									<Checkbox
										checked={selection.isAllSelected}
										onCheckedChange={(checked) =>
											selection.toggleAll(!!checked)
										}
										aria-label="Select all"
									/>
								</TableHead>
								<TableHead className="w-[13%] truncate">
									{t("admin.classes.table.code", { defaultValue: "Code" })}
								</TableHead>
								<TableHead className="w-[28%] truncate">
									{t("admin.classes.table.classProgram", {
										defaultValue: "Class / Program",
									})}
								</TableHead>
								<TableHead className="w-[20%] truncate">
									{t("admin.classes.table.cycle", {
										defaultValue: "Cycle / level",
									})}
								</TableHead>
								<TableHead className="w-[11%] truncate">
									{t("admin.classes.table.optionSemester", {
										defaultValue: "Option / Semester",
									})}
								</TableHead>
								<TableHead className="w-[13%] truncate">
									{t("admin.classes.table.credits", {
										defaultValue: "Credits",
									})}
								</TableHead>
								<TableHead className="w-[11%] truncate">
									{t("admin.classes.table.students")}
								</TableHead>
								<TableHead className="w-12" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{classes?.map((cls) => (
								<TableRow
									key={cls.id}
									onClick={() => navigate(`/admin/classes/${cls.id}/details`)}
									className="cursor-pointer"
									actions={
										<>
											<ContextMenuItem
												onSelect={() =>
													navigate(`/admin/classes/${cls.id}/details`)
												}
											>
												<span>
													{t("common.actions.edit", { defaultValue: "Edit" })}
												</span>
											</ContextMenuItem>
											<ContextMenuSeparator />
											<ContextMenuItem
												onSelect={() => handleExportStudentListPDF(cls)}
											>
												<FileText className="h-4 w-4" />
												<span>
													{t("admin.classes.export.button", {
														defaultValue: "Export PDF",
													})}
												</span>
											</ContextMenuItem>
											<ContextMenuItem
												onSelect={() => handleExportStudentListExcel(cls)}
											>
												<FileSpreadsheet className="h-4 w-4" />
												<span>
													{t("admin.classes.export.excelButton", {
														defaultValue: "Export Excel",
													})}
												</span>
											</ContextMenuItem>
											<ContextMenuSeparator />
											<ContextMenuItem
												variant="destructive"
												onSelect={() => openDeleteModal(cls.id)}
											>
												<span>{t("common.actions.delete")}</span>
											</ContextMenuItem>
										</>
									}
								>
									<TableCell onClick={(e) => e.stopPropagation()}>
										<Checkbox
											checked={selection.isSelected(cls.id)}
											onCheckedChange={() => selection.toggle(cls.id)}
											aria-label={`Select ${cls.name}`}
										/>
									</TableCell>
									<TableCell>
										<ClipboardCopy
											value={cls.code}
											label={t("admin.classes.table.code", {
												defaultValue: "Code",
											})}
										/>
									</TableCell>
									<TableCell>
										<div className="min-w-0 space-y-0.5">
											<p
												className="truncate font-medium text-sm"
												title={cls.name}
											>
												{cls.name}
											</p>
											<p
												className="truncate text-muted-foreground text-xs"
												title={cls.program?.name}
											>
												{cls.program?.name}
											</p>
										</div>
									</TableCell>
									<TableCell>
										{cls.cycle ? (
											<div className="min-w-0 space-y-0.5">
												<p
													className="truncate font-medium text-sm"
													title={cls.cycle.name}
												>
													{cls.cycle.name}
												</p>
												<p
													className="truncate text-muted-foreground text-xs"
													title={cls.cycleLevel?.name}
												>
													{cls.cycleLevel?.name}
													{cls.cycleLevel?.code
														? ` (${cls.cycleLevel.code})`
														: ""}
												</p>
											</div>
										) : (
											t("common.labels.notAvailable", { defaultValue: "N/A" })
										)}
									</TableCell>
									<TableCell>
										<div className="min-w-0 space-y-0.5">
											{cls.programOption ? (
												<p
													className="truncate font-medium text-sm"
													title={cls.programOption.name}
												>
													{cls.programOption.name}
												</p>
											) : (
												<p className="text-muted-foreground text-xs">
													{t("common.labels.notAvailable", {
														defaultValue: "N/A",
													})}
												</p>
											)}
											{cls.semester ? (
												<p className="truncate text-muted-foreground text-xs">
													{cls.semester.name}
												</p>
											) : null}
										</div>
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-1.5 whitespace-nowrap">
											<span className="font-medium text-sm">
												{cls.assignedCredits}
											</span>
											<span className="text-muted-foreground text-xs">
												/ {cls.totalCredits}
											</span>
											{cls.totalCredits > 0 &&
												cls.assignedCredits < cls.totalCredits && (
													<Badge
														variant="outline"
														className="border-amber-500/50 bg-amber-500/10 px-1.5 py-0 text-[10px] text-amber-600 dark:text-amber-400"
													>
														-{cls.totalCredits - cls.assignedCredits}
													</Badge>
												)}
										</div>
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-2 whitespace-nowrap">
											<Users className="h-4 w-4" />
											<span>{cls.studentCount ?? 0}</span>
										</div>
									</TableCell>
									<TableCell onClick={(e) => e.stopPropagation()}>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="icon" className="h-8 w-8">
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem
													onClick={() =>
														navigate(`/admin/classes/${cls.id}/details`)
													}
												>
													<Pencil className="mr-2 h-4 w-4" />
													{t("common.actions.edit", {
														defaultValue: "Edit",
													})}
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => handleExportStudentListPDF(cls)}
												>
													<FileText className="mr-2 h-4 w-4" />
													{t("admin.classes.export.button", {
														defaultValue: "Export PDF",
													})}
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => handleExportStudentListExcel(cls)}
												>
													<FileSpreadsheet className="mr-2 h-4 w-4" />
													{t("admin.classes.export.excelButton", {
														defaultValue: "Export Excel",
													})}
												</DropdownMenuItem>
												<DropdownMenuItem
													className="text-destructive"
													onClick={() => openDeleteModal(cls.id)}
												>
													<Trash2 className="mr-2 h-4 w-4" />
													{t("common.actions.delete", {
														defaultValue: "Delete",
													})}
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</Card>

			<TablePagination
				page={page}
				pageCount={data?.pageCount ?? 1}
				total={data?.total ?? 0}
				pageSize={pageSize}
				onPageChange={setPage}
				onPageSizeChange={(s) => {
					setPageSize(s);
					setPage(1);
				}}
			/>
		</div>
	);
}

/**
 * Generates every program × option × level class of a year (optionally
 * cloning teacher assignments from another year); resolves with the counts.
 */
export const BulkGenerateClassesDialog = createCallable<
	void,
	RouterOutputs["classes"]["bulkGenerate"] | undefined
>(({ call }) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [yearId, setYearId] = useState<string | null>(null);
	const [sourceYearId, setSourceYearId] = useState<string | null>(null);

	const generate = useMutationFlow(call, async (call) => {
		if (!yearId) return;
		try {
			const result = await trpcClient.classes.bulkGenerate.mutate({
				academicYearId: yearId,
				sourceAcademicYearId: sourceYearId ?? undefined,
			});
			queryClient.invalidateQueries(trpc.classes.listPaged.queryKey());
			toast.success(
				t("admin.classes.toast.bulkGenerateSuccess", {
					created: result.created,
					skipped: result.skipped,
					defaultValue: `${result.created} classe(s) créée(s), ${result.skipped} ignorée(s)`,
				}),
			);
			call.end(result);
		} catch (err) {
			toast.error((err as Error).message);
		}
	});

	return (
		<Dialog
			open={!call.ended}
			onOpenChange={(o) => !o && !generate.pending && call.end(undefined)}
		>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>
						{t("admin.classes.bulkGenerate.title", {
							defaultValue: "Générer toutes les classes",
						})}
					</DialogTitle>
					<DialogDescription>
						{t("admin.classes.bulkGenerate.description", {
							defaultValue:
								"Crée automatiquement une classe pour chaque combinaison programme × option × niveau pour l'année sélectionnée. Les combinaisons existantes sont ignorées.",
						})}
					</DialogDescription>
				</DialogHeader>
				<DialogBody className="space-y-4">
					<div className="space-y-2">
						<Label>
							{t("admin.classes.bulkGenerate.yearLabel", {
								defaultValue: "Année académique cible",
							})}
						</Label>
						<AcademicYearSelect
							value={yearId}
							onChange={setYearId}
							autoSelectActive
						/>
					</div>
					<div className="space-y-2">
						<Label>
							{t("admin.classes.bulkGenerate.sourceYearLabel", {
								defaultValue: "Cloner les affectations depuis (optionnel)",
							})}
						</Label>
						<AcademicYearSelect
							value={sourceYearId}
							onChange={setSourceYearId}
							autoSelectActive={false}
							placeholder="Aucune (optionnel)"
						/>
						<p className="text-muted-foreground text-xs">
							{t("admin.classes.bulkGenerate.sourceYearHint", {
								defaultValue:
									"Si renseignée, les affectations enseignants de cette année seront copiées vers les nouvelles classes.",
							})}
						</p>
					</div>
				</DialogBody>
				<DialogFooter>
					<Button
						variant="outline"
						disabled={generate.pending}
						onClick={() => call.end(undefined)}
					>
						{t("common.actions.cancel")}
					</Button>
					<Button
						onClick={() => generate()}
						disabled={!yearId || generate.pending}
					>
						{generate.pending && (
							<Spinner className="mr-2 h-4 w-4 animate-spin" />
						)}
						{t("admin.classes.bulkGenerate.submit", {
							defaultValue: "Générer",
						})}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}, DIALOG_EXIT_MS);
