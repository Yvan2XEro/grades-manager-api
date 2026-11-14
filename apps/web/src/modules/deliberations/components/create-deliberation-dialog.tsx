import { Loader2, Users, Zap } from "lucide-react";
import { createCallable } from "react-call";
import { useTranslation } from "react-i18next";
import { DIALOG_EXIT_MS } from "@/components/callable/callable-dialog";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	type CreateDeliberationTab,
	useCreateDeliberation,
} from "../hooks/use-create-deliberation";
import { CreateDeliberationClassPicker } from "./create-deliberation-class-picker";
import { CreateDeliberationFields } from "./create-deliberation-fields";

type Props = {};

/** Creates a deliberation for one class, or one per selected class. */
export const CreateDeliberationDialog = createCallable<Props, void>(
	({ call }) => {
		const { t } = useTranslation();
		const state = useCreateDeliberation(() => call.end());
		const {
			tab,
			setTab,
			fields,
			patch,
			singleClassId,
			setSingleClassId,
			classesQuery,
			allClasses,
			selectedClassIds,
			close,
			submitSingle,
			submitBatch,
			singleCanSubmit,
			multiCanSubmit,
			singlePending,
			batchRunning,
		} = state;

		return (
			<Dialog open={!call.ended} onOpenChange={(o) => !o && close()}>
				<DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							{t("admin.deliberations.form.createTitle")}
						</DialogTitle>
						<DialogDescription>
							{t("admin.deliberations.form.createDescription", {
								defaultValue:
									"Configurez et lancez une nouvelle session de délibération",
							})}
						</DialogDescription>
					</DialogHeader>

					<DialogBody className="space-y-4 px-6 pb-4">
						<Tabs
							value={tab}
							onValueChange={(v) => setTab(v as CreateDeliberationTab)}
						>
							<TabsList className="grid w-full grid-cols-2">
								<TabsTrigger value="single">
									{t("admin.deliberations.form.tabSingle", {
										defaultValue: "Classe unique",
									})}
								</TabsTrigger>
								<TabsTrigger value="multi" className="gap-1.5">
									<Users className="h-3.5 w-3.5" />
									{t("admin.deliberations.form.tabMulti", {
										defaultValue: "Multi-classes",
									})}
								</TabsTrigger>
							</TabsList>
						</Tabs>

						<CreateDeliberationFields state={state} />

						{tab === "single" ? (
							<div className="space-y-2">
								<Label>{t("admin.deliberations.form.class")}</Label>
								<Select
									value={singleClassId ?? ""}
									onValueChange={(v) => setSingleClassId(v || null)}
									disabled={!fields.academicYearId || classesQuery.isLoading}
								>
									<SelectTrigger>
										{classesQuery.isLoading ? (
											<span className="flex items-center gap-2 text-muted-foreground">
												<Loader2 className="h-3.5 w-3.5 animate-spin" />
												Chargement…
											</span>
										) : (
											<SelectValue
												placeholder={t(
													"admin.deliberations.form.classPlaceholder",
												)}
											/>
										)}
									</SelectTrigger>
									<SelectContent>
										{allClasses.map((cls) => (
											<SelectItem key={cls.id} value={cls.id}>
												{cls.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						) : (
							<CreateDeliberationClassPicker state={state} />
						)}

						<div className="flex items-center gap-3 rounded-lg border border-dashed p-3">
							<Switch
								id="quick-start"
								checked={fields.quickStart}
								onCheckedChange={(v) => patch({ quickStart: v })}
							/>
							<div>
								<label
									htmlFor="quick-start"
									className="cursor-pointer font-medium text-sm"
								>
									<Zap className="mr-1 inline h-3.5 w-3.5 text-yellow-500" />
									{t("admin.deliberations.form.quickStart", {
										defaultValue: "Démarrage rapide",
									})}
								</label>
								<p className="text-muted-foreground text-xs">
									{t("admin.deliberations.form.quickStartHint", {
										defaultValue:
											"Crée, ouvre et calcule les résultats en une seule étape",
									})}
								</p>
							</div>
						</div>
					</DialogBody>

					<DialogFooter>
						<Button variant="outline" onClick={close} disabled={batchRunning}>
							{t("common.actions.cancel")}
						</Button>
						{tab === "single" ? (
							<Button
								onClick={submitSingle}
								disabled={!singleCanSubmit || singlePending}
							>
								{singlePending && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								{fields.quickStart
									? t("admin.deliberations.form.quickStartSubmit", {
											defaultValue: "Créer et calculer",
										})
									: t("common.actions.create")}
							</Button>
						) : (
							<Button
								onClick={submitBatch}
								disabled={!multiCanSubmit || batchRunning}
							>
								{batchRunning ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<Users className="mr-2 h-4 w-4" />
								)}
								{batchRunning
									? t("admin.deliberations.form.batchCreating", {
											defaultValue: "Création en cours…",
										})
									: t("admin.deliberations.form.batchSubmit", {
											defaultValue: `Créer pour ${selectedClassIds.length || "…"} classe(s)`,
										})}
							</Button>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	},
	DIALOG_EXIT_MS,
);
