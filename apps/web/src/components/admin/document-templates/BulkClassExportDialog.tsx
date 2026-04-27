import { useMutation } from "@tanstack/react-query";
import {
	AlertCircle,
	CheckCircle2,
	Download,
	FileSpreadsheet,
	FileText,
	Loader2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";

interface ClassRow {
	id: string;
	name: string;
	code: string;
	program?: { name?: string } | null;
	academicYear?: { name?: string } | null;
}

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Classes pre-filtered by the parent page (filters in effect). */
	classes: ClassRow[];
}

type Format = "pdf" | "xlsx";
type Mode = "separated" | "unified";
type Status =
	| { state: "pending" }
	| { state: "running" }
	| { state: "ok" }
	| { state: "error"; error: string };

export function BulkClassExportDialog({ open, onOpenChange, classes }: Props) {
	const [format, setFormat] = useState<Format>("xlsx");
	const [mode, setMode] = useState<Mode>("unified");
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [status, setStatus] = useState<Record<string, Status>>({});
	const [progress, setProgress] = useState({ done: 0, total: 0 });
	const [isRunning, setIsRunning] = useState(false);

	useEffect(() => {
		if (open) {
			setSelectedIds(new Set(classes.map((c) => c.id)));
			setStatus({});
			setProgress({ done: 0, total: 0 });
		}
	}, [open, classes]);

	// "Unique" only makes sense for Excel (multi-sheets workbook). PDF unique
	// would require pdf-lib for merging; we fall back to "separated".
	useEffect(() => {
		if (format === "pdf" && mode === "unified") setMode("separated");
	}, [format, mode]);

	const allSelected = classes.length > 0 && selectedIds.size === classes.length;
	const toggleAll = () =>
		setSelectedIds(allSelected ? new Set() : new Set(classes.map((c) => c.id)));
	const toggleOne = (id: string) =>
		setSelectedIds((prev) => {
			const next = new Set(prev);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		});

	const summary = useMemo(() => {
		const list = Object.values(status);
		return {
			ok: list.filter((s) => s.state === "ok").length,
			error: list.filter((s) => s.state === "error").length,
			running: list.filter((s) => s.state === "running").length,
		};
	}, [status]);

	const exportMutation = useMutation({
		mutationFn: async () => {
			const ids = [...selectedIds];
			if (ids.length === 0) throw new Error("Aucune classe sélectionnée");

			setIsRunning(true);
			setProgress({ done: 0, total: ids.length });
			const initial: Record<string, Status> = {};
			ids.forEach((id) => {
				initial[id] = { state: "pending" };
			});
			setStatus(initial);

			const institution = await trpcClient.institutions.get.query();

			// Fetch each class's students sequentially. We could parallelize
			// student fetches (cheap), but the bottleneck is Puppeteer for the
			// PDF path — so we keep it serial across the board for simplicity
			// and predictable status updates.
			type ClassExport = {
				cls: ClassRow;
				students: Array<{
					id: string;
					registrationNumber: string;
					profile: {
						firstName: string;
						lastName: string;
						gender?: string | null;
						dateOfBirth?: string | null;
					};
				}>;
				pdfBase64?: string;
				pdfFilename?: string;
			};
			const results: ClassExport[] = [];

			for (let i = 0; i < ids.length; i++) {
				const id = ids[i];
				const cls = classes.find((c) => c.id === id);
				if (!cls) continue;
				setStatus((s) => ({ ...s, [id]: { state: "running" } }));
				try {
					const studentsRes = await trpcClient.students.list.query({
						classId: id,
						limit: 1000,
					});
					const students = (studentsRes as { items: ClassExport["students"] })
						.items;

					if (format === "pdf") {
						const pdfRes =
							await trpcClient.academicDocuments.generateStudentList.mutate({
								classId: id,
								format: "pdf",
								demoMode: false,
							});
						const pdf = pdfRes as {
							data: string;
							filename: string;
							mimeType: string;
						};
						results.push({
							cls,
							students,
							pdfBase64: pdf.data,
							pdfFilename: pdf.filename,
						});
					} else {
						results.push({ cls, students });
					}

					setStatus((s) => ({ ...s, [id]: { state: "ok" } }));
				} catch (err) {
					const msg = err instanceof Error ? err.message : String(err);
					setStatus((s) => ({ ...s, [id]: { state: "error", error: msg } }));
				} finally {
					setProgress({ done: i + 1, total: ids.length });
				}
			}

			// Bundle the results.
			const date = new Date().toISOString().slice(0, 10);
			const institutionName =
				(institution as { nameFr?: string; nameEn?: string })?.nameFr ??
				"Institution";

			if (format === "xlsx" && mode === "unified") {
				// Single workbook, one sheet per class.
				const workbook = XLSX.utils.book_new();
				for (const r of results) {
					const ws = buildClassWorksheet(r.cls, r.students, institutionName);
					XLSX.utils.book_append_sheet(
						workbook,
						ws,
						sheetSafe(r.cls.code || r.cls.name),
					);
				}
				XLSX.writeFile(workbook, `listes_classes_${date}.xlsx`);
			} else {
				// ZIP — one file per class (PDF or XLSX).
				const JSZip = (await import("jszip")).default;
				const zip = new JSZip();
				for (const r of results) {
					if (format === "pdf" && r.pdfBase64 && r.pdfFilename) {
						zip.file(r.pdfFilename, r.pdfBase64, { base64: true });
					} else if (format === "xlsx") {
						const wb = XLSX.utils.book_new();
						XLSX.utils.book_append_sheet(
							wb,
							buildClassWorksheet(r.cls, r.students, institutionName),
							"Étudiants",
						);
						const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
						zip.file(`liste_${slugify(r.cls.code || r.cls.name)}.xlsx`, buf);
					}
				}
				const blob = await zip.generateAsync({ type: "blob" });
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = `listes_classes_${date}.zip`;
				a.click();
				URL.revokeObjectURL(url);
			}

			return {
				ok: results.length,
				total: ids.length,
			};
		},
		onSuccess: (r) => {
			toast.success(`${r.ok} / ${r.total} liste(s) exportée(s)`);
			setIsRunning(false);
		},
		onError: (err: any) => {
			toast.error(err?.message ?? "Échec de l'export");
			setIsRunning(false);
		},
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex h-[85vh] max-w-4xl flex-col">
				<DialogHeader>
					<DialogTitle>Exporter les listes en lot</DialogTitle>
					<DialogDescription>
						Génère les listes d'étudiants pour les classes sélectionnées — en un
						fichier unique (Excel multi-onglets) ou en un fichier séparé par
						classe (ZIP).
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 px-6 md:grid-cols-2">
					<div className="space-y-1">
						<Label>Format</Label>
						<Select
							value={format}
							onValueChange={(v) => setFormat(v as Format)}
							disabled={isRunning}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="xlsx">
									<span className="flex items-center gap-2">
										<FileSpreadsheet className="h-4 w-4" />
										Excel (.xlsx)
									</span>
								</SelectItem>
								<SelectItem value="pdf">
									<span className="flex items-center gap-2">
										<FileText className="h-4 w-4" />
										PDF (rendu via template)
									</span>
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-1">
						<Label>Mode</Label>
						<Select
							value={mode}
							onValueChange={(v) => setMode(v as Mode)}
							disabled={isRunning || format === "pdf"}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="unified" disabled={format === "pdf"}>
									Fichier unique
									{format === "pdf" && " (Excel uniquement)"}
								</SelectItem>
								<SelectItem value="separated">
									Fichiers séparés (ZIP)
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				<div className="flex flex-1 flex-col overflow-hidden px-6">
					<div className="mb-2 flex items-center justify-between">
						<Label className="text-sm">
							Classes ({selectedIds.size} / {classes.length})
						</Label>
					</div>
					<div className="flex-1 overflow-auto rounded border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-10">
										<Checkbox
											checked={allSelected}
											onCheckedChange={toggleAll}
											aria-label="Tout sélectionner"
											disabled={isRunning}
										/>
									</TableHead>
									<TableHead>Code</TableHead>
									<TableHead>Nom</TableHead>
									<TableHead>Programme</TableHead>
									<TableHead>Année</TableHead>
									<TableHead className="w-28">Statut</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{classes.map((c) => {
									const s = status[c.id];
									return (
										<TableRow key={c.id}>
											<TableCell>
												<Checkbox
													checked={selectedIds.has(c.id)}
													onCheckedChange={() => toggleOne(c.id)}
													disabled={isRunning}
												/>
											</TableCell>
											<TableCell className="font-mono text-xs">
												{c.code}
											</TableCell>
											<TableCell>{c.name}</TableCell>
											<TableCell className="text-muted-foreground text-xs">
												{c.program?.name ?? "—"}
											</TableCell>
											<TableCell className="text-muted-foreground text-xs">
												{c.academicYear?.name ?? "—"}
											</TableCell>
											<TableCell>
												{!s && (
													<span className="text-muted-foreground text-xs">
														—
													</span>
												)}
												{s?.state === "pending" && (
													<Badge variant="secondary">En attente</Badge>
												)}
												{s?.state === "running" && (
													<Badge variant="secondary">
														<Loader2 className="mr-1 h-3 w-3 animate-spin" />
														Génération
													</Badge>
												)}
												{s?.state === "ok" && (
													<Badge className="bg-emerald-600">
														<CheckCircle2 className="mr-1 h-3 w-3" />
														OK
													</Badge>
												)}
												{s?.state === "error" && (
													<Badge variant="destructive" title={s.error}>
														<AlertCircle className="mr-1 h-3 w-3" />
														Échec
													</Badge>
												)}
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</div>
				</div>

				{isRunning && (
					<div className="space-y-2 px-6">
						<div className="flex items-center justify-between text-sm">
							<span>
								Export en cours… {progress.done} / {progress.total}
							</span>
							<span className="text-muted-foreground">
								{summary.ok} OK · {summary.error} échec(s)
							</span>
						</div>
						<Progress
							value={
								progress.total > 0 ? (progress.done / progress.total) * 100 : 0
							}
						/>
					</div>
				)}

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isRunning}
					>
						Fermer
					</Button>
					<Button
						onClick={() => exportMutation.mutate()}
						disabled={isRunning || selectedIds.size === 0}
					>
						{isRunning ? (
							<Spinner className="mr-2" />
						) : (
							<Download className="mr-2 h-4 w-4" />
						)}
						Exporter ({selectedIds.size})
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// ── Helpers ────────────────────────────────────────────────────────

function buildClassWorksheet(
	cls: ClassRow,
	students: Array<{
		registrationNumber: string;
		profile: {
			firstName: string;
			lastName: string;
			gender?: string | null;
			dateOfBirth?: string | null;
		};
	}>,
	institutionName: string,
): XLSX.WorkSheet {
	const sortedStudents = [...students].sort(
		(a, b) =>
			(a.profile.lastName ?? "").localeCompare(b.profile.lastName ?? "") ||
			(a.profile.firstName ?? "").localeCompare(b.profile.firstName ?? ""),
	);
	const headerRows: (string | number)[][] = [
		[institutionName],
		[],
		[`Liste d'étudiants — ${cls.name}`],
		[],
		[`Code: ${cls.code}`],
		[`Programme: ${cls.program?.name ?? "—"}`],
		[`Année: ${cls.academicYear?.name ?? "—"}`],
		[`Effectif: ${sortedStudents.length}`],
		[],
		["#", "Matricule", "Nom", "Prénom(s)", "Date de naissance", "Genre"],
	];
	const rows = sortedStudents.map((s, i) => [
		i + 1,
		s.registrationNumber || "-",
		s.profile.lastName ?? "",
		s.profile.firstName ?? "",
		s.profile.dateOfBirth
			? new Date(s.profile.dateOfBirth).toLocaleDateString()
			: "-",
		mapGender(s.profile.gender),
	]);
	const ws = XLSX.utils.aoa_to_sheet([...headerRows, ...rows]);
	ws["!cols"] = [
		{ wch: 5 },
		{ wch: 18 },
		{ wch: 22 },
		{ wch: 22 },
		{ wch: 14 },
		{ wch: 8 },
	];
	return ws;
}

function mapGender(raw: string | null | undefined): string {
	if (!raw) return "-";
	const v = String(raw).trim().toLowerCase();
	if (v === "male" || v === "m" || v === "homme" || v === "h") return "M";
	if (v === "female" || v === "f" || v === "femme") return "F";
	if (v === "other" || v === "autre") return "Autre";
	return String(raw).toUpperCase();
}

function sheetSafe(name: string): string {
	// Excel sheet names: max 31 chars, no [ ] : * ? / \ chars.
	return name.replace(/[[\]:*?/\\]/g, "_").slice(0, 31);
}

function slugify(s: string): string {
	return s
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/[^a-zA-Z0-9_-]+/g, "_")
		.replace(/_+/g, "_")
		.replace(/^_|_$/g, "");
}
