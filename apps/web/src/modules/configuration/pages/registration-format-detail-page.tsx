import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { confirmAction } from "@/components/callable/confirm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { FormatGeneralCard } from "../components/format-general-card";
import { FormatPreviewCard } from "../components/format-preview-card";
import { FormatSegmentsCard } from "../components/format-segments-card";
import { useRegistrationFormatDraft } from "../hooks/use-registration-format-draft";

export default function RegistrationFormatDetailPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { formatId } = useParams<{ formatId: string }>();
	const {
		draft,
		update,
		segments,
		isLoading,
		notFound,
		save,
		isSaving,
		remove,
		isDeleting,
	} = useRegistrationFormatDraft(formatId);

	const backToList = () => navigate("/configuration/reg-numbers");
	const backLabel = t("common.actions.back", { defaultValue: "Back" });
	const deleteLabel = t("admin.registrationNumbers.list.delete", {
		defaultValue: "Delete",
	});

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Spinner className="h-8 w-8" />
			</div>
		);
	}

	if (notFound) {
		return (
			<div className="space-y-4">
				<Button
					variant="ghost"
					className="flex items-center gap-2"
					onClick={backToList}
				>
					<ArrowLeft className="h-4 w-4" />
					{backLabel}
				</Button>
				<Card>
					<CardContent className="py-10 text-center text-muted-foreground">
						{t("admin.registrationNumbers.errors.notFound", {
							defaultValue: "Format not found.",
						})}
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="space-y-1">
					<button
						type="button"
						className="flex items-center gap-2 text-muted-foreground text-sm hover:text-foreground"
						onClick={backToList}
					>
						<ArrowLeft className="h-4 w-4" />
						{backLabel}
					</button>
					<h1 className="text-foreground">
						{draft.id
							? t("admin.registrationNumbers.dialog.editTitle", {
									defaultValue: "Edit format",
								})
							: t("admin.registrationNumbers.dialog.createTitle", {
									defaultValue: "New format",
								})}
					</h1>
					<p className="text-muted-foreground">
						{t("admin.registrationNumbers.subtitle", {
							defaultValue:
								"Design templates for automatic matricule generation.",
						})}
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					{draft.id && draft.isActive && (
						<Badge variant="secondary">
							{t("admin.registrationNumbers.list.active", {
								defaultValue: "Active",
							})}
						</Badge>
					)}
					<Button onClick={save} disabled={isSaving}>
						{t("admin.registrationNumbers.actions.save", {
							defaultValue: "Save format",
						})}
					</Button>
					{draft.id && !draft.isActive && (
						<Button
							variant="destructive"
							onClick={() =>
								confirmAction({
									title: t(
										"admin.registrationNumbers.list.confirmDeleteTitle",
										{ defaultValue: "Delete format?" },
									),
									message: t("admin.registrationNumbers.list.confirmDelete", {
										defaultValue: "Delete this format permanently?",
									}),
									confirmText: deleteLabel,
									onConfirm: remove,
								})
							}
							disabled={isDeleting}
						>
							{deleteLabel}
						</Button>
					)}
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				<div className="space-y-6 lg:col-span-2">
					<FormatGeneralCard draft={draft} onChange={update} />
					<FormatSegmentsCard
						segments={draft.definition.segments}
						actions={segments}
					/>
				</div>
				<div className="space-y-6">
					<FormatPreviewCard draft={draft} />
				</div>
			</div>
		</div>
	);
}
