import { zodResolver } from "@hookform/resolvers/zod";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
	Eye,
	FileSpreadsheet,
	FileText,
	MoreHorizontal,
	Pencil,
	Plus,
	Search,
	Trash2,
	Users,
	Wand2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import * as XLSX from "xlsx";
import { z } from "zod";
import { CodedEntitySelect } from "@/components/forms";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { SemesterSelect } from "@/components/inputs/SemesterSelect";
import { Badge } from "@/components/ui/badge";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ClipboardCopy } from "@/components/ui/clipboard-copy";
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
import {
	ContextMenuItem,
	ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useRowSelection } from "@/hooks/useRowSelection";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { generateClassCode } from "@/lib/code-generator";
import ConfirmModal from "../../components/modals/ConfirmModal";
import FormModal from "../../components/modals/FormModal";
import { Button } from "../../components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { ScrollArea } from "../../components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../components/ui/select";
import { Spinner } from "../../components/ui/spinner";
import type { RouterOutputs } from "../../utils/trpc";
import { trpcClient } from "../../utils/trpc";

const buildClassSchema = (t: TFunction) =>
	z.object({
		programId: z.string({
			required_error: t("admin.classes.validation.program"),
		}),
		academicYearId: z.string({
			required_error: t("admin.classes.validation.academicYear"),
		}),
		cycleLevelId: z.string({
			required_error: t("admin.classes.validation.cycleLevel", {
				defaultValue: "Please select a cycle level",
			}),
		}),
		programOptionId: z.string({
			required_error: t("admin.classes.validation.programOption", {
				defaultValue: "Please select a program option",
			}),
		}),
		semesterId: z.string().optional(),
		code: z.string().min(
			3,
			t("admin.classes.validation.code", {
				defaultValue: "Code is required",
			}),
		),
		name: z.string().min(2, t("admin.classes.validation.name")),
		totalCredits: z.coerce.number().int().min(0).default(0),
	});

type ClassFormData = z.infer<ReturnType<typeof buildClassSchema>>;

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
	students: { id: string }[];
}

type CycleLevelOption = RouterOutputs["studyCycles"]["listLevels"][number] & {
	cycle: {
		id: string;
		name: string;
		code: string | null;
	};
};

type SemesterOption = RouterOutputs["semesters"]["list"][number];

export default function ClassManagement() {
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [editingClass, setEditingClass] = useState<Class | null>(null);
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [programSearch, setProgramSearch] = useState("");
	const [programOptionSearch, setProgramOptionSearch] = useState("");
	const [cycleLevelSearch, setCycleLevelSearch] = useState("");
	const [filterYear, setFilterYear] = useState<string | null>(null);
	const [filterSemester, setFilterSemester] = useState<string | null>(null);
	const [previewClass, setPreviewClass] = useState<Class | null>(null);
	const [previewStudents, setPreviewStudents] = useState<any[]>([]);
	const [previewLoading, setPreviewLoading] = useState(false);
	const [studentSearch, setStudentSearch] = useState("");
	const [isBulkGenOpen, setIsBulkGenOpen] = useState(false);
	const [bulkGenYearId, setBulkGenYearId] = useState<string | null>(null);

	const queryClient = useQueryClient();
	const { t } = useTranslation();
	const classSchema = useMemo(() => buildClassSchema(t), [t]);

	const { data: classesData, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
		queryKey: ["classes", filterYear, filterSemester],
		queryFn: async ({ pageParam }) => {
			const { items, nextCursor } = await trpcClient.classes.list.query({
				cursor: pageParam,
				limit: 20,
				...(filterYear ? { academicYearId: filterYear } : {}),
				...(filterSemester ? { semesterId: filterSemester } : {}),
			});
			// TODO: N+1 Query Problem - This fetches students for each class separately
			// Better solution: Modify backend classes.list to include studentCount
			// or create a batch endpoint that returns classes with student counts
			const enriched = await Promise.all(
				items.map(async (cls) => {
					const students = await trpcClient.students.list.query({
						classId: cls.id,
					});
					return {
						id: cls.id,
						code: cls.code,
						name: cls.name,
						programId: cls.program,
						academicYearId: cls.academicYear,
						cycleLevelId: cls.cycleLevelId,
						programOptionId: cls.programOptionId,
						semesterId: cls.semester?.id ?? null,
						totalCredits: (cls as any).totalCredits ?? 0,
						assignedCredits: (cls as any).assignedCredits ?? 0,
						program: {
							name: cls.programInfo?.name ?? "",
							code: cls.programInfo?.code ?? "",
							cycleName: cls.cycle?.name,
							cycleCode: cls.cycle?.code,
						},
						academicYear: { name: cls.academicYearInfo?.name ?? "" },
						cycle: cls.cycle ?? undefined,
						cycleLevel: cls.cycleLevel ?? undefined,
						programOption: cls.programOption ?? undefined,
						semester: cls.semester ?? undefined,
						students: students.items.map((s) => ({ id: s.id })),
					} as Class;
				}),
			);
			return { items: enriched, nextCursor };
		},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
	});

	const classes = classesData?.pages.flatMap((p) => p.items) ?? [];
	const sentinelRef = useInfiniteScroll(fetchNextPage, { enabled: hasNextPage && !isFetchingNextPage });
	const selection = useRowSelection(classes ?? []);

	const { data: defaultPrograms = [] } = useQuery({
		queryKey: ["programs"],
		queryFn: async () => {
			const { items } = await trpcClient.programs.list.query({ limit: 100 });
			return items;
		},
	});

	const { data: searchPrograms = [] } = useQuery({
		queryKey: ["programs", "search", programSearch],
		queryFn: async () => {
			const items = await trpcClient.programs.search.query({
				query: programSearch,
			});
			return items;
		},
		enabled: programSearch.length >= 2,
	});

	const programs = programSearch.length >= 2 ? searchPrograms : defaultPrograms;

	const { data: academicYears } = useQuery({
		queryKey: ["academicYears"],
		queryFn: async () => {
			const { items } = await trpcClient.academicYears.list.query({});
			return items;
		},
	});

	const form = useForm<ClassFormData>({
		resolver: zodResolver(classSchema),
		defaultValues: {
			programId: "",
			academicYearId: "",
			cycleLevelId: "",
			programOptionId: "",
			semesterId: "",
			code: "",
			name: "",
			totalCredits: 0,
		},
	});

	const { watch, setValue } = form;

	const selectedProgramId = watch("programId");
	const selectedAcademicYearId = watch("academicYearId");
	const selectedProgram = useMemo(
		() => programs?.find((p) => p.id === selectedProgramId),
		[programs, selectedProgramId],
	);

	const { data: defaultCycleLevels = [] } = useQuery({
		queryKey: ["cycleLevelsByInstitution", selectedProgram?.institutionId],
		queryFn: async () => {
			if (!selectedProgram?.institutionId) return [] as CycleLevelOption[];
			const { items: cycles } = await trpcClient.studyCycles.listCycles.query({
				institutionId: selectedProgram.institutionId,
				limit: 100,
			});
			if (!cycles.length) return [];
			const levels = await Promise.all(
				cycles.map(async (cycle) => {
					const levelList = await trpcClient.studyCycles.listLevels.query({
						cycleId: cycle.id,
					});
					return levelList.map((level) => ({
						...level,
						cycle: {
							id: cycle.id,
							name: cycle.name,
							code: cycle.code,
						},
					}));
				}),
			);
			return levels.flat() as CycleLevelOption[];
		},
		enabled: Boolean(selectedProgram?.institutionId),
	});

	const { data: searchCycleLevels = [] } = useQuery({
		queryKey: [
			"cycleLevels",
			"search",
			cycleLevelSearch,
			selectedProgram?.institutionId,
		],
		queryFn: async () => {
			if (!selectedProgram?.institutionId) return [] as CycleLevelOption[];
			const { items: cycles } = await trpcClient.studyCycles.listCycles.query({
				institutionId: selectedProgram.institutionId,
				limit: 100,
			});
			if (!cycles.length) return [];
			const levels = await Promise.all(
				cycles.map(async (cycle) => {
					const items = await trpcClient.cycleLevels.search.query({
						query: cycleLevelSearch,
						cycleId: cycle.id,
					});
					return items.map((level) => ({
						...level,
						cycle: {
							id: cycle.id,
							name: cycle.name,
							code: cycle.code,
						},
					}));
				}),
			);
			return levels.flat() as CycleLevelOption[];
		},
		enabled:
			Boolean(selectedProgram?.institutionId) && cycleLevelSearch.length >= 2,
	});

	const cycleLevels =
		cycleLevelSearch.length >= 2 ? searchCycleLevels : defaultCycleLevels;
	const cycleLevelId = watch("cycleLevelId");
	const selectedCycleLevel = useMemo(
		() => cycleLevels.find((level) => level.id === cycleLevelId),
		[cycleLevels, cycleLevelId],
	);

	const { data: semestersData } = useQuery({
		queryKey: ["semesters"],
		queryFn: () => trpcClient.semesters.list.query(),
	});
	const semesters = semestersData?.items;
	const semesterId = watch("semesterId");
	const selectedSemester = useMemo(
		() => semesters?.find((semester) => semester.id === semesterId),
		[semesters, semesterId],
	);

	useEffect(() => {
		if (!selectedProgram) {
			setValue("cycleLevelId", "");
		}
	}, [selectedProgram, setValue]);

	useEffect(() => {
		if (!cycleLevels.length) return;
		if (
			!cycleLevelId ||
			!cycleLevels.some((level) => level.id === cycleLevelId)
		) {
			setValue("cycleLevelId", cycleLevels[0].id);
		}
	}, [cycleLevels, cycleLevelId, setValue]);

	const { data: defaultProgramOptions = [] } = useQuery({
		queryKey: ["programOptions", selectedProgram?.id],
		queryFn: async () => {
			if (!selectedProgram) return [];
			const { items } = await trpcClient.programOptions.list.query({
				programId: selectedProgram.id,
				limit: 100,
			});
			return items;
		},
		enabled: Boolean(selectedProgram?.id),
	});

	const { data: searchProgramOptions = [] } = useQuery({
		queryKey: [
			"programOptions",
			"search",
			programOptionSearch,
			selectedProgram?.id,
		],
		queryFn: async () => {
			if (!selectedProgram) return [];
			const items = await trpcClient.programOptions.search.query({
				query: programOptionSearch,
				programId: selectedProgram.id,
			});
			return items;
		},
		enabled: Boolean(selectedProgram?.id) && programOptionSearch.length >= 2,
	});

	const programOptions =
		programOptionSearch.length >= 2
			? searchProgramOptions
			: defaultProgramOptions;
	const programOptionId = watch("programOptionId");
	const selectedProgramOption = useMemo(
		() => programOptions.find((option) => option.id === programOptionId),
		[programOptions, programOptionId],
	);

	useEffect(() => {
		if (!selectedProgram) {
			setValue("programOptionId", "");
		}
	}, [selectedProgram, setValue]);

	useEffect(() => {
		if (!programOptions.length) return;
		if (
			!programOptionId ||
			!programOptions.some((option) => option.id === programOptionId)
		) {
			setValue("programOptionId", programOptions[0].id);
		}
	}, [programOptions, programOptionId, setValue]);

	useEffect(() => {
		const year = academicYears?.find((y) => y.id === selectedAcademicYearId);
		if (selectedProgramOption && year) {
			const startYear = new Date(year.startDate).getFullYear();
			const endYear = new Date(year.endDate).getFullYear();
			setValue(
				"name",
				`${selectedProgramOption.name} (${startYear}-${endYear})`,
			);
		}
	}, [selectedProgramOption, selectedAcademicYearId, academicYears, setValue]);

	const handlePreviewStudents = async (classData: Class) => {
		setPreviewClass(classData);
		setPreviewLoading(true);
		setStudentSearch("");
		try {
			const studentsData = await trpcClient.students.list.query({
				classId: classData.id,
				limit: 1000,
			});
			const sorted = [...studentsData.items].sort(
				(a, b) =>
					(a.profile.lastName ?? "").localeCompare(b.profile.lastName ?? "") ||
					(a.profile.firstName ?? "").localeCompare(b.profile.firstName ?? ""),
			);
			setPreviewStudents(sorted);
		} catch (error) {
			console.error("Error fetching students:", error);
			setPreviewStudents([]);
		} finally {
			setPreviewLoading(false);
		}
	};

	const handleExportStudentListPDF = async (classData: Class) => {
		try {
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

	const classCodes = useMemo(
		() => (classes ?? []).map((cls) => cls.code).filter(Boolean),
		[classes],
	);
	const codeValue = watch("code");
	const codeDirty = Boolean(form.formState.dirtyFields.code);
	useEffect(() => {
		if (editingClass) return;
		if (codeDirty) return;
		if (!selectedProgram?.code) return;
		if (!selectedSemester?.code) return;
		const suggestion = generateClassCode({
			programCode: selectedProgram.code,
			levelCode: selectedCycleLevel?.code,
			semesterCode: selectedSemester.code,
			existingCodes: classCodes,
		});
		if (suggestion && codeValue !== suggestion) {
			setValue("code", suggestion, { shouldDirty: false });
		}
	}, [
		classCodes,
		codeDirty,
		codeValue,
		editingClass,
		selectedProgram?.code,
		selectedCycleLevel?.code,
		selectedSemester?.code,
		setValue,
	]);

	const createMutation = useMutation({
		mutationFn: async (data: ClassFormData) => {
			await trpcClient.classes.create.mutate({
				name: data.name,
				program: data.programId,
				academicYear: data.academicYearId,
				cycleLevelId: data.cycleLevelId,
				programOptionId: data.programOptionId,
				semesterId: data.semesterId || undefined,
				code: data.code,
				totalCredits: data.totalCredits,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["classes"] });
			toast.success(t("admin.classes.toast.createSuccess"));
			setIsFormOpen(false);
			form.reset();
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.classes.toast.createError");
			toast.error(message);
		},
	});

	const updateMutation = useMutation({
		mutationFn: async (data: ClassFormData & { id: string }) => {
			await trpcClient.classes.update.mutate({
				id: data.id,
				name: data.name,
				program: data.programId,
				academicYear: data.academicYearId,
				cycleLevelId: data.cycleLevelId,
				programOptionId: data.programOptionId,
				semesterId: data.semesterId || undefined,
				code: data.code,
				totalCredits: data.totalCredits,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["classes"] });
			toast.success(t("admin.classes.toast.updateSuccess"));
			setIsFormOpen(false);
			setEditingClass(null);
			form.reset();
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.classes.toast.updateError");
			toast.error(message);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			await trpcClient.classes.delete.mutate({ id });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["classes"] });
			toast.success(t("admin.classes.toast.deleteSuccess"));
			setIsDeleteOpen(false);
			setDeleteId(null);
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
			queryClient.invalidateQueries({ queryKey: ["classes"] });
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

	const bulkGenerateMutation = useMutation({
		mutationFn: () =>
			trpcClient.classes.bulkGenerate.mutate({
				academicYearId: bulkGenYearId!,
			}),
		onSuccess: (result) => {
			queryClient.invalidateQueries({ queryKey: ["classes"] });
			toast.success(
				t("admin.classes.toast.bulkGenerateSuccess", {
					created: result.created,
					skipped: result.skipped,
					defaultValue: `${result.created} classe(s) créée(s), ${result.skipped} ignorée(s)`,
				}),
			);
			setIsBulkGenOpen(false);
			setBulkGenYearId(null);
		},
		onError: (err) =>
			toast.error((err as Error).message),
	});

	const onSubmit = async (data: ClassFormData) => {
		if (editingClass) {
			updateMutation.mutate({ ...data, id: editingClass.id });
		} else {
			createMutation.mutate(data);
		}
	};

	const openDeleteModal = (id: string) => {
		setDeleteId(id);
		setIsDeleteOpen(true);
	};

	const handleDelete = () => {
		if (deleteId) {
			deleteMutation.mutate(deleteId);
		}
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
					<h1 className="text-foreground">
						{t("admin.classes.title")}
					</h1>
					<p className="text-base-content/60">{t("admin.classes.subtitle")}</p>
				</div>
				<div className="flex gap-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => setIsBulkGenOpen(true)}
					>
						<Wand2 className="mr-2 h-4 w-4" />
						{t("admin.classes.actions.bulkGenerate", { defaultValue: "Générer les classes" })}
					</Button>
					<Button
						type="button"
						onClick={() => {
							setEditingClass(null);
							form.reset();
							setIsFormOpen(true);
						}}
						className="btn btn-primary"
					>
						<Plus className="mr-2 h-5 w-5" />
						{t("admin.classes.actions.add")}
					</Button>
				</div>
			</div>

			<Card className="mb-4">
				<CardHeader className="pb-3">
					<CardTitle className="text-sm font-medium text-muted-foreground">
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
								onChange={(v) => setFilterYear(v)}
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
								onChange={(v) => setFilterSemester(v)}
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
					onClick={() => {
						if (
							window.confirm(
								t("common.bulkActions.confirmDelete", {
									defaultValue:
										"Are you sure you want to delete the selected items?",
								}),
							)
						) {
							bulkDeleteMutation.mutate([...selection.selectedIds]);
						}
					}}
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
							onClick={() => {
								setEditingClass(null);
								form.reset();
								setIsFormOpen(true);
							}}
							className="btn btn-primary mt-4"
						>
							<Plus className="mr-2 h-4 w-4" />
							{t("admin.classes.actions.add")}
						</Button>
					</div>
				) : isLoading ? (
						<TableSkeleton columns={8} rows={8} />
					) : (
					<Table>
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
								<TableHead className="w-24">
							{t("admin.classes.table.code", { defaultValue: "Code" })}
								</TableHead>
								<TableHead>
							{t("admin.classes.table.classProgram", {
										defaultValue: "Class / Program",
									})}
								</TableHead>
								<TableHead className="w-36">
							{t("admin.classes.table.cycle", {
										defaultValue: "Cycle / level",
									})}
								</TableHead>
								<TableHead>
							{t("admin.classes.table.optionSemester", {
										defaultValue: "Option / Semester",
									})}
								</TableHead>
								<TableHead className="w-16">
							{t("admin.classes.table.credits", {
										defaultValue: "Credits",
									})}
								</TableHead>
								<TableHead className="w-24">{t("admin.classes.table.students")}</TableHead>
								<TableHead className="w-10" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{classes?.map((cls) => (
								<TableRow
							key={cls.id}
							actions={
								<>
									<ContextMenuItem onSelect={() => { setEditingClass(cls); form.reset({ name: cls.name }); setIsFormOpen(true); }}>
										<span>{t("common.actions.edit", { defaultValue: "Edit" })}</span>
									</ContextMenuItem>
									<ContextMenuSeparator />
									<ContextMenuItem onSelect={() => handlePreviewStudents(cls)}>
										<Eye className="h-4 w-4" />
										<span>{t("admin.classes.preview.button", { defaultValue: "View student list" })}</span>
									</ContextMenuItem>
									<ContextMenuItem onSelect={() => handleExportStudentListPDF(cls)}>
										<FileText className="h-4 w-4" />
										<span>{t("admin.classes.export.button", { defaultValue: "Export PDF" })}</span>
									</ContextMenuItem>
									<ContextMenuItem onSelect={() => handleExportStudentListExcel(cls)}>
										<FileSpreadsheet className="h-4 w-4" />
										<span>{t("admin.classes.export.excelButton", { defaultValue: "Export Excel" })}</span>
									</ContextMenuItem>
									<ContextMenuSeparator />
									<ContextMenuItem variant="destructive" onSelect={() => openDeleteModal(cls.id)}>
										<span>{t("common.actions.delete")}</span>
									</ContextMenuItem>
								</>
							}
						>
									<TableCell>
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
										<div className="space-y-0.5">
											<p className="font-medium text-sm">{cls.name}</p>
											<p className="text-muted-foreground text-xs">
												{cls.program?.name}
											</p>
										</div>
									</TableCell>
									<TableCell>
										{cls.cycle ? (
											<div className="space-y-0.5">
												<p className="font-medium text-sm">{cls.cycle.name}</p>
												<p className="text-muted-foreground text-xs">
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
										<div className="space-y-0.5">
											{cls.programOption ? (
												<p className="font-medium text-sm">
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
												<p className="text-muted-foreground text-xs">
													{cls.semester.name}
												</p>
											) : null}
										</div>
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-1.5">
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
										<div className="flex items-center gap-2">
											<Users className="h-4 w-4" />
											<span>{cls.students?.length || 0}</span>
										</div>
									</TableCell>
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="icon" className="h-8 w-8">
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem
													onClick={() => {
														setEditingClass(cls);
														form.reset({
															name: cls.name,
															programId: cls.programId,
															academicYearId: cls.academicYearId,
															cycleLevelId: cls.cycleLevelId,
															programOptionId: cls.programOptionId,
															semesterId: cls.semesterId ?? "",
															code: cls.code,
															totalCredits: cls.totalCredits,
														});
														setIsFormOpen(true);
													}}
												>
													<Pencil className="mr-2 h-4 w-4" />
													{t("common.actions.edit", {
														defaultValue: "Edit",
													})}
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => handlePreviewStudents(cls)}
												>
													<Eye className="mr-2 h-4 w-4" />
													{t("admin.classes.preview.button", {
														defaultValue: "View student list",
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

			<div ref={sentinelRef} className="h-1" />

			<FormModal
				isOpen={isFormOpen}
				onClose={() => {
					setIsFormOpen(false);
					setEditingClass(null);
					form.reset();
				}}
				title={
					editingClass
						? t("admin.classes.form.editTitle")
						: t("admin.classes.form.createTitle")
				}
			>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<CodedEntitySelect
							items={programs}
							onSearch={setProgramSearch}
							value={
								programs.find((p) => p.id === form.watch("programId"))?.code ||
								null
							}
							onChange={(code) => {
								const program = programs.find((p) => p.code === code);
								form.setValue("programId", program?.id || "");
							}}
							label={t("admin.classes.form.programLabel")}
							placeholder={t("admin.classes.form.programPlaceholder")}
							error={form.formState.errors.programId?.message}
							searchMode="hybrid"
							getItemSubtitle={(program) => program.institutionInfo?.name || ""}
							required
						/>

						<div className="grid gap-4 sm:grid-cols-2">
							<FormField
								control={form.control}
								name="academicYearId"
								render={({ field }) => (
									<FormItem>
										<FormLabel required>
											{t("admin.classes.form.academicYearLabel")}
										</FormLabel>
										<FormControl>
											<AcademicYearSelect
												value={field.value || null}
												onChange={field.onChange}
												placeholder={t(
													"admin.classes.form.academicYearPlaceholder",
												)}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="semesterId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.classes.form.semesterLabel", {
												defaultValue: "Semester",
											})}
										</FormLabel>
										<Select
											onValueChange={field.onChange}
											value={field.value}
											disabled={!semesters || semesters.length === 0}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue
														placeholder={t(
															"admin.classes.form.semesterPlaceholder",
															{ defaultValue: "Select a semester" },
														)}
													/>
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{semesters?.map((semester) => (
													<SelectItem key={semester.id} value={semester.id}>
														{semester.name} ({semester.code})
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<CodedEntitySelect
							items={cycleLevels}
							onSearch={setCycleLevelSearch}
							value={
								cycleLevels.find((l) => l.id === form.watch("cycleLevelId"))
									?.code || null
							}
							onChange={(code) => {
								const level = cycleLevels.find((l) => l.code === code);
								form.setValue("cycleLevelId", level?.id || "");
							}}
							label={t("admin.classes.form.cycleLevelLabel", {
								defaultValue: "Cycle level",
							})}
							placeholder={t("admin.classes.form.cycleLevelPlaceholder", {
								defaultValue: "Select cycle level",
							})}
							error={form.formState.errors.cycleLevelId?.message}
							searchMode="hybrid"
							getItemSubtitle={(level) =>
								`${level.cycle.name}${level.cycle.code ? ` (${level.cycle.code})` : ""}`
							}
							disabled={!selectedProgram || cycleLevels.length === 0}
							emptyMessage={
								!selectedProgram
									? t("admin.classes.form.selectProgramFirst", {
											defaultValue:
												"Select a program to load its cycle levels.",
										})
									: t("admin.classes.form.emptyCycleLevels", {
											defaultValue:
												"No cycle levels available for the selected program's institution.",
										})
							}
							required
						/>
						<CodedEntitySelect
							items={programOptions}
							onSearch={setProgramOptionSearch}
							value={
								programOptions.find(
									(o) => o.id === form.watch("programOptionId"),
								)?.code || null
							}
							onChange={(code) => {
								const option = programOptions.find((o) => o.code === code);
								form.setValue("programOptionId", option?.id || "");
							}}
							label={t("admin.classes.form.programOptionLabel", {
								defaultValue: "Program option",
							})}
							placeholder={t("admin.classes.form.programOptionPlaceholder", {
								defaultValue: "Select option",
							})}
							error={form.formState.errors.programOptionId?.message}
							searchMode="hybrid"
							disabled={!selectedProgram || programOptions.length === 0}
							emptyMessage={
								!selectedProgram
									? t("admin.classes.form.selectProgramFirst", {
											defaultValue: "Select a program to load its options.",
										})
									: "No options available"
							}
							required
						/>

						<div className="grid gap-4 sm:grid-cols-3">
							<FormField
								control={form.control}
								name="code"
								render={({ field }) => (
									<FormItem>
										<FormLabel required>
											{t("admin.classes.form.codeLabel", {
												defaultValue: "Code",
											})}
										</FormLabel>
										<FormControl>
											<Input
												{...field}
												placeholder={t("admin.classes.form.codePlaceholder", {
													defaultValue: "INF11-01",
												})}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("admin.classes.form.labelLabel")}</FormLabel>
										<FormControl>
											<Input {...field} readOnly />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="totalCredits"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.classes.form.totalCreditsLabel", {
												defaultValue: "Total credits",
											})}
										</FormLabel>
										<FormControl>
											<Input
												{...field}
												type="number"
												min={0}
												placeholder={t(
													"admin.classes.form.totalCreditsPlaceholder",
													{ defaultValue: "e.g. 30" },
												)}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<DialogFooter className="gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									setIsFormOpen(false);
									setEditingClass(null);
									form.reset();
								}}
							>
								{t("common.actions.cancel")}
							</Button>
							<Button type="submit" disabled={form.formState.isSubmitting}>
								{form.formState.isSubmitting ? (
									<Spinner className="mr-2 h-4 w-4" />
								) : editingClass ? (
									t("common.actions.saveChanges")
								) : (
									t("admin.classes.form.createSubmit")
								)}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</FormModal>

			<ConfirmModal
				isOpen={isDeleteOpen}
				onClose={() => {
					setIsDeleteOpen(false);
					setDeleteId(null);
				}}
				onConfirm={handleDelete}
				title={t("admin.classes.delete.title")}
				message={t("admin.classes.delete.message")}
				confirmText={t("common.actions.delete")}
				isLoading={deleteMutation.isPending}
			/>
			<Dialog
				open={!!previewClass}
				onOpenChange={(open) => {
					if (!open) {
						setPreviewClass(null);
						setPreviewStudents([]);
						setStudentSearch("");
					}
				}}
			>
				<DialogContent className="flex h-[80vh] w-full flex-col sm:max-w-4xl">
					<DialogHeader>
						<DialogTitle>
							{previewClass?.name ?? ""}{" "}
							{!previewLoading && (
								<Badge variant="secondary" className="ml-2">
									{previewStudents.length}{" "}
									{t("admin.classes.students", {
										defaultValue: "students",
									})}
								</Badge>
							)}
						</DialogTitle>
						<DialogDescription>
							{t("admin.classes.previewDescription", {
								defaultValue: "List of students enrolled in this class",
							})}
						</DialogDescription>
					</DialogHeader>

					<div className="relative shrink-0 px-6 pb-4">
						<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder={t("admin.classes.searchStudents", {
								defaultValue: "Search students...",
							})}
							value={studentSearch}
							onChange={(e) => setStudentSearch(e.target.value)}
							className="pl-9"
						/>
					</div>

					{previewLoading ? (
						<div className="flex items-center justify-center py-12">
							<Spinner />
						</div>
					) : previewStudents.length === 0 ? (
						<div className="py-12 text-center text-muted-foreground">
							<Users className="mx-auto mb-2 h-10 w-10" />
							<p>
								{t("admin.classes.noStudents", {
									defaultValue: "No students enrolled in this class",
								})}
							</p>
						</div>
					) : (
						<ScrollArea className="min-h-0 flex-1">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-12">#</TableHead>
										<TableHead>
											{t("admin.classes.columns.registration", {
												defaultValue: "Reg. Number",
											})}
										</TableHead>
										<TableHead>
											{t("admin.classes.columns.lastName", {
												defaultValue: "Last Name",
											})}
										</TableHead>
										<TableHead>
											{t("admin.classes.columns.firstName", {
												defaultValue: "First Name",
											})}
										</TableHead>
										<TableHead>
											{t("admin.classes.columns.birthDate", {
												defaultValue: "Birth Date",
											})}
										</TableHead>
										<TableHead>
											{t("admin.classes.columns.gender", {
												defaultValue: "Gender",
											})}
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{previewStudents
										.filter((s) => {
											if (!studentSearch) return true;
											const q = studentSearch.toLowerCase();
											return (
												(s.profile?.lastName ?? "").toLowerCase().includes(q) ||
												(s.profile?.firstName ?? "")
													.toLowerCase()
													.includes(q) ||
												(s.registrationNumber ?? "").toLowerCase().includes(q)
											);
										})
										.map((student, idx) => (
											<TableRow key={student.id}>
												<TableCell className="text-muted-foreground">
													{idx + 1}
												</TableCell>
												<TableCell className="font-mono text-sm">
													{student.registrationNumber ?? "—"}
												</TableCell>
												<TableCell className="font-medium">
													{student.profile?.lastName ?? "—"}
												</TableCell>
												<TableCell>
													{student.profile?.firstName ?? "—"}
												</TableCell>
												<TableCell>
													{student.profile?.dateOfBirth
														? new Date(
																student.profile.dateOfBirth,
															).toLocaleDateString()
														: "—"}
												</TableCell>
												<TableCell>
													{student.profile?.gender === "male"
														? "M"
														: student.profile?.gender === "female"
															? "F"
															: (student.profile?.gender ?? "—")}
												</TableCell>
											</TableRow>
										))}
								</TableBody>
							</Table>
						</ScrollArea>
					)}
				</DialogContent>
			</Dialog>

			{/* Bulk Generate Dialog */}
			<Dialog open={isBulkGenOpen} onOpenChange={(o) => { if (!o) { setIsBulkGenOpen(false); setBulkGenYearId(null); } }}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>
							{t("admin.classes.bulkGenerate.title", { defaultValue: "Générer toutes les classes" })}
						</DialogTitle>
						<DialogDescription>
							{t("admin.classes.bulkGenerate.description", { defaultValue: "Crée automatiquement une classe pour chaque combinaison programme × option × niveau pour l'année sélectionnée. Les combinaisons existantes sont ignorées." })}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-2">
						<div className="space-y-2">
							<Label>{t("admin.classes.bulkGenerate.yearLabel", { defaultValue: "Année académique" })}</Label>
							<AcademicYearSelect
								value={bulkGenYearId}
								onChange={setBulkGenYearId}
								autoSelectActive
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => { setIsBulkGenOpen(false); setBulkGenYearId(null); }}>
							{t("common.actions.cancel")}
						</Button>
						<Button
							onClick={() => bulkGenerateMutation.mutate()}
							disabled={!bulkGenYearId || bulkGenerateMutation.isPending}
						>
							{bulkGenerateMutation.isPending && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
							{t("admin.classes.bulkGenerate.submit", { defaultValue: "Générer" })}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
