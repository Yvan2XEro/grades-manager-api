import { GraduationCap, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { QuickCreate } from "@/components/callable/quick-create";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { ApplicationReview } from "../hooks/use-application-review";
import type { ApplicationDetail } from "../types";

/**
 * Turns an accepted application into a student: explains what happens, then
 * asks for the class (required) and an optional registration number.
 */
export function ConvertApplicationSection({
	app,
	review: {
		classes,
		targetClassId,
		setTargetClassId,
		registrationNumber,
		setRegistrationNumber,
		createClass: onCreateClass,
		convert,
	},
}: {
	app: ApplicationDetail;
	review: ApplicationReview;
}) {
	const { t } = useTranslation();
	const isPending = convert.isPending;
	const noClasses = classes.length === 0;
	const canConvert = !noClasses && !!targetClassId;

	return (
		<div className="space-y-4">
			{/* What will happen */}
			<Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30">
				<CardHeader className="pb-2">
					<CardTitle className="flex items-center gap-2 text-base text-emerald-800 dark:text-emerald-300">
						<GraduationCap className="size-5" />
						{t("admissions.admin.convertTitle")}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 text-emerald-800 text-sm dark:text-emerald-300">
					<p className="font-medium">{t("admissions.admin.convertExplain")}</p>
					<ul className="ml-4 list-disc space-y-1 text-emerald-700 dark:text-emerald-400">
						<li>
							{t("admissions.admin.convertStep1")} — {app.applicant.lastName}{" "}
							{app.applicant.firstName}
						</li>
						<li>{t("admissions.admin.convertStep2")}</li>
						<li>
							{t("admissions.admin.convertStep3")} — {app.program.name},{" "}
							{app.academicYear.name}
						</li>
					</ul>
					<p className="mt-2 text-emerald-600 text-xs dark:text-emerald-500">
						{t("admissions.admin.convertIrreversible")}
					</p>
				</CardContent>
			</Card>

			{/* Class picker */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-base">
						{t("admissions.admin.assignClass")}
					</CardTitle>
					<p className="text-muted-foreground text-sm">
						{t("admissions.admin.assignClassHint")}
					</p>
				</CardHeader>
				<CardContent className="space-y-4">
					{noClasses ? (
						<div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
							<p className="font-medium text-amber-800 text-sm dark:text-amber-300">
								{t("admissions.admin.noClassesWarning")}
							</p>
							<p className="mt-1 text-amber-700 text-xs dark:text-amber-400">
								{t("admissions.admin.noClassesHint")}
							</p>
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="mt-3"
								onClick={onCreateClass}
							>
								<Plus className="mr-2 size-4" />
								{t("admin.classes.actions.add")}
							</Button>
						</div>
					) : (
						<div className="space-y-1.5">
							<Label>
								{t("admissions.fields.class")}{" "}
								<span className="text-destructive">*</span>
							</Label>
							<QuickCreate
								onCreate={onCreateClass}
								label={t("admin.classes.actions.add")}
							>
								<Select value={targetClassId} onValueChange={setTargetClassId}>
									<SelectTrigger
										className={!targetClassId ? "border-amber-400" : ""}
									>
										<SelectValue
											placeholder={t("admissions.admin.selectClass")}
										/>
									</SelectTrigger>
									<SelectContent>
										{classes.map((k) => (
											<SelectItem key={k.id} value={k.id}>
												<span className="font-medium">{k.name}</span>
												<span className="ml-2 text-muted-foreground text-xs">
													({k.code})
												</span>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</QuickCreate>
						</div>
					)}

					<div className="space-y-1.5">
						<Label>{t("admissions.admin.registrationNumber")}</Label>
						<Input
							value={registrationNumber}
							onChange={(e) => setRegistrationNumber(e.target.value)}
							placeholder={t("admissions.admin.autoRegistration")}
						/>
						<p className="text-muted-foreground text-xs">
							{t("admissions.admin.registrationHint")}
						</p>
					</div>

					<Button
						onClick={() => convert.mutate()}
						disabled={isPending || !canConvert}
						className="w-full sm:w-auto"
					>
						<GraduationCap className="mr-2 size-4" />
						{isPending
							? t("admissions.admin.converting")
							: t("admissions.admin.convert")}
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
