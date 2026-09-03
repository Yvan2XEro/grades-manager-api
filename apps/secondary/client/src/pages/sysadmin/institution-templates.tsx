import { FileCode2, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/ui/code-editor";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

type TemplateType =
	| "report_card"
	| "class_roster"
	| "eligibility_list"
	| "candidate_list";

const TEMPLATE_TYPES: TemplateType[] = [
	"report_card",
	"class_roster",
	"eligibility_list",
	"candidate_list",
];

// Default starter templates per type — minimal valid HTML the user can customize
const DEFAULT_TEMPLATES: Record<TemplateType, string> = {
	report_card: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; font-size: 13px; }
    h1 { text-align: center; font-size: 16px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; }
    th { background: #f0f0f0; }
  </style>
</head>
<body>
  <h1>{{institution_name}}</h1>
  <p>Élève : <strong>{{student_name}}</strong> — Matricule : {{student_mnu}}</p>
  <p>Classe : {{class_name}} — Année : {{year_name}} — Séquence : {{term_name}}</p>
  <p>Moyenne : <strong>{{avg}}</strong> / 20 — Rang : {{rank}} / {{total_students}}</p>
</body>
</html>`,
	class_roster: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; font-size: 13px; }
    h1 { text-align: center; font-size: 16px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; }
    th { background: #f0f0f0; }
  </style>
</head>
<body>
  <h1>{{institution_name}}</h1>
  <h2>Liste de classe — {{class_name}} — {{year_name}}</h2>
  <p>Total : {{student_count}} élèves</p>
  <!-- Rows are injected by the platform renderer -->
</body>
</html>`,
	eligibility_list: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; font-size: 13px; }
    h1 { text-align: center; font-size: 16px; }
  </style>
</head>
<body>
  <h1>{{institution_name}}</h1>
  <h2>Liste d'éligibilité — {{class_name}} — {{year_name}}</h2>
  <p>Candidats éligibles : {{student_count}}</p>
</body>
</html>`,
	candidate_list: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; font-size: 13px; }
    h1 { text-align: center; font-size: 16px; }
  </style>
</head>
<body>
  <h1>{{institution_name}}</h1>
  <h2>Liste des candidats — {{session_name}} — {{subject_name}}</h2>
  <p>Nombre de candidats : {{student_count}}</p>
</body>
</html>`,
};

// ─── Template type sidebar ────────────────────────────────────────────────────

function TypeSidebar({
	institutionId,
	selected,
	onSelect,
}: {
	institutionId: string;
	selected: TemplateType | null;
	onSelect: (t: TemplateType) => void;
}) {
	const { t } = useTranslation();
	const { data } = trpc.systemAdmin.listInstitutionTemplates.useQuery({
		institutionId,
	});

	const customTypes = new Set(data?.map((r) => r.type) ?? []);

	return (
		<nav className="flex flex-col gap-1">
			{TEMPLATE_TYPES.map((type) => (
				<button
					key={type}
					type="button"
					onClick={() => onSelect(type)}
					className={cn(
						"flex items-center justify-between rounded-lg px-3 py-2.5 text-left font-medium text-sm transition-colors",
						selected === type
							? "bg-primary text-primary-foreground"
							: "text-foreground hover:bg-muted",
					)}
				>
					<div className="flex items-center gap-2.5">
						<FileCode2 className="h-4 w-4 flex-shrink-0" />
						{t(`sysadmin.templates.type_${type}`)}
					</div>
					<span
						className={cn(
							"rounded-full px-1.5 py-0.5 text-xs",
							selected === type
								? "bg-white/20 text-white"
								: customTypes.has(type)
									? "bg-emerald-500/10 text-emerald-600"
									: "bg-muted text-muted-foreground",
						)}
					>
						{customTypes.has(type)
							? t("sysadmin.templates.custom_badge")
							: t("sysadmin.templates.default_badge")}
					</span>
				</button>
			))}
		</nav>
	);
}

// ─── Template editor ──────────────────────────────────────────────────────────

function TemplateEditor({
	institutionId,
	type,
}: {
	institutionId: string;
	type: TemplateType;
}) {
	const { t } = useTranslation();
	const utils = trpc.useUtils();

	const { data, isLoading } = trpc.systemAdmin.getInstitutionTemplate.useQuery(
		{ institutionId, type },
		{ enabled: !!institutionId },
	);

	const [name, setName] = useState("");
	const [html, setHtml] = useState("");
	const [showPreview, setShowPreview] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [savedMsg, setSavedMsg] = useState(false);

	// Sync from DB when data loads
	const [initialized, setInitialized] = useState(false);
	if (!isLoading && !initialized) {
		setName(
			data?.name ??
				`${t(`sysadmin.templates.type_${type}`)} — ${new Date().getFullYear()}`,
		);
		setHtml(data?.htmlContent ?? DEFAULT_TEMPLATES[type]);
		setInitialized(true);
	}

	// Re-init when type changes
	const [lastType, setLastType] = useState(type);
	if (type !== lastType) {
		setLastType(type);
		setInitialized(false);
		setSavedMsg(false);
	}

	const upsert = trpc.systemAdmin.upsertInstitutionTemplate.useMutation({
		onSuccess: () => {
			utils.systemAdmin.listInstitutionTemplates.invalidate({ institutionId });
			utils.systemAdmin.getInstitutionTemplate.invalidate({
				institutionId,
				type,
			});
			setSavedMsg(true);
			setTimeout(() => setSavedMsg(false), 2500);
		},
	});

	const del = trpc.systemAdmin.deleteInstitutionTemplate.useMutation({
		onSuccess: () => {
			utils.systemAdmin.listInstitutionTemplates.invalidate({ institutionId });
			utils.systemAdmin.getInstitutionTemplate.invalidate({
				institutionId,
				type,
			});
			setShowDeleteConfirm(false);
			setHtml(DEFAULT_TEMPLATES[type]);
			setName(
				`${t(`sysadmin.templates.type_${type}`)} — ${new Date().getFullYear()}`,
			);
			setInitialized(false);
		},
	});

	const handleLoadDefault = () => {
		setHtml(DEFAULT_TEMPLATES[type]);
	};

	const varKey = `sysadmin.templates.vars_${type}` as const;

	if (isLoading) {
		return (
			<div className="flex flex-col gap-3">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-[400px] w-full" />
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-5">
			{/* Header row */}
			<div className="flex items-center justify-between gap-4">
				<div>
					<h2 className="font-semibold text-base text-foreground">
						{t(`sysadmin.templates.type_${type}`)}
					</h2>
					<p className="mt-0.5 text-muted-foreground text-xs">
						{t("sysadmin.templates.editor_tip")}
					</p>
				</div>
				<div className="flex items-center gap-2">
					{data && (
						<Button
							variant="ghost"
							size="sm"
							className="text-rose-600 hover:text-rose-700"
							onClick={() => setShowDeleteConfirm(true)}
						>
							<Trash2 className="mr-1.5 h-4 w-4" />
							{t("sysadmin.templates.delete")}
						</Button>
					)}
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowPreview(!showPreview)}
					>
						{t("sysadmin.templates.preview")}
					</Button>
					<Button
						size="sm"
						disabled={upsert.isPending}
						onClick={() =>
							upsert.mutate({
								institutionId,
								type,
								name: name.trim() || t(`sysadmin.templates.type_${type}`),
								htmlContent: html,
							})
						}
					>
						{upsert.isPending ? (
							<>
								<Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
								{t("sysadmin.templates.saving")}
							</>
						) : savedMsg ? (
							t("sysadmin.templates.saved")
						) : (
							t("sysadmin.templates.save")
						)}
					</Button>
				</div>
			</div>

			{/* Template name */}
			<div className="space-y-1.5">
				<Label>{t("sysadmin.templates.template_name")}</Label>
				<Input
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder={t("sysadmin.templates.template_name_placeholder")}
					className="max-w-sm"
				/>
			</div>

			{/* Variables reference */}
			<div className="space-y-1 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
				<p className="font-medium text-foreground text-xs uppercase tracking-wide">
					{t("sysadmin.templates.vars_title")}
				</p>
				<p className="text-muted-foreground text-xs">
					{t("sysadmin.templates.vars_hint")}
				</p>
				<p className="mt-1 font-mono text-foreground text-xs">{t(varKey)}</p>
			</div>

			{/* Load default + editor */}
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<Label>{t("sysadmin.templates.html_content")}</Label>
					<button
						type="button"
						onClick={handleLoadDefault}
						className="text-muted-foreground text-xs underline underline-offset-2 hover:text-foreground"
					>
						{t("sysadmin.templates.load_default")}
					</button>
				</div>
				<CodeEditor value={html} onChange={setHtml} minHeight="460px" />
			</div>

			{/* Preview panel */}
			{showPreview && (
				<div className="space-y-2">
					<Label>{t("sysadmin.templates.preview")}</Label>
					<iframe
						title="Template preview"
						srcDoc={html}
						sandbox="allow-same-origin"
						className="h-[500px] w-full rounded-lg border border-border bg-white"
					/>
				</div>
			)}

			{/* Delete confirm dialog */}
			<Dialog
				open={showDeleteConfirm}
				onOpenChange={(v) => !v && setShowDeleteConfirm(false)}
			>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>
							{t("sysadmin.templates.delete_confirm_title")}
						</DialogTitle>
					</DialogHeader>
					<p className="text-muted-foreground text-sm">
						{t("sysadmin.templates.delete_confirm_desc")}
					</p>
					<div className="flex justify-end gap-2 pt-2">
						<Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							disabled={del.isPending}
							onClick={() => data && del.mutate({ id: data.id })}
						>
							{del.isPending
								? t("sysadmin.templates.deleting")
								: t("sysadmin.templates.delete_btn")}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

// ─── Main exported tab ────────────────────────────────────────────────────────

export function InstitutionTemplatesTab() {
	const { id: institutionId } = useParams<{ id: string }>();
	const { t } = useTranslation();
	const [selectedType, setSelectedType] = useState<TemplateType | null>(null);

	if (!institutionId) return null;

	return (
		<div className="grid grid-cols-[200px_1fr] gap-6">
			{/* Sidebar */}
			<div className="space-y-3">
				<p className="font-medium text-foreground text-sm">
					{t("sysadmin.templates.select_type")}
				</p>
				<TypeSidebar
					institutionId={institutionId}
					selected={selectedType}
					onSelect={setSelectedType}
				/>
			</div>

			{/* Editor area */}
			<div>
				{selectedType ? (
					<TemplateEditor institutionId={institutionId} type={selectedType} />
				) : (
					<div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border border-dashed py-16 text-center">
						<FileCode2 className="h-8 w-8 text-muted-foreground" />
						<p className="font-medium text-foreground">
							{t("sysadmin.templates.no_templates")}
						</p>
						<p className="max-w-xs text-muted-foreground text-sm">
							{t("sysadmin.templates.no_templates_desc")}
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
