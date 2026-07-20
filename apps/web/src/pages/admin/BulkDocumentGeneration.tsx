import { useMutation, useQuery } from "@tanstack/react-query";
import {
	AlertCircle,
	CheckCircle2,
	Download,
	Eye,
	FileArchive,
	FileText,
	Loader2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
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
import { Switch } from "@/components/ui/switch";
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

type DocumentKind = "diploma" | "transcript" | "attestation";

const KIND_LABELS: Record<DocumentKind, string> = {
	diploma: "Diplôme",
	transcript: "Relevé de notes",
	attestation: "Attestation",
};

type GenStatus =
	| { state: "pending" }
	| { state: "running" }
	| { state: "ok"; filename: string; pdfBase64: string; templateName?: string }
	| { state: "error"; error: string };

export default function BulkDocumentGeneration() {
	const [kind, setKind] = useState<DocumentKind>("transcript");
	const [academicYearId, setAcademicYearId] = useState<string>("");
	const [classId, setClassId] = useState<string>("");
	const [demoMode, setDemoMode] = useState(false);
	const [zipDownload, setZipDownload] = useState(true);
	// Period only matters for transcripts. Defaults to annual; semestriel
	// switches the title to "RELEVÉ DE NOTES SEMESTRIEL" and (future) filters
	// data to the chosen semester.
	const [period, setPeriod] = useState<"semester" | "annual">("annual");
	const [semesterId, setSemesterId] = useState<string>("");

	const { data: semesters } = useQuery({
		queryKey: ["bulk-semesters"],
		queryFn: async () => {
			const res = await trpcClient.semesters.list.query({ limit: 50 });
			return (res as { items: Array<{ id: string; name: string }> }).items;
		},
		enabled: kind === "transcript" && period === "semester",
	});
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [genStatus, setGenStatus] = useState<Record<string, GenStatus>>({});
	const [isGenerating, setIsGenerating] = useState(false);
	const [progress, setProgress] = useState({ done: 0, total: 0 });
	// HTML preview dialog state — picks one student and renders the document
	// with the resolved template (without saving anything). Lets the user
	// validate the rendering before launching a full batch.
	const [previewState, setPreviewState] = useState<{
		studentName: string;
		html: string;
		templateName?: string;
	} | null>(null);

	const { data: academicYears } = useQuery({
		queryKey: ["bulk-academic-years"],
		queryFn: async () => {
			const res = await trpcClient.academicYears.list.query({ limit: 100 });
			return (res as { items: Array<{ id: string; name: string }> }).items;
		},
	});

	const { data: classes, isLoading: classesLoading } = useQuery({
		queryKey: ["bulk-classes", academicYearId],
		queryFn: async () => {
			const res = await trpcClient.classes.list.query({
				...(academicYearId ? { academicYearId } : {}),
				limit: 100,
			});
			return (
				res as {
					items: Array<{
						id: string;
						name: string;
						code: string;
						program?: { name?: string };
					}>;
				}
			).items;
		},
	});

	const { data: students, isLoading: studentsLoading } = useQuery({
		queryKey: ["bulk-students", classId],
		queryFn: async () =>
			classId
				? await trpcClient.students.list.query({ classId, limit: 500 })
				: { items: [] },
		enabled: !!classId,
	});
	const studentItems =
		(
			students as
				| {
						items: Array<{
							id: string;
							registrationNumber: string;
							profile: { firstName: string; lastName: string };
						}>;
				  }
				| undefined
		)?.items ?? [];

	useEffect(() => {
		setSelectedIds(new Set(studentItems.map((s) => s.id)));
		setGenStatus({});
		setProgress({ done: 0, total: 0 });
	}, [studentItems.length]);

	const allSelected =
		studentItems.length > 0 && selectedIds.size === studentItems.length;
	const toggleAll = () =>
		setSelectedIds(
			allSelected ? new Set() : new Set(studentItems.map((s) => s.id)),
		);
	const toggleOne = (id: string) =>
		setSelectedIds((prev) => {
			const next = new Set(prev);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		});

	const generateOne = useMutation({
		mutationFn: async (studentId: string) => {
			const res = await trpcClient.academicDocuments.generate.mutate({
				kind,
				studentId,
				format: "pdf",
				demoMode,
				period,
				...(period === "semester" && semesterId ? { semesterId } : {}),
			});
			return res as {
				data: string;
				filename: string;
				mimeType: string;
				usedTemplate?: { name: string };
			};
		},
	});

	// HTML preview for one student. Uses the same resolution chain as the
	// real batch generation, so what you see is what you'll get — minus the
	// PDF rasterization step.
	const previewOne = useMutation({
		mutationFn: async (studentId: string) => {
			const res = await trpcClient.academicDocuments.generate.mutate({
				kind,
				studentId,
				format: "html",
				demoMode,
				period,
				...(period === "semester" && semesterId ? { semesterId } : {}),
			});
			return res as {
				data: string;
				filename: string;
				mimeType: string;
				usedTemplate?: { name: string };
			};
		},
		onSuccess: (res, studentId) => {
			const s = studentItems.find((x) => x.id === studentId);
			setPreviewState({
				studentName: s
					? `${s.profile.lastName ?? ""} ${s.profile.firstName ?? ""}`.trim()
					: studentId,
				html: res.data,
				templateName: res.usedTemplate?.name,
			});
		},
		onError: (err: any) => {
			toast.error(err?.message ?? "Échec de l'aperçu");
		},
	});

	const handleGenerate = async () => {
		const ids = [...selectedIds];
		if (ids.length === 0) {
			toast.error("Aucun étudiant sélectionné");
			return;
		}
		setIsGenerating(true);
		setProgress({ done: 0, total: ids.length });
		const initial: Record<string, GenStatus> = {};
		ids.forEach((id) => {
			initial[id] = { state: "pending" };
		});
		setGenStatus(initial);

		const results: Array<{
			studentId: string;
			ok: boolean;
			filename?: string;
			pdfBase64?: string;
			error?: string;
		}> = [];

		for (let i = 0; i < ids.length; i++) {
			const id = ids[i];
			setGenStatus((s) => ({ ...s, [id]: { state: "running" } }));
			try {
				const r = await generateOne.mutateAsync(id);
				results.push({
					studentId: id,
					ok: true,
					filename: r.filename,
					pdfBase64: r.data,
				});
				setGenStatus((s) => ({
					...s,
					[id]: {
						state: "ok",
						filename: r.filename,
						pdfBase64: r.data,
						templateName: r.usedTemplate?.name,
					},
				}));
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				results.push({ studentId: id, ok: false, error: msg });
				setGenStatus((s) => ({
					...s,
					[id]: { state: "error", error: msg },
				}));
			} finally {
				setProgress({ done: i + 1, total: ids.length });
			}
		}

		const okCount = results.filter((r) => r.ok).length;
		const failCount = results.length - okCount;

		try {
			if (zipDownload && okCount > 0) {
				const JSZip = (await import("jszip")).default;
				const zip = new JSZip();
				for (const r of results) {
					if (r.ok && r.pdfBase64 && r.filename) {
						zip.file(r.filename, r.pdfBase64, { base64: true });
					}
				}
				const blob = await zip.generateAsync({ type: "blob" });
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				const cls = classes?.find((c) => c.id === classId);
				const date = new Date().toISOString().slice(0, 10);
				a.download = `${kind}_${cls?.code ?? "batch"}_${date}.zip`;
				a.click();
				URL.revokeObjectURL(url);
			} else if (!zipDownload) {
				for (const r of results) {
					if (!r.ok || !r.pdfBase64 || !r.filename) continue;
					const byteChars = atob(r.pdfBase64);
					const byteNumbers = new Array(byteChars.length);
					for (let i = 0; i < byteChars.length; i++) {
						byteNumbers[i] = byteChars.charCodeAt(i);
					}
					const blob = new Blob([new Uint8Array(byteNumbers)], {
						type: "application/pdf",
					});
					const url = URL.createObjectURL(blob);
					const a = document.createElement("a");
					a.href = url;
					a.download = r.filename;
					a.click();
					URL.revokeObjectURL(url);
					await new Promise((res) => setTimeout(res, 200));
				}
			}
		} catch (err) {
			toast.error(
				`Échec du regroupement ZIP : ${err instanceof Error ? err.message : String(err)}`,
			);
		}

		setIsGenerating(false);
		if (failCount === 0) {
			toast.success(`${okCount} document(s) généré(s)`);
		} else {
			toast.warning(`${okCount} OK · ${failCount} échec(s)`);
		}
	};

	const summary = useMemo(() => {
		const list = Object.values(genStatus);
		return {
			total: list.length,
			ok: list.filter((s) => s.state === "ok").length,
			error: list.filter((s) => s.state === "error").length,
			running: list.filter((s) => s.state === "running").length,
			pending: list.filter((s) => s.state === "pending").length,
		};
	}, [genStatus]);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-bold text-2xl text-foreground">
					Génération en lot
				</h1>
				<p className="text-muted-foreground">
					Génération côté navigateur. <strong>Ne fermez pas l'onglet</strong>{" "}
					pendant l'opération.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Filtres</CardTitle>
					<CardDescription>
						Choisissez le type de document, l'année académique et la classe.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
					<div className="space-y-1">
						<Label>Type</Label>
						<Select
							value={kind}
							onValueChange={(v) => setKind(v as DocumentKind)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="transcript">
									{KIND_LABELS.transcript}
								</SelectItem>
								<SelectItem value="attestation">
									{KIND_LABELS.attestation}
								</SelectItem>
								<SelectItem value="diploma">{KIND_LABELS.diploma}</SelectItem>
							</SelectContent>
						</Select>
					</div>
					{kind === "transcript" && (
						<div className="space-y-1">
							<Label>Période</Label>
							<Select
								value={period}
								onValueChange={(v) => setPeriod(v as "semester" | "annual")}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="annual">Annuel</SelectItem>
									<SelectItem value="semester">Semestriel</SelectItem>
								</SelectContent>
							</Select>
						</div>
					)}
					{kind === "transcript" && period === "semester" && (
						<div className="space-y-1">
							<Label>Semestre</Label>
							<Select
								value={semesterId || "__ANY__"}
								onValueChange={(v) => setSemesterId(v === "__ANY__" ? "" : v)}
							>
								<SelectTrigger>
									<SelectValue placeholder="Le plus récent" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="__ANY__">Le plus récent</SelectItem>
									{(semesters ?? []).map((s) => (
										<SelectItem key={s.id} value={s.id}>
											{s.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}
					<div className="space-y-1">
						<Label>Année académique</Label>
						<Select
							value={academicYearId || "__ANY__"}
							onValueChange={(v) => {
								setAcademicYearId(v === "__ANY__" ? "" : v);
								setClassId("");
							}}
						>
							<SelectTrigger>
								<SelectValue placeholder="Toutes" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__ANY__">Toutes</SelectItem>
								{(academicYears ?? []).map((y) => (
									<SelectItem key={y.id} value={y.id}>
										{y.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-1">
						<Label>Classe</Label>
						<Select
							value={classId}
							onValueChange={setClassId}
							disabled={classesLoading}
						>
							<SelectTrigger>
								<SelectValue placeholder="Choisir une classe…" />
							</SelectTrigger>
							<SelectContent>
								{(classes ?? []).map((c) => (
									<SelectItem key={c.id} value={c.id}>
										{c.code} — {c.name}
										{c.program?.name ? ` (${c.program.name})` : ""}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{classId && (
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between gap-4">
							<div>
								<CardTitle>Étudiants</CardTitle>
								<CardDescription>
									{studentItems.length} étudiant(s) dans cette classe.{" "}
									{selectedIds.size} sélectionné(s).
								</CardDescription>
							</div>
							<div className="flex items-center gap-3">
								<div className="flex items-center gap-2">
									<Switch
										id="zip"
										checked={zipDownload}
										onCheckedChange={setZipDownload}
									/>
									<Label
										htmlFor="zip"
										className="flex cursor-pointer items-center gap-1 font-normal text-sm"
									>
										<FileArchive className="h-4 w-4" />
										ZIP
									</Label>
								</div>
								<div className="flex items-center gap-2">
									<Switch
										id="demo"
										checked={demoMode}
										onCheckedChange={setDemoMode}
									/>
									<Label
										htmlFor="demo"
										className="cursor-pointer font-normal text-sm"
									>
										Mode démo
									</Label>
								</div>
								<Button
									variant="outline"
									onClick={() => {
										const first = [...selectedIds][0] ?? studentItems[0]?.id;
										if (!first) {
											toast.error("Aucun étudiant à prévisualiser");
											return;
										}
										previewOne.mutate(first);
									}}
									disabled={
										previewOne.isPending ||
										(selectedIds.size === 0 && studentItems.length === 0)
									}
									title="Aperçu du document pour le premier étudiant sélectionné"
								>
									{previewOne.isPending ? (
										<Spinner className="mr-2" />
									) : (
										<Eye className="mr-2 h-4 w-4" />
									)}
									Aperçu
								</Button>
								<Button
									onClick={handleGenerate}
									disabled={isGenerating || selectedIds.size === 0}
								>
									{isGenerating ? (
										<Spinner className="mr-2" />
									) : (
										<Download className="mr-2 h-4 w-4" />
									)}
									Générer {selectedIds.size}
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						{isGenerating && progress.total > 0 && (
							<div className="mb-4 space-y-2">
								<div className="flex items-center justify-between text-sm">
									<span>
										Génération en cours… {progress.done} / {progress.total}
									</span>
									<span className="text-muted-foreground">
										{summary.ok} OK · {summary.error} échec(s)
									</span>
								</div>
								<Progress
									value={
										progress.total > 0
											? (progress.done / progress.total) * 100
											: 0
									}
								/>
							</div>
						)}

						{studentsLoading ? (
							<div className="flex justify-center py-8">
								<Spinner />
							</div>
						) : studentItems.length === 0 ? (
							<p className="py-8 text-center text-muted-foreground">
								Aucun étudiant dans cette classe.
							</p>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-10">
											<Checkbox
												checked={allSelected}
												onCheckedChange={toggleAll}
												aria-label="Tout sélectionner"
											/>
										</TableHead>
										<TableHead>Matricule</TableHead>
										<TableHead>Nom</TableHead>
										<TableHead>Prénom(s)</TableHead>
										<TableHead className="w-32">Statut</TableHead>
										<TableHead className="w-12 text-right">Aperçu</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{studentItems.map((s) => {
										const status = genStatus[s.id];
										return (
											<TableRow key={s.id}>
												<TableCell>
													<Checkbox
														checked={selectedIds.has(s.id)}
														onCheckedChange={() => toggleOne(s.id)}
														aria-label={`Sélectionner ${s.profile.firstName}`}
													/>
												</TableCell>
												<TableCell className="font-mono text-xs">
													{s.registrationNumber}
												</TableCell>
												<TableCell>{s.profile.lastName}</TableCell>
												<TableCell>{s.profile.firstName}</TableCell>
												<TableCell>
													{!status && (
														<span className="text-muted-foreground text-xs">
															—
														</span>
													)}
													{status?.state === "pending" && (
														<Badge variant="secondary">En attente</Badge>
													)}
													{status?.state === "running" && (
														<Badge variant="secondary">
															<Loader2 className="mr-1 h-3 w-3 animate-spin" />
															Génération
														</Badge>
													)}
													{status?.state === "ok" && (
														<Badge className="bg-emerald-600">
															<CheckCircle2 className="mr-1 h-3 w-3" />
															OK
														</Badge>
													)}
													{status?.state === "error" && (
														<Badge variant="destructive" title={status.error}>
															<AlertCircle className="mr-1 h-3 w-3" />
															Échec
														</Badge>
													)}
												</TableCell>
												<TableCell className="text-right">
													<Button
														variant="ghost"
														size="sm"
														onClick={() => previewOne.mutate(s.id)}
														disabled={previewOne.isPending}
														title={`Aperçu pour ${s.profile.firstName} ${s.profile.lastName}`}
													>
														{previewOne.isPending &&
														previewOne.variables === s.id ? (
															<Spinner className="h-4 w-4" />
														) : (
															<Eye className="h-4 w-4" />
														)}
													</Button>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>
			)}

			{/* HTML preview dialog */}
			<Dialog
				open={!!previewState}
				onOpenChange={(open) => !open && setPreviewState(null)}
			>
				<DialogContent className="flex h-[90vh] max-w-6xl flex-col">
					<DialogHeader>
						<DialogTitle>
							Aperçu — {KIND_LABELS[kind]} ({previewState?.studentName})
						</DialogTitle>
						<DialogDescription>
							{previewState?.templateName ? (
								<>
									Modèle utilisé : <strong>{previewState.templateName}</strong>
								</>
							) : (
								"Rendu HTML — données réelles, sans rasterisation PDF."
							)}
						</DialogDescription>
					</DialogHeader>
					<div className="mx-6 mb-6 flex-1 overflow-auto rounded border bg-white">
						{previewState?.html && (
							<iframe
								title="Aperçu document"
								className="block h-full w-full"
								style={{
									minWidth: "210mm",
									minHeight: "297mm",
								}}
								srcDoc={previewState.html}
								sandbox="allow-same-origin"
							/>
						)}
					</div>
				</DialogContent>
			</Dialog>

			{summary.error > 0 && !isGenerating && (
				<Card className="border-destructive/40">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-destructive">
							<AlertCircle className="h-5 w-5" />
							{summary.error} échec(s)
						</CardTitle>
					</CardHeader>
					<CardContent>
						<ul className="space-y-1 text-sm">
							{Object.entries(genStatus)
								.filter(([, s]) => s.state === "error")
								.map(([id, s]) => {
									const student = studentItems.find((x) => x.id === id);
									return (
										<li key={id} className="flex items-start gap-2">
											<FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
											<div>
												<div className="font-medium">
													{student?.profile.lastName}{" "}
													{student?.profile.firstName}{" "}
													<span className="font-mono text-muted-foreground text-xs">
														({student?.registrationNumber})
													</span>
												</div>
												<div className="text-destructive text-xs">
													{(s as { error: string }).error}
												</div>
											</div>
										</li>
									);
								})}
						</ul>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
