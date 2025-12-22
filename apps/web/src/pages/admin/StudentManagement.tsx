import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import type { TFunction } from "i18next";
import { Download, PlusIcon, Sparkles } from "lucide-react";
import Papa from "papaparse";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ClipboardCopy } from "@/components/ui/clipboard-copy";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { RouterOutputs } from "../../utils/trpc";
import { trpc, trpcClient } from "../../utils/trpc";

type StudentsListResponse = RouterOutputs["students"]["list"];
type StudentRow = StudentsListResponse["items"][number];

interface Class {
	id: string;
	name: string;
}

const NO_REGISTRATION_FORMAT_VALUE = "__NONE__";

const buildStudentSchema = (t: TFunction) =>
	z.object({
		firstName: z.string().min(1, t("admin.students.validation.firstName")),
		lastName: z.string().min(1, t("admin.students.validation.lastName")),
		email: z.string().email(t("admin.students.validation.email")),
		registrationNumber: z
			.string()
			.optional()
			.refine(
				(value) => !value || value.trim().length > 0,
				t("admin.students.validation.registration"),
			),
		registrationFormatId: z.string().optional(),
		classId: z.string().min(1, t("admin.students.validation.class")),
		gender: z.enum(["male", "female", "other"]).optional(),
		dateOfBirth: z.string().optional(),
		placeOfBirth: z.string().optional(),
		nationality: z.string().optional(),
	});

const buildExternalAdmissionSchema = (t: TFunction) =>
	z.object({
		firstName: z.string().min(1, t("admin.students.validation.firstName")),
		lastName: z.string().min(1, t("admin.students.validation.lastName")),
		email: z.string().email(t("admin.students.validation.email")),
		registrationNumber: z.string().optional(),
		registrationFormatId: z.string().optional(),
		classId: z.string().min(1, t("admin.students.validation.class")),
		gender: z.enum(["male", "female", "other"]).optional(),
		dateOfBirth: z.string().optional(),
		placeOfBirth: z.string().optional(),
		nationality: z.string().optional(),
		admissionType: z.enum(["transfer", "direct", "equivalence"], {
			required_error: t("admin.students.external.validation.admissionType"),
		}),
		transferInstitution: z
			.string()
			.min(1, t("admin.students.external.validation.transferInstitution")),
		transferCredits: z
			.number({
				required_error: t("admin.students.external.validation.transferCredits"),
			})
			.int()
			.min(0)
			.max(300),
		transferLevel: z
			.string()
			.min(1, t("admin.students.external.validation.transferLevel")),
		admissionJustification: z
			.string()
			.min(10, t("admin.students.external.validation.admissionJustification")),
		admissionDate: z
			.string()
			.min(1, t("admin.students.external.validation.admissionDate")),
	});

type StudentForm = z.infer<ReturnType<typeof buildStudentSchema>>;
type ExternalAdmissionForm = z.infer<
	ReturnType<typeof buildExternalAdmissionSchema>
>;
const ADMISSION_TYPES = [
	"normal",
	"transfer",
	"direct",
	"equivalence",
] as const;
type AdmissionType = (typeof ADMISSION_TYPES)[number];
const ADMISSION_TYPE_HINT = ADMISSION_TYPES.join(", ");
const GENDER_VALUES = ["male", "female", "other"] as const;
const GENDER_HINT = GENDER_VALUES.join(", ");

type BulkStudent = {
	firstName: string;
	lastName: string;
	email: string;
	registrationNumber?: string;
	phone?: string;
	gender?: "male" | "female" | "other";
	dateOfBirth?: string;
	placeOfBirth?: string;
	nationality?: string;
	admissionType?: AdmissionType;
	transferInstitution?: string;
	transferCredits?: number;
	transferLevel?: string;
	admissionJustification?: string;
	admissionDate?: string;
};

type RawStudentRow = Record<string, string | number | undefined>;

const sanitizeString = (value: unknown) => {
	if (value === undefined || value === null) return undefined;
	const str = typeof value === "string" ? value : String(value);
	const trimmed = str.trim();
	return trimmed.length > 0 ? trimmed : undefined;
};

const buildImportRowSchema = (
	t: TFunction,
	parseDateValue: (value?: string | number) => string | undefined,
) => {
	const requiredString = (message: string) =>
		z.preprocess(
			(value) => sanitizeString(value) ?? "",
			z.string().min(1, { message }),
		);
	const optionalString = () =>
		z.preprocess((value) => sanitizeString(value), z.string().optional());
	const dateField = (fieldKey: "dateOfBirth" | "admissionDate") =>
		z
			.union([z.string(), z.number()])
			.optional()
			.transform((value, ctx) => {
				if (value === undefined || value === null || value === "")
					return undefined;
				const iso = parseDateValue(value);
				if (!iso) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: t("admin.students.import.errors.invalidDate", {
							field: t(`admin.students.import.fields.${fieldKey}`),
						}),
						path: [fieldKey],
					});
					return undefined;
				}
				return iso;
			});
	const genderField = optionalString().transform((value, ctx) => {
		if (!value) return undefined;
		const normalized = normalizeGender(value);
		if (!normalized) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: t("admin.students.import.errors.invalidGender", {
					value,
					values: GENDER_HINT,
				}),
				path: ["gender"],
			});
			return undefined;
		}
		return normalized;
	});
	const admissionTypeField = optionalString().transform((value, ctx) => {
		if (!value) return undefined;
		const normalized = normalizeAdmissionType(value);
		if (!normalized) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: t("admin.students.import.errors.invalidAdmissionType", {
					value,
					values: ADMISSION_TYPE_HINT,
				}),
				path: ["admissionType"],
			});
			return undefined;
		}
		return normalized;
	});
	const transferCreditsField = z
		.union([z.string(), z.number()])
		.optional()
		.transform((value, ctx) => {
			if (value === undefined || value === null || value === "")
				return undefined;
			const parsed =
				typeof value === "number" ? value : Number(String(value).trim());
			if (!Number.isFinite(parsed)) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: t("admin.students.import.errors.invalidTransferCredits"),
					path: ["transferCredits"],
				});
				return undefined;
			}
			const rounded = Math.max(0, Math.round(parsed));
			if (rounded > 300) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: t("admin.students.import.errors.invalidTransferCredits"),
					path: ["transferCredits"],
				});
				return undefined;
			}
			return rounded;
		});

	return z
		.object({
			firstName: requiredString(
				t("admin.students.validation.firstName", {
					defaultValue: "First name is required",
				}),
			),
			lastName: requiredString(
				t("admin.students.validation.lastName", {
					defaultValue: "Last name is required",
				}),
			),
			email: z.preprocess(
				(value) => sanitizeString(value) ?? "",
				z.string().email(t("admin.students.validation.email")),
			),
			registrationNumber: optionalString(),
			phone: optionalString(),
			gender: genderField,
			dateOfBirth: dateField("dateOfBirth"),
			placeOfBirth: optionalString(),
			nationality: optionalString(),
			admissionType: admissionTypeField,
			transferInstitution: optionalString(),
			transferCredits: transferCreditsField,
			transferLevel: optionalString(),
			admissionJustification: optionalString(),
			admissionDate: dateField("admissionDate"),
		})
		.superRefine((data, ctx) => {
			if (data.admissionType && data.admissionType !== "normal") {
				const missingFields: string[] = [];
				if (!data.transferInstitution) {
					missingFields.push(
						t("admin.students.import.fields.transferInstitution"),
					);
				}
				if (
					data.admissionType === "transfer" &&
					(!data.transferCredits || data.transferCredits <= 0)
				) {
					missingFields.push(t("admin.students.import.fields.transferCredits"));
				}
				if (!data.transferLevel) {
					missingFields.push(t("admin.students.import.fields.transferLevel"));
				}
				if (!data.admissionJustification) {
					missingFields.push(
						t("admin.students.import.fields.admissionJustification"),
					);
				}
				if (!data.admissionDate) {
					missingFields.push(t("admin.students.import.fields.admissionDate"));
				}
				if (missingFields.length > 0) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: t("admin.students.import.errors.missingTransferData", {
							fields: missingFields.join(", "),
						}),
					});
				}
			}
		});
};

const getStudentName = (student: StudentRow) =>
	[student.profile.firstName, student.profile.lastName]
		.filter(Boolean)
		.join(" ");

const normalizeGender = (value?: string | null) => {
	if (!value) return undefined;
	const normalized = value.trim().toLowerCase();
	if (["male", "m", "homme"].includes(normalized)) return "male";
	if (["female", "f", "femme"].includes(normalized)) return "female";
	if (["other", "autre", "o"].includes(normalized)) return "other";
	return undefined;
};

const normalizeAdmissionType = (
	value?: string | null,
): AdmissionType | undefined => {
	if (!value) return undefined;
	const normalized = value.trim().toLowerCase();
	if (ADMISSION_TYPES.includes(normalized as AdmissionType)) {
		return normalized as AdmissionType;
	}
	if (normalized === "transfert") return "transfer";
	return undefined;
};

const formatStudentGender = (
	t: TFunction,
	gender?: StudentRow["profile"]["gender"],
) => {
	if (!gender) return t("admin.students.table.genderUnknown");
	return t(`admin.students.gender.${gender}`, { defaultValue: gender });
};

const formatDate = (value?: Date | string | null) => {
	if (!value) return "—";
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) return "—";
	return format(date, "PPP");
};

const toISODateFromInput = (value?: string) => {
	if (!value) return undefined;
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return undefined;
	return date.toISOString();
};

const toISODateFromSheet = (value?: string | number) => {
	if (value === undefined || value === null || value === "") return undefined;
	if (typeof value === "number") {
		const parsed = XLSX.SSF?.parse_date_code?.(value);
		if (!parsed) return undefined;
		const jsDate = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
		return jsDate.toISOString();
	}
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return undefined;
	return date.toISOString();
};

export default function StudentManagement() {
	const queryClient = useQueryClient();
	const { t } = useTranslation();

	const [classFilter, setClassFilter] = useState<string>("all");
	const [search, setSearch] = useState("");
	const [cursor, setCursor] = useState<string | undefined>();
	const [prevCursors, setPrevCursors] = useState<string[]>([]);

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<"single" | "import" | "external">(
		"single",
	);
	const [importClass, setImportClass] = useState("");
	const [importFormatId, setImportFormatId] = useState("");
	const [importResult, setImportResult] = useState<{
		createdCount: number;
		conflicts: Array<{ row: number; reason: string }>;
		errors: Array<{ row: number; reason: string }>;
	} | null>(null);
	const [importFile, setImportFile] = useState<File | null>(null);
	const [importPreview, setImportPreview] = useState<{
		rows: BulkStudent[];
		errors: Array<{ row: number; reason: string }>;
	} | null>(null);
	const [importFileKey, setImportFileKey] = useState(0);
	const [ledgerStudent, setLedgerStudent] = useState<StudentRow | null>(null);

	const { data: classes } = useQuery({
		queryKey: ["classes"],
		queryFn: async () => {
			const result = await trpcClient.classes.list.query({});
			return (result?.items || []) as Class[];
		},
	});

	const { data: registrationFormats } = useQuery(
		trpc.registrationNumbers.list.queryOptions({ includeInactive: true }),
	);

	const { data: studentsData } = useQuery<StudentsListResponse>({
		queryKey: ["students", classFilter, search, cursor],
		queryFn: async () =>
			trpcClient.students.list.query({
				classId: classFilter === "all" ? undefined : classFilter,
				q: search || undefined,
				cursor,
				limit: 20,
			}),
	});

	const ledgerSummaryQuery = useQuery({
		...trpc.studentCreditLedger.summary.queryOptions({
			studentId: ledgerStudent?.id || "",
		}),
		enabled: Boolean(ledgerStudent),
	});

	const promotionQuery = useQuery({
		...trpc.promotions.evaluateStudent.queryOptions({
			studentId: ledgerStudent?.id || "",
		}),
		enabled: Boolean(ledgerStudent),
	});

	const studentSchema = useMemo(() => buildStudentSchema(t), [t]);
	const externalAdmissionSchema = useMemo(
		() => buildExternalAdmissionSchema(t),
		[t],
	);

	const form = useForm<StudentForm>({
		resolver: zodResolver(studentSchema),
		defaultValues: {
			firstName: "",
			lastName: "",
			email: "",
			registrationNumber: "",
			registrationFormatId: undefined,
			classId: "",
			dateOfBirth: "",
			placeOfBirth: "",
			gender: undefined,
			nationality: "",
		},
	});

	const externalForm = useForm<ExternalAdmissionForm>({
		resolver: zodResolver(externalAdmissionSchema),
		defaultValues: {
			firstName: "",
			lastName: "",
			email: "",
			registrationNumber: "",
			registrationFormatId: undefined,
			classId: "",
			dateOfBirth: "",
			placeOfBirth: "",
			gender: undefined,
			nationality: "",
			admissionType: "transfer",
			transferInstitution: "",
			transferCredits: 0,
			transferLevel: "",
			admissionJustification: "",
			admissionDate: "",
		},
	});

	const createMutation = useMutation({
		mutationFn: (data: StudentForm) => trpcClient.students.create.mutate(data),
		onSuccess: () => {
			toast.success(t("admin.students.toast.createSuccess"));
			queryClient.invalidateQueries({ queryKey: ["students"] });
			closeModal();
		},
		onError: (err: unknown) =>
			toast.error(
				err instanceof Error
					? err.message
					: t("admin.students.toast.createError"),
			),
	});

	const bulkMutation = useMutation({
		mutationFn: (payload: {
			classId: string;
			registrationFormatId?: string;
			students: BulkStudent[];
		}) => trpcClient.students.bulkCreate.mutate(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["students"] });
		},
		onError: (err: unknown) =>
			toast.error(
				err instanceof Error
					? err.message
					: t("admin.students.toast.importError"),
			),
	});

	const externalAdmissionMutation = useMutation({
		mutationFn: (data: ExternalAdmissionForm) => {
			return trpcClient.students.admitExternal.mutate({
				...data,
				admissionDate: new Date(data.admissionDate),
			});
		},
		onSuccess: () => {
			toast.success(t("admin.students.external.toast.success"));
			queryClient.invalidateQueries({ queryKey: ["students"] });
			closeModal();
		},
		onError: (err: unknown) =>
			toast.error(
				err instanceof Error
					? err.message
					: t("admin.students.external.toast.error"),
			),
	});

	const onSubmit = (data: StudentForm) =>
		createMutation.mutate({
			...data,
			gender: data.gender || undefined,
			registrationNumber: data.registrationNumber?.trim()
				? data.registrationNumber.trim()
				: undefined,
			registrationFormatId: data.registrationFormatId
				? data.registrationFormatId
				: undefined,
			dateOfBirth: data.dateOfBirth
				? toISODateFromInput(data.dateOfBirth)
				: undefined,
			placeOfBirth: data.placeOfBirth?.trim() || undefined,
			nationality: data.nationality?.trim() || undefined,
		});

	const onExternalSubmit = (data: ExternalAdmissionForm) =>
		externalAdmissionMutation.mutate({
			...data,
			gender: data.gender || undefined,
			registrationNumber: data.registrationNumber?.trim()
				? data.registrationNumber.trim()
				: undefined,
			registrationFormatId: data.registrationFormatId
				? data.registrationFormatId
				: undefined,
			dateOfBirth: data.dateOfBirth
				? toISODateFromInput(data.dateOfBirth)
				: undefined,
			placeOfBirth: data.placeOfBirth?.trim() || undefined,
			nationality: data.nationality?.trim() || undefined,
			transferInstitution: data.transferInstitution.trim(),
			transferLevel: data.transferLevel.trim(),
			admissionJustification: data.admissionJustification.trim(),
			admissionDate: data.admissionDate,
		});

	const handleNext = () => {
		if (studentsData?.nextCursor) {
			setPrevCursors((p) => [...p, cursor ?? ""]);
			setCursor(studentsData.nextCursor);
		}
	};
	const handlePrev = () => {
		const prev = prevCursors[prevCursors.length - 1];
		setPrevCursors((p) => p.slice(0, -1));
		setCursor(prev || undefined);
	};

	const handleDownloadTemplate = () => {
		const headers = [
			"firstName",
			"lastName",
			"email",
			"phone",
			"dateOfBirth",
			"placeOfBirth",
			"gender",
			"nationality",
			"registrationNumber",
			"admissionType",
			"transferInstitution",
			"transferCredits",
			"transferLevel",
			"admissionDate",
			"admissionJustification",
		];
		const csvBlob = new Blob([`${headers.join(",")}\n`], {
			type: "text/csv;charset=utf-8",
		});
		const a = document.createElement("a");
		a.href = URL.createObjectURL(csvBlob);
		a.download = `${t("admin.students.templates.filePrefix")}.csv`;
		a.click();

		const wb = XLSX.utils.book_new();
		const ws = XLSX.utils.aoa_to_sheet([headers]);
		XLSX.utils.book_append_sheet(
			wb,
			ws,
			t("admin.students.templates.sheetName"),
		);
		XLSX.writeFile(wb, `${t("admin.students.templates.filePrefix")}.xlsx`);
	};

	const parseImportFile = async (file: File) => {
		const ext = file.name.split(".").pop()?.toLowerCase();
		const rows: BulkStudent[] = [];
		const errors: Array<{ row: number; reason: string }> = [];

		const pushIssues = (issues: z.ZodIssue[], rowNumber: number) => {
			issues.forEach((issue) => {
				errors.push({
					row: rowNumber,
					reason: issue.message ?? t("admin.students.import.invalidFormat"),
				});
			});
		};

		if (ext === "csv") {
			const text = await file.text();
			const parsed = Papa.parse<Record<string, string>>(text, {
				header: true,
				skipEmptyLines: true,
			});
			const parseCsvDate = (value?: string | number) => {
				if (typeof value === "number") {
					return toISODateFromSheet(value);
				}
				return toISODateFromInput(
					typeof value === "string" ? value : undefined,
				);
			};
			const schema = buildImportRowSchema(t, parseCsvDate);
			parsed.data.forEach((row, idx) => {
				const result = schema.safeParse(row as RawStudentRow);
				if (result.success) {
					rows.push(result.data);
				} else {
					pushIssues(result.error.issues, idx + 2);
				}
			});
		} else {
			const buf = await file.arrayBuffer();
			const wb = XLSX.read(buf);
			const sheet = wb.Sheets[wb.SheetNames[0]];
			const json =
				XLSX.utils.sheet_to_json<Record<string, string | number>>(sheet);
			const parseSheetDate = (value?: string | number) =>
				toISODateFromSheet(value);
			const schema = buildImportRowSchema(t, parseSheetDate);
			json.forEach((row, idx) => {
				const result = schema.safeParse(row as RawStudentRow);
				if (result.success) {
					rows.push(result.data);
				} else {
					pushIssues(result.error.issues, idx + 2);
				}
			});
		}

		return { rows, errors };
	};

	const handleImport = async () => {
		if (!importClass) {
			toast.error(
				t("admin.students.import.classLabel", {
					defaultValue: "Select class",
				}),
			);
			return;
		}
		if (!importFile) {
			toast.error(
				t("admin.students.import.fileLabel", {
					defaultValue: "Upload CSV or XLSX file",
				}),
			);
			return;
		}
		let preview = importPreview;
		if (!preview) {
			try {
				preview = await parseImportFile(importFile);
				setImportPreview(preview);
			} catch (error) {
				console.error(error);
				toast.error(t("admin.students.import.invalidFormat"));
				return;
			}
		}
		if (!preview.rows.length) {
			toast.error(t("admin.students.import.preview.noValidRows"));
			return;
		}

		const formatErrors = preview.errors;

		bulkMutation.mutate(
			{
				classId: importClass,
				registrationFormatId: importFormatId || undefined,
				students: preview.rows,
			},
			{
				onSuccess: (res) => {
					setImportResult({
						createdCount: res.createdCount,
						conflicts: res.conflicts.map((c) => ({
							row: c.row,
							reason: c.reason,
						})),
						errors: [...formatErrors, ...res.errors],
					});
					if (formatErrors.length === 0) {
						toast.success(t("admin.students.toast.createSuccess"));
					}
					setImportPreview(null);
					setImportFile(null);
					setImportFileKey((key) => key + 1);
				},
			},
		);
	};

	const closeModal = () => {
		setIsModalOpen(false);
		setActiveTab("single");
		setImportClass("");
		setImportFormatId("");
		setImportResult(null);
		setImportFile(null);
		setImportPreview(null);
		setImportFileKey((key) => key + 1);
		form.reset();
		externalForm.reset();
	};

	return (
		<div className="space-y-6 p-6">
			<div className="flex items-center justify-between gap-4">
				<h1 className="font-bold text-2xl">{t("admin.students.title")}</h1>
				<Button onClick={() => setIsModalOpen(true)}>
					<PlusIcon className="mr-2 h-5 w-5" />
					{t("admin.students.actions.openModal")}
				</Button>
			</div>

			<div className="flex flex-wrap items-center gap-3">
				<Select
					value={classFilter}
					onValueChange={(value) => {
						setClassFilter(value);
						setCursor(undefined);
						setPrevCursors([]);
					}}
				>
					<SelectTrigger className="min-w-[200px]">
						<SelectValue placeholder={t("admin.students.filters.allClasses")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">
							{t("admin.students.filters.allClasses")}
						</SelectItem>
						{classes?.map((c) => (
							<SelectItem key={c.id} value={c.id}>
								{c.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Input
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder={t("admin.students.filters.searchPlaceholder")}
					className="w-full max-w-md"
				/>
				<Button
					variant="outline"
					onClick={() => {
						setCursor(undefined);
						setPrevCursors([]);
						queryClient.invalidateQueries({ queryKey: ["students"] });
					}}
				>
					{t("common.actions.search")}
				</Button>
			</div>

			<Card>
				<CardContent className="pb-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{t("admin.students.table.registration")}</TableHead>
								<TableHead>{t("admin.students.table.name")}</TableHead>
								<TableHead>{t("admin.students.table.email")}</TableHead>
								<TableHead>{t("admin.students.table.gender")}</TableHead>
								<TableHead>{t("admin.students.table.dateOfBirth")}</TableHead>
								<TableHead>{t("admin.students.table.placeOfBirth")}</TableHead>
								<TableHead className="text-right">
									{t("admin.students.table.actions", {
										defaultValue: "Actions",
									})}
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{studentsData?.items.length ? (
								studentsData.items.map((student) => (
									<TableRow key={student.id}>
										<TableCell>
											<ClipboardCopy
												value={student.registrationNumber}
												label={t("admin.students.table.registration")}
											/>
										</TableCell>
										<TableCell>{getStudentName(student)}</TableCell>
										<TableCell>{student.profile.primaryEmail}</TableCell>
										<TableCell>
											{formatStudentGender(t, student.profile.gender)}
										</TableCell>
										<TableCell>
											{formatDate(student.profile.dateOfBirth)}
										</TableCell>
										<TableCell>{student.profile.placeOfBirth || "—"}</TableCell>
										<TableCell className="text-right">
											<Button
												type="button"
												variant="ghost"
												className="text-primary-700"
												onClick={() => setLedgerStudent(student)}
											>
												<Sparkles className="mr-2 h-4 w-4" />
												{t("admin.students.table.viewLedger", {
													defaultValue: "Credits",
												})}
											</Button>
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={7} className="py-6 text-center">
										{t("admin.students.empty", {
											defaultValue: "No students yet for this selection.",
										})}
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</CardContent>
				<CardFooter className="flex items-center justify-between gap-3">
					<Button
						variant="outline"
						disabled={prevCursors.length === 0}
						onClick={handlePrev}
					>
						{t("common.pagination.previous")}
					</Button>
					<Button
						variant="outline"
						disabled={!studentsData?.nextCursor}
						onClick={handleNext}
					>
						{t("common.pagination.next")}
					</Button>
				</CardFooter>
			</Card>

			<Drawer
				open={Boolean(ledgerStudent)}
				onOpenChange={(open) => !open && setLedgerStudent(null)}
			>
				<DrawerContent>
					<DrawerHeader>
						<DrawerTitle>
							{t("admin.students.ledger.title", {
								defaultValue: "Credit overview",
							})}
						</DrawerTitle>
						<DrawerDescription>
							{ledgerStudent
								? t("admin.students.ledger.subtitle", {
										defaultValue: "Tracking credits for {{student}}",
										student: getStudentName(ledgerStudent),
									})
								: ""}
						</DrawerDescription>
					</DrawerHeader>
					<div className="space-y-6 px-4 pb-6">
						{ledgerSummaryQuery.isLoading ? (
							<p className="text-gray-500 text-sm">
								{t("admin.students.ledger.loading", {
									defaultValue: "Fetching ledger…",
								})}
							</p>
						) : (
							<>
								{ledgerSummaryQuery.data && (
									<div className="rounded-xl border bg-gray-50 p-4">
										<p className="font-medium text-gray-700 text-sm">
											{t("admin.students.ledger.progressLabel", {
												defaultValue: "Progress toward promotion",
											})}
										</p>
										<div className="mt-3 flex items-end justify-between">
											<div>
												<p className="font-semibold text-3xl text-gray-900">
													{ledgerSummaryQuery.data.creditsEarned}{" "}
													{t("admin.students.ledger.credits", {
														defaultValue: "credits",
													})}
												</p>
												<p className="text-gray-600 text-sm">
													{t("admin.students.ledger.required", {
														defaultValue: "Required: {{required}}",
														required: ledgerSummaryQuery.data.requiredCredits,
													})}
												</p>
											</div>
											<div className="text-right text-sm">
												<p className="text-gray-600">
													{t("admin.students.ledger.inProgress", {
														defaultValue: "In progress: {{value}}",
														value: ledgerSummaryQuery.data.creditsInProgress,
													})}
												</p>
											</div>
										</div>
										<Progress
											value={Math.min(
												100,
												(ledgerSummaryQuery.data.creditsEarned /
													ledgerSummaryQuery.data.requiredCredits) *
													100 || 0,
											)}
											className="mt-4"
										/>
									</div>
								)}
								{promotionQuery.data && (
									<div
										className={`rounded-xl border p-4 ${promotionQuery.data.eligible ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}
									>
										<p className="font-semibold text-gray-900">
											{promotionQuery.data.eligible
												? t("admin.students.ledger.ready", {
														defaultValue: "Student is eligible for promotion",
													})
												: t("admin.students.ledger.notReady", {
														defaultValue:
															"More credits required before promotion",
													})}
										</p>
										<p className="text-gray-700 text-sm">
											{t("admin.students.ledger.message", {
												defaultValue:
													"Rules evaluated via json-rules-engine. Overrides will appear here once published.",
											})}
										</p>
									</div>
								)}
								{ledgerSummaryQuery.data?.ledgers?.length ? (
									<div className="space-y-3">
										{ledgerSummaryQuery.data.ledgers.map((entry) => (
											<div
												key={entry.id}
												className="rounded-lg border bg-white p-3 shadow-sm"
											>
												<p className="font-medium text-gray-900">
													{entry.academicYearId}
												</p>
												<p className="text-gray-600 text-sm">
													{t("admin.students.ledger.entry", {
														defaultValue:
															"Earned {{earned}} • In progress {{progress}}",
														earned: entry.creditsEarned,
														progress: entry.creditsInProgress,
													})}
												</p>
											</div>
										))}
									</div>
								) : null}
							</>
						)}
					</div>
				</DrawerContent>
			</Drawer>

			<Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
				<DialogContent className=" overflow-y-auto max-h-[90vh] min-w-[60vw] ">
					<DialogHeader>
						<DialogTitle>{t("admin.students.modal.title")}</DialogTitle>
					</DialogHeader>

					<Tabs
						value={activeTab}
						onValueChange={(value) =>
							setActiveTab(value as "single" | "import" | "external")
						}
						className="space-y-4"
					>
						<TabsList>
							<TabsTrigger value="single">
								{t("admin.students.modal.tabs.single")}
							</TabsTrigger>
							<TabsTrigger value="import">
								{t("admin.students.modal.tabs.import")}
							</TabsTrigger>
							<TabsTrigger value="external">
								{t("admin.students.modal.tabs.external")}
							</TabsTrigger>
						</TabsList>

						<TabsContent value="single" className="space-y-4">
							<Form {...form}>
								<form
									onSubmit={form.handleSubmit(onSubmit)}
									className="space-y-6"
								>
									{/* Section: Informations personnelles */}
									<div className="grid grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="firstName"
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														{t("admin.students.form.firstName")}
													</FormLabel>
													<FormControl>
														<Input {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="lastName"
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														{t("admin.students.form.lastName")}
													</FormLabel>
													<FormControl>
														<Input {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									{/* Section: Contact */}
									<FormField
										control={form.control}
										name="email"
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t("admin.students.form.email")}</FormLabel>
												<FormControl>
													<Input {...field} type="email" />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									{/* Section: Naissance */}
									<div className="grid grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="dateOfBirth"
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														{t("admin.students.form.dateOfBirth")}
													</FormLabel>
													<FormControl>
														<Input
															{...field}
															type="date"
															data-testid="date-of-birth-input"
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="placeOfBirth"
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														{t("admin.students.form.placeOfBirth")}
													</FormLabel>
													<FormControl>
														<Input {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									{/* Section: Identité */}
									<div className="grid grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="gender"
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														{t("admin.students.form.gender")}
													</FormLabel>
													<Select
														onValueChange={field.onChange}
														value={field.value || ""}
													>
														<FormControl>
															<SelectTrigger data-testid="gender-select">
																<SelectValue
																	placeholder={t(
																		"admin.students.form.genderPlaceholder",
																	)}
																/>
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectItem value="male">
																{t("admin.students.gender.male")}
															</SelectItem>
															<SelectItem value="female">
																{t("admin.students.gender.female")}
															</SelectItem>
															<SelectItem value="other">
																{t("admin.students.gender.other")}
															</SelectItem>
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="nationality"
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														{t("admin.students.form.nationality")}
													</FormLabel>
													<FormControl>
														<Input {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									{/* Section: Inscription */}
									<div className="space-y-4 rounded-lg border bg-gray-50 p-4">
										<p className="font-medium text-gray-900 text-sm">
											{t("admin.students.form.registrationSection", {
												defaultValue: "Inscription",
											})}
										</p>
										<FormField
											control={form.control}
											name="classId"
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														{t("admin.students.form.class")}
													</FormLabel>
													<Select
														onValueChange={field.onChange}
														value={field.value}
														disabled={!classes?.length}
													>
														<FormControl>
															<SelectTrigger data-testid="class-select">
																<SelectValue
																	placeholder={t(
																		"admin.students.form.classPlaceholder",
																	)}
																/>
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{classes?.map((c) => (
																<SelectItem key={c.id} value={c.id}>
																	{c.name}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>

										<div className="grid grid-cols-2 gap-4">
											<FormField
												control={form.control}
												name="registrationNumber"
												render={({ field }) => (
													<FormItem>
														<FormLabel>
															{t("admin.students.form.registration")}
														</FormLabel>
														<FormControl>
															<Input {...field} />
														</FormControl>
														<FormDescription>
															{t("admin.students.form.registrationHint", {
																defaultValue:
																	"Leave blank to auto-generate the next matricule.",
															})}
														</FormDescription>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name="registrationFormatId"
												render={({ field }) => (
													<FormItem>
														<FormLabel>
															{t("admin.students.form.registrationFormat", {
																defaultValue: "Registration format",
															})}
														</FormLabel>
														<Select
															onValueChange={(value) =>
																field.onChange(
																	value === NO_REGISTRATION_FORMAT_VALUE
																		? undefined
																		: value,
																)
															}
															value={
																field.value ?? NO_REGISTRATION_FORMAT_VALUE
															}
														>
															<FormControl>
																<SelectTrigger>
																	<SelectValue
																		placeholder={t(
																			"admin.students.form.registrationFormatPlaceholder",
																			{
																				defaultValue: "Use active format",
																			},
																		)}
																	/>
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																<SelectItem
																	value={NO_REGISTRATION_FORMAT_VALUE}
																>
																	{t(
																		"admin.students.form.registrationFormatPlaceholder",
																		{
																			defaultValue: "Use active format",
																		},
																	)}
																</SelectItem>
																{registrationFormats?.map((format) => (
																	<SelectItem key={format.id} value={format.id}>
																		{format.name}
																		{format.isActive
																			? ` (${t(
																					"admin.registrationNumbers.list.active",
																					{ defaultValue: "Active" },
																				)})`
																			: ""}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
														<FormDescription>
															{t("admin.students.form.registrationFormatHint", {
																defaultValue:
																	"Select a specific format to override the active template.",
															})}
														</FormDescription>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
									</div>
									<div className="flex justify-end gap-3 pt-2">
										<Button
											type="button"
											variant="outline"
											onClick={closeModal}
										>
											{t("common.actions.cancel")}
										</Button>
										<Button
											type="submit"
											disabled={form.formState.isSubmitting}
										>
											{form.formState.isSubmitting
												? t("common.loading")
												: t("admin.students.form.submit")}
										</Button>
									</div>
								</form>
							</Form>
						</TabsContent>

						<TabsContent value="import" className="space-y-4">
							{!importResult && (
								<>
									<div className="space-y-2">
										<Label htmlFor="import-class-select">
											{t("admin.students.import.classLabel")}
										</Label>
										<Select value={importClass} onValueChange={setImportClass}>
											<SelectTrigger id="import-class-select">
												<SelectValue
													placeholder={t(
														"admin.students.form.classPlaceholder",
													)}
												/>
											</SelectTrigger>
											<SelectContent>
												{classes?.map((c) => (
													<SelectItem key={c.id} value={c.id}>
														{c.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<Label htmlFor="import-format-select">
											{t("admin.students.import.formatLabel", {
												defaultValue: "Registration format (optional)",
											})}
										</Label>
										<Select
											value={importFormatId || NO_REGISTRATION_FORMAT_VALUE}
											onValueChange={(value) =>
												setImportFormatId(
													value === NO_REGISTRATION_FORMAT_VALUE ? "" : value,
												)
											}
										>
											<SelectTrigger id="import-format-select">
												<SelectValue
													placeholder={t(
														"admin.students.form.registrationFormatPlaceholder",
														{
															defaultValue: "Use active format",
														},
													)}
												/>
											</SelectTrigger>
											<SelectContent>
												<SelectItem value={NO_REGISTRATION_FORMAT_VALUE}>
													{t(
														"admin.students.form.registrationFormatPlaceholder",
														{
															defaultValue: "Use active format",
														},
													)}
												</SelectItem>
												{registrationFormats?.map((format) => (
													<SelectItem key={format.id} value={format.id}>
														{format.name}
														{format.isActive
															? ` (${t(
																	"admin.registrationNumbers.list.active",
																	{ defaultValue: "Active" },
																)})`
															: ""}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<Label htmlFor="student-import-file">
											{t("admin.students.import.fileLabel", {
												defaultValue: "Upload CSV or XLSX",
											})}
										</Label>
										<Input
											key={importFileKey}
											id="student-import-file"
											type="file"
											accept=".csv,.xlsx"
											onChange={(e) => {
												const f = e.target.files?.[0] ?? null;
												setImportFile(f);
												setImportResult(null);
												setImportPreview(null);
												if (f) {
													void (async () => {
														try {
															const preview = await parseImportFile(f);
															setImportPreview(preview);
															if (
																!preview.rows.length &&
																preview.errors.length > 0
															) {
																toast.error(
																	t(
																		"admin.students.import.preview.noValidRows",
																	),
																);
															}
														} catch (error) {
															console.error(error);
															toast.error(
																t("admin.students.import.invalidFormat"),
															);
														}
													})();
												}
											}}
											disabled={!importClass || bulkMutation.isPending}
										/>
										<p className="text-xs text-muted-foreground">
											{t("admin.students.import.instructions.gender", {
												values: GENDER_HINT,
											})}
										</p>
										<p className="text-xs text-muted-foreground">
											{t("admin.students.import.instructions.admissionType", {
												values: ADMISSION_TYPE_HINT,
											})}
										</p>
										<p className="text-xs text-muted-foreground">
											{t("admin.students.import.instructions.date")}
										</p>
									</div>
									{importPreview && (
										<div className="space-y-2 rounded-md border p-3 text-sm">
											<p>
												{t("admin.students.import.preview.ready", {
													count: importPreview.rows.length,
												})}
											</p>
											{importPreview.errors.length > 0 && (
												<div className="space-y-1">
													<p className="font-semibold">
														{t("admin.students.import.preview.errorsTitle")}
													</p>
													<ul className="ml-4 list-disc space-y-0.5">
														{importPreview.errors.map((error) => (
															<li key={`${error.row}-${error.reason}`}>
																{t(
																	"admin.students.import.summary.errors.item",
																	{
																		row: error.row,
																		reason: error.reason,
																	},
																)}
															</li>
														))}
													</ul>
												</div>
											)}
										</div>
									)}
									<div className="flex flex-wrap gap-2">
										<Button
											type="button"
											variant="outline"
											onClick={handleDownloadTemplate}
										>
											<Download className="mr-2 h-4 w-4" />
											{t("admin.students.import.downloadTemplate")}
										</Button>
										<Button
											type="button"
											onClick={() => {
												if (importFile) {
													void handleImport();
												} else {
													toast.error(
														t("admin.students.import.fileLabel", {
															defaultValue: "Upload CSV or XLSX file",
														}),
													);
												}
											}}
											disabled={
												!importClass || !importFile || bulkMutation.isPending
											}
										>
											{bulkMutation.isPending ? (
												<>
													<Spinner className="mr-2 h-4 w-4" />
													{t("common.actions.saving", {
														defaultValue: "Saving...",
													})}
												</>
											) : (
												t("admin.students.import.actions.import", {
													defaultValue: "Import students",
												})
											)}
										</Button>
									</div>
								</>
							)}
							{importResult && (
								<div className="space-y-3 text-sm">
									<p>
										{t("admin.students.import.summary.created", {
											count: importResult.createdCount,
										})}
									</p>
									{importResult.conflicts.length > 0 && (
										<div className="space-y-1">
											<p className="font-semibold">
												{t("admin.students.import.summary.conflicts.title")}
											</p>
											<ul className="ml-4 list-disc">
												{importResult.conflicts.map((c) => (
													<li key={`${c.row}-${c.reason}`}>
														{t("admin.students.import.summary.conflicts.item", {
															row: c.row,
															reason: c.reason,
														})}
													</li>
												))}
											</ul>
										</div>
									)}
									{importResult.errors.length > 0 && (
										<div className="space-y-1">
											<p className="font-semibold">
												{t("admin.students.import.summary.errors.title")}
											</p>
											<ul className="ml-4 list-disc">
												{importResult.errors.map((c) => (
													<li key={`${c.row}-${c.reason}`}>
														{t("admin.students.import.summary.errors.item", {
															row: c.row,
															reason: c.reason,
														})}
													</li>
												))}
											</ul>
										</div>
									)}
									<div className="flex justify-end">
										<Button variant="outline" onClick={closeModal}>
											{t("common.actions.close")}
										</Button>
									</div>
								</div>
							)}
						</TabsContent>

						<TabsContent value="external" className="space-y-4">
							<Form {...externalForm}>
								<form
									onSubmit={externalForm.handleSubmit(onExternalSubmit)}
									className="space-y-6"
								>
									<div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
										<p className="font-medium text-blue-900 text-sm">
											{t("admin.students.external.info.title")}
										</p>
										<p className="text-blue-700 text-sm">
											{t("admin.students.external.info.description")}
										</p>
									</div>

									<FormField
										control={externalForm.control}
										name="admissionType"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.students.external.form.admissionType")}
												</FormLabel>
												<Select
													onValueChange={field.onChange}
													value={field.value}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue
																placeholder={t(
																	"admin.students.external.form.admissionTypePlaceholder",
																)}
															/>
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value="transfer">
															{t(
																"admin.students.external.admissionTypes.transfer",
															)}
														</SelectItem>
														<SelectItem value="direct">
															{t(
																"admin.students.external.admissionTypes.direct",
															)}
														</SelectItem>
														<SelectItem value="equivalence">
															{t(
																"admin.students.external.admissionTypes.equivalence",
															)}
														</SelectItem>
													</SelectContent>
												</Select>
												<FormDescription>
													{t("admin.students.external.form.admissionTypeHint")}
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={externalForm.control}
										name="transferInstitution"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t(
														"admin.students.external.form.transferInstitution",
													)}
												</FormLabel>
												<FormControl>
													<Input {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<div className="grid grid-cols-2 gap-4">
										<FormField
											control={externalForm.control}
											name="transferCredits"
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														{t("admin.students.external.form.transferCredits")}
													</FormLabel>
													<FormControl>
														<Input
															{...field}
															type="number"
															min={0}
															max={300}
															onChange={(e) =>
																field.onChange(
																	Number.parseInt(e.target.value, 10),
																)
															}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={externalForm.control}
											name="transferLevel"
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														{t("admin.students.external.form.transferLevel")}
													</FormLabel>
													<FormControl>
														<Input {...field} placeholder="L1, L2, M1, etc." />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									<FormField
										control={externalForm.control}
										name="admissionDate"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.students.external.form.admissionDate")}
												</FormLabel>
												<FormControl>
													<Input {...field} type="date" />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={externalForm.control}
										name="admissionJustification"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t(
														"admin.students.external.form.admissionJustification",
													)}
												</FormLabel>
												<FormControl>
													<Textarea
														{...field}
														rows={3}
														placeholder={t(
															"admin.students.external.form.admissionJustificationPlaceholder",
														)}
													/>
												</FormControl>
												<FormDescription>
													{t(
														"admin.students.external.form.admissionJustificationHint",
													)}
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<div className="rounded-lg border bg-gray-50 p-4">
										<p className="mb-3 font-medium text-gray-900 text-sm">
											{t("admin.students.external.form.studentInfoSection")}
										</p>
										<div className="grid gap-4">
											<div className="grid grid-cols-2 gap-4">
												<FormField
													control={externalForm.control}
													name="firstName"
													render={({ field }) => (
														<FormItem>
															<FormLabel>
																{t("admin.students.form.firstName")}
															</FormLabel>
															<FormControl>
																<Input {...field} />
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
												<FormField
													control={externalForm.control}
													name="lastName"
													render={({ field }) => (
														<FormItem>
															<FormLabel>
																{t("admin.students.form.lastName")}
															</FormLabel>
															<FormControl>
																<Input {...field} />
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>

											<FormField
												control={externalForm.control}
												name="email"
												render={({ field }) => (
													<FormItem>
														<FormLabel>
															{t("admin.students.form.email")}
														</FormLabel>
														<FormControl>
															<Input {...field} type="email" />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<div className="grid grid-cols-2 gap-4">
												<FormField
													control={externalForm.control}
													name="dateOfBirth"
													render={({ field }) => (
														<FormItem>
															<FormLabel>
																{t("admin.students.form.dateOfBirth")}
															</FormLabel>
															<FormControl>
																<Input {...field} type="date" />
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
												<FormField
													control={externalForm.control}
													name="gender"
													render={({ field }) => (
														<FormItem>
															<FormLabel>
																{t("admin.students.form.gender")}
															</FormLabel>
															<Select
																onValueChange={field.onChange}
																value={field.value || ""}
															>
																<FormControl>
																	<SelectTrigger>
																		<SelectValue
																			placeholder={t(
																				"admin.students.form.genderPlaceholder",
																			)}
																		/>
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	<SelectItem value="male">
																		{t("admin.students.gender.male")}
																	</SelectItem>
																	<SelectItem value="female">
																		{t("admin.students.gender.female")}
																	</SelectItem>
																	<SelectItem value="other">
																		{t("admin.students.gender.other")}
																	</SelectItem>
																</SelectContent>
															</Select>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>

											<div className="grid grid-cols-2 gap-4">
												<FormField
													control={externalForm.control}
													name="placeOfBirth"
													render={({ field }) => (
														<FormItem>
															<FormLabel>
																{t("admin.students.form.placeOfBirth")}
															</FormLabel>
															<FormControl>
																<Input {...field} />
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
												<FormField
													control={externalForm.control}
													name="nationality"
													render={({ field }) => (
														<FormItem>
															<FormLabel>
																{t("admin.students.form.nationality")}
															</FormLabel>
															<FormControl>
																<Input {...field} />
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>

											<FormField
												control={externalForm.control}
												name="classId"
												render={({ field }) => (
													<FormItem>
														<FormLabel>
															{t("admin.students.form.class")}
														</FormLabel>
														<Select
															onValueChange={field.onChange}
															value={field.value}
															disabled={!classes?.length}
														>
															<FormControl>
																<SelectTrigger>
																	<SelectValue
																		placeholder={t(
																			"admin.students.form.classPlaceholder",
																		)}
																	/>
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																{classes?.map((c) => (
																	<SelectItem key={c.id} value={c.id}>
																		{c.name}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={externalForm.control}
												name="registrationNumber"
												render={({ field }) => (
													<FormItem>
														<FormLabel>
															{t("admin.students.form.registration")}
														</FormLabel>
														<FormControl>
															<Input {...field} />
														</FormControl>
														<FormDescription>
															{t("admin.students.form.registrationHint")}
														</FormDescription>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={externalForm.control}
												name="registrationFormatId"
												render={({ field }) => (
													<FormItem>
														<FormLabel>
															{t("admin.students.form.registrationFormat")}
														</FormLabel>
														<Select
															onValueChange={(value) =>
																field.onChange(
																	value === NO_REGISTRATION_FORMAT_VALUE
																		? undefined
																		: value,
																)
															}
															value={
																field.value ?? NO_REGISTRATION_FORMAT_VALUE
															}
														>
															<FormControl>
																<SelectTrigger>
																	<SelectValue
																		placeholder={t(
																			"admin.students.form.registrationFormatPlaceholder",
																		)}
																	/>
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																<SelectItem
																	value={NO_REGISTRATION_FORMAT_VALUE}
																>
																	{t(
																		"admin.students.form.registrationFormatPlaceholder",
																	)}
																</SelectItem>
																{registrationFormats?.map((format) => (
																	<SelectItem key={format.id} value={format.id}>
																		{format.name}
																		{format.isActive
																			? ` (${t(
																					"admin.registrationNumbers.list.active",
																				)})`
																			: ""}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
														<FormDescription>
															{t("admin.students.form.registrationFormatHint")}
														</FormDescription>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
									</div>

									<div className="flex justify-end gap-3 pt-2">
										<Button
											type="button"
											variant="outline"
											onClick={closeModal}
										>
											{t("common.actions.cancel")}
										</Button>
										<Button
											type="submit"
											disabled={externalForm.formState.isSubmitting}
										>
											{externalForm.formState.isSubmitting
												? t("common.loading")
												: t("admin.students.external.form.submit")}
										</Button>
									</div>
								</form>
							</Form>
						</TabsContent>
					</Tabs>
				</DialogContent>
			</Dialog>
		</div>
	);
}
