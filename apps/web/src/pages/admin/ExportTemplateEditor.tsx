import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, Eye, FileCode, Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { CodeEditor } from "@/components/admin/document-templates/CodeEditor";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
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
	getTemplateExample,
	type TemplateType,
} from "@/lib/export-template-examples";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";

export default function ExportTemplateEditor() {
	const { t } = useTranslation();
	const { templateId } = useParams<{ templateId: string }>();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [isSaving, setIsSaving] = useState(false);
	const isNewTemplate = templateId === "new";

	// État local
	const [templateBody, setTemplateBody] = useState<string>("");
	const [templateName, setTemplateName] = useState<string>("");
	const [templateType, setTemplateType] = useState<string>("pv");
	const [previewHtml, setPreviewHtml] = useState<string>("");
	const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
	const [livePreview, setLivePreview] = useState<boolean>(false);
	// Vertical layout for the editor/preview split (allows the user to put
	// preview on top of editor on small screens, or side-by-side on big ones).
	const [splitDirection, setSplitDirection] = useState<
		"horizontal" | "vertical"
	>("horizontal");
	// Resizable card height (px). Persisted across sessions so editors don't
	// lose their preferred working size on every reload.
	const HEIGHT_STORAGE_KEY = "exportTemplateEditor.cardHeight";
	const MIN_CARD_HEIGHT = 320;
	const MAX_CARD_HEIGHT = 2000;
	const [cardHeight, setCardHeight] = useState<number>(() => {
		if (typeof window === "undefined") return 600;
		const saved = window.localStorage.getItem(HEIGHT_STORAGE_KEY);
		const parsed = saved ? Number.parseInt(saved, 10) : Number.NaN;
		if (Number.isFinite(parsed) && parsed >= MIN_CARD_HEIGHT) return parsed;
		return Math.round(window.innerHeight * 0.75);
	});
	useEffect(() => {
		if (typeof window === "undefined") return;
		window.localStorage.setItem(HEIGHT_STORAGE_KEY, String(cardHeight));
	}, [cardHeight]);
	const cardWrapperRef = useRef<HTMLDivElement | null>(null);
	const dragStateRef = useRef<{ startY: number; startHeight: number } | null>(
		null,
	);
	const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
		e.preventDefault();
		dragStateRef.current = { startY: e.clientY, startHeight: cardHeight };
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
		document.body.style.userSelect = "none";
		document.body.style.cursor = "row-resize";
	};
	const handleResizePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
		const drag = dragStateRef.current;
		if (!drag) return;
		const next = drag.startHeight + (e.clientY - drag.startY);
		setCardHeight(
			Math.max(MIN_CARD_HEIGHT, Math.min(MAX_CARD_HEIGHT, Math.round(next))),
		);
	};
	const handleResizePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
		dragStateRef.current = null;
		(e.target as HTMLElement).releasePointerCapture(e.pointerId);
		document.body.style.userSelect = "";
		document.body.style.cursor = "";
	};

	// Mutation de création
	const createMutation = useMutation({
		mutationFn: async () => {
			if (!templateName.trim()) {
				throw new Error(t("admin.exportTemplates.validation.name"));
			}
			if (!templateBody.trim()) {
				throw new Error(t("admin.exportTemplates.editor.template.required"));
			}
			return await trpcClient.exportTemplates.create.mutate({
				name: templateName.trim(),
				type: templateType as any,
				isDefault: false,
				templateBody,
			});
		},
		onSuccess: (result) => {
			toast.success(t("admin.exportTemplates.toast.createSuccess"));
			navigate(`/admin/export-templates/${result.id}`, { replace: true });
			queryClient.invalidateQueries({ queryKey: ["exportTemplates"] });
		},
		onError: (error: any) => {
			toast.error(
				error.message || t("admin.exportTemplates.toast.createError"),
			);
		},
	});

	// Charger le template
	const { data: template, isLoading } = useQuery({
		queryKey: ["exportTemplate", templateId],
		queryFn: async () => {
			if (!templateId || templateId === "new")
				throw new Error("No template ID");
			const result = await trpcClient.exportTemplates.getById.query({
				id: templateId,
			});
			setTemplateBody(result.templateBody || "");
			setTemplateName(result.name);
			setTemplateType(result.type);
			return result;
		},
		enabled: !!templateId && templateId !== "new",
	});

	// Mutation de sauvegarde
	const updateMutation = useMutation({
		mutationFn: async () => {
			if (!templateId || templateId === "new")
				throw new Error("No template ID");
			await trpcClient.exportTemplates.update.mutate({
				id: templateId,
				name: templateName.trim(),
				templateBody: templateBody || "",
			});
		},
		onSuccess: () => {
			toast.success(t("admin.exportTemplates.toast.updateSuccess"));
			queryClient.invalidateQueries({
				queryKey: ["exportTemplate", templateId],
			});
			queryClient.invalidateQueries({ queryKey: ["exportTemplates"] });
		},
		onError: (error: any) => {
			toast.error(
				error.message || t("admin.exportTemplates.toast.updateError"),
			);
		},
	});

	// Mutation pour générer le preview
	const previewMutation = useMutation({
		mutationFn: async () => {
			const result = await trpcClient.exports.previewTemplate.mutate({
				type: (template?.type || templateType) as any,
				templateBody,
			});
			return result;
		},
		onSuccess: (data: { html: string }) => {
			setPreviewHtml(data.html);
			toast.success(t("admin.exportTemplates.editor.preview.success"));
		},
		onError: (error: any) => {
			toast.error(
				error.message || t("admin.exportTemplates.editor.preview.error"),
			);
		},
	});

	const handleSave = async () => {
		if (!templateName.trim()) {
			toast.error(t("admin.exportTemplates.validation.name"));
			return;
		}
		if (!templateBody.trim()) {
			toast.error(t("admin.exportTemplates.editor.template.required"));
			return;
		}
		setIsSaving(true);
		try {
			if (isNewTemplate) {
				await createMutation.mutateAsync();
			} else {
				await updateMutation.mutateAsync();
			}
		} finally {
			setIsSaving(false);
		}
	};

	const handleGeneratePreview = async () => {
		setIsGeneratingPreview(true);
		try {
			await previewMutation.mutateAsync();
		} finally {
			setIsGeneratingPreview(false);
		}
	};

	// Live preview: debounce template body changes and re-render preview.
	// 600ms is enough to absorb fast typing without spamming the server.
	const liveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	useEffect(() => {
		if (!livePreview || !templateBody.trim()) return;
		if (liveTimerRef.current) clearTimeout(liveTimerRef.current);
		liveTimerRef.current = setTimeout(() => {
			previewMutation.mutate();
		}, 600);
		return () => {
			if (liveTimerRef.current) clearTimeout(liveTimerRef.current);
		};
		// previewMutation is stable across renders; we only want to re-fire on
		// body/type changes or when toggling live mode.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [livePreview, templateBody, templateType]);

	const handleDownloadPreview = () => {
		if (!previewHtml) return;
		const blob = new Blob([previewHtml], { type: "text/html" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `preview-${templateType}-${Date.now()}.html`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const handleLoadExample = () => {
		const currentType = (template?.type || templateType) as TemplateType;
		const exampleTemplate = getTemplateExample(currentType);
		if (exampleTemplate) {
			setTemplateBody(exampleTemplate);
			toast.success(t("admin.exportTemplates.editor.template.exampleLoaded"));
		}
	};

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<Spinner />
			</div>
		);
	}

	if (!template && !isNewTemplate) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center">
				<h2 className="font-semibold text-foreground text-xl">
					{t("admin.exportTemplates.editor.notFound")}
				</h2>
				<Button
					onClick={() => navigate("/admin/export-templates")}
					className="mt-4"
				>
					<ArrowLeft className="mr-2 h-4 w-4" />
					{t("common.actions.back")}
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => navigate("/admin/export-templates")}
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						{t("common.actions.back")}
					</Button>
					<div>
						<h1 className="text-foreground">
							{template?.name || templateName}
						</h1>
						<p className="text-muted-foreground">
							{t("admin.exportTemplates.editor.subtitle", {
								type: template?.type || templateType,
							})}
						</p>
					</div>
				</div>
				<Button onClick={handleSave} disabled={isSaving}>
					{isSaving ? (
						<Spinner className="mr-2" />
					) : (
						<Save className="mr-2 h-4 w-4" />
					)}
					{isNewTemplate
						? t("common.actions.create")
						: t("common.actions.save")}
				</Button>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<div className="space-y-2">
					<Label>{t("admin.exportTemplates.form.name")}</Label>
					<Input
						value={templateName}
						onChange={(e) => setTemplateName(e.target.value)}
						placeholder={t("admin.exportTemplates.form.namePlaceholder")}
					/>
				</div>
				<div className="space-y-2">
					<Label>{t("admin.exportTemplates.form.type")}</Label>
					<Select
						value={templateType}
						onValueChange={setTemplateType}
						disabled={!isNewTemplate}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="pv">PV (Procès-Verbal)</SelectItem>
							<SelectItem value="evaluation">Evaluation</SelectItem>
							<SelectItem value="ue">UE (Teaching Unit)</SelectItem>
							<SelectItem value="deliberation">Délibération</SelectItem>
						</SelectContent>
					</Select>
					<p className="text-muted-foreground text-xs">
						{t("admin.exportTemplates.form.typeDescription")}
					</p>
				</div>
			</div>

			{/* Editor + Preview — resizable split. The user can drag the handle
			   to expand either side, and toggle layout (horizontal/vertical). */}
			<div className="flex items-center gap-4 px-1">
				<div className="flex items-center gap-2">
					<Switch
						id="live-preview"
						checked={livePreview}
						onCheckedChange={setLivePreview}
					/>
					<Label
						htmlFor="live-preview"
						className="cursor-pointer font-normal text-sm"
					>
						Aperçu en direct
					</Label>
					{livePreview && previewMutation.isPending && (
						<span className="text-muted-foreground text-xs italic">
							rendu en cours…
						</span>
					)}
				</div>
				<div className="ml-auto flex items-center gap-2">
					<Label className="text-muted-foreground text-xs">Disposition:</Label>
					<Button
						size="sm"
						variant={splitDirection === "horizontal" ? "default" : "outline"}
						onClick={() => setSplitDirection("horizontal")}
					>
						Côte à côte
					</Button>
					<Button
						size="sm"
						variant={splitDirection === "vertical" ? "default" : "outline"}
						onClick={() => setSplitDirection("vertical")}
					>
						Empilé
					</Button>
				</div>
			</div>
			<div
				ref={cardWrapperRef}
				className="relative rounded-lg border"
				style={{ height: cardHeight }}
			>
				<ResizablePanelGroup
					direction={splitDirection}
					className="h-full rounded-lg"
				>
					{/* Éditeur */}
					<ResizablePanel defaultSize={50} minSize={20}>
						<Card className="flex h-full flex-col rounded-none border-0">
							<CardHeader className="flex-shrink-0">
								<CardTitle>
									{t("admin.exportTemplates.editor.template.editorTitle")}
								</CardTitle>
								<CardDescription>
									{t("admin.exportTemplates.editor.template.editorDescription")}
								</CardDescription>
							</CardHeader>
							<CardContent className="flex flex-1 flex-col gap-3 overflow-hidden">
								{/* Real code editor (CodeMirror 6) with HTML+Handlebars
							    syntax highlighting, line numbers, search, autocomplete,
							    bracket matching and folding. Scrolls internally — the
							    surrounding panel controls the size. */}
								<div className="min-h-0 flex-1">
									<CodeEditor
										value={templateBody}
										onChange={setTemplateBody}
										placeholder={t(
											"admin.exportTemplates.editor.template.placeholder",
										)}
										className="h-full"
									/>
								</div>
								<div className="flex flex-wrap gap-2">
									<Button variant="outline" onClick={handleLoadExample}>
										<FileCode className="mr-2 h-4 w-4" />
										{t("admin.exportTemplates.editor.template.loadExample")}
									</Button>
									<Button
										onClick={handleGeneratePreview}
										disabled={isGeneratingPreview || !templateBody.trim()}
									>
										{isGeneratingPreview ? (
											<Spinner className="mr-2" />
										) : (
											<Eye className="mr-2 h-4 w-4" />
										)}
										{t("admin.exportTemplates.editor.template.generatePreview")}
									</Button>
								</div>
							</CardContent>
						</Card>
					</ResizablePanel>

					<ResizableHandle withHandle />

					{/* Preview */}
					<ResizablePanel defaultSize={50} minSize={20}>
						<Card className="flex h-full flex-col rounded-none border-0">
							<CardHeader className="flex-shrink-0">
								<div className="flex items-center justify-between">
									<div>
										<CardTitle>
											{t("admin.exportTemplates.editor.template.previewTitle")}
										</CardTitle>
										<CardDescription>
											{t(
												"admin.exportTemplates.editor.template.previewDescription",
											)}
										</CardDescription>
									</div>
									{previewHtml && (
										<Button
											variant="outline"
											size="sm"
											onClick={handleDownloadPreview}
										>
											<Download className="mr-2 h-4 w-4" />
											{t("admin.exportTemplates.editor.template.download")}
										</Button>
									)}
								</div>
							</CardHeader>
							<CardContent className="flex flex-1 overflow-hidden">
								{previewHtml ? (
									<iframe
										srcDoc={previewHtml}
										className="h-full w-full rounded border bg-white"
										title="Template Preview"
										sandbox="allow-same-origin"
									/>
								) : (
									<div className="flex h-full w-full flex-col items-center justify-center rounded border bg-muted/50">
										<Eye className="mb-4 h-12 w-12 text-muted-foreground" />
										<p className="text-muted-foreground">
											{t("admin.exportTemplates.editor.template.noPreview")}
										</p>
										<p className="mt-2 text-muted-foreground text-sm">
											{t("admin.exportTemplates.editor.template.clickGenerate")}
										</p>
									</div>
								)}
							</CardContent>
						</Card>
					</ResizablePanel>
				</ResizablePanelGroup>
				{/* Bottom edge handle — drag with the mouse to resize the
				    overall editor/preview card height. Double-click resets it. */}
				<div
					role="separator"
					aria-orientation="horizontal"
					aria-label="Redimensionner la hauteur"
					title="Glisser pour redimensionner — double-clic pour réinitialiser"
					onPointerDown={handleResizePointerDown}
					onPointerMove={handleResizePointerMove}
					onPointerUp={handleResizePointerUp}
					onPointerCancel={handleResizePointerUp}
					onDoubleClick={() =>
						setCardHeight(Math.round(window.innerHeight * 0.75))
					}
					className="group -bottom-1.5 absolute inset-x-0 z-10 flex h-3 cursor-row-resize items-center justify-center"
				>
					<span className="h-1 w-16 rounded-full bg-border transition-colors group-hover:bg-primary/60" />
				</div>
			</div>

			<div className="space-y-2 px-1 text-muted-foreground text-sm">
				<p className="font-semibold">
					{t("admin.exportTemplates.editor.template.helpTitle")}
				</p>
				<ul className="list-inside list-disc space-y-1">
					<li>{t("admin.exportTemplates.editor.template.helpHandlebars")}</li>
					<li>{t("admin.exportTemplates.editor.template.helpVariables")}</li>
					<li>{t("admin.exportTemplates.editor.template.helpStatic")}</li>
				</ul>
			</div>
		</div>
	);
}
