import { useTranslation } from "react-i18next";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type {
	BulkDocumentKind,
	useBulkDocumentGeneration,
} from "../hooks/use-bulk-document-generation";

type State = ReturnType<typeof useBulkDocumentGeneration>;

/** Document kind, transcript period/semester, academic year and class. */
export function BulkDocumentFilters({ state }: { state: State }) {
	const { t } = useTranslation();
	const {
		kind,
		setKind,
		period,
		setPeriod,
		semesterId,
		setSemesterId,
		semesters,
		academicYearId,
		setAcademicYearId,
		academicYears,
		classId,
		setClassId,
		classes,
		classesLoading,
	} = state;
	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("admin.documents.bulk.filters.title")}</CardTitle>
				<CardDescription>
					{t("admin.documents.bulk.filters.description")}
				</CardDescription>
			</CardHeader>
			<CardContent className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
				<div className="space-y-1">
					<Label>{t("admin.documents.bulk.filters.type")}</Label>
					<Select
						value={kind}
						onValueChange={(v) => setKind(v as BulkDocumentKind)}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="transcript">
								{t("admin.documents.kinds.transcript.label")}
							</SelectItem>
							<SelectItem value="attestation">
								{t("admin.documents.kinds.attestation.label")}
							</SelectItem>
							<SelectItem value="diploma">
								{t("admin.documents.kinds.diploma.label")}
							</SelectItem>
						</SelectContent>
					</Select>
				</div>
				{kind === "transcript" && (
					<div className="space-y-1">
						<Label>{t("admin.documents.bulk.filters.period")}</Label>
						<Select
							value={period}
							onValueChange={(v) => setPeriod(v as "semester" | "annual")}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="annual">
									{t("admin.documents.bulk.filters.annual")}
								</SelectItem>
								<SelectItem value="semester">
									{t("admin.documents.bulk.filters.semester")}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				)}
				{kind === "transcript" && period === "semester" && (
					<div className="space-y-1">
						<Label>{t("admin.documents.bulk.filters.semesterLabel")}</Label>
						<Select
							value={semesterId || "__ANY__"}
							onValueChange={(v) => setSemesterId(v === "__ANY__" ? "" : v)}
						>
							<SelectTrigger>
								<SelectValue
									placeholder={t("admin.documents.bulk.filters.latest")}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__ANY__">
									{t("admin.documents.bulk.filters.latest")}
								</SelectItem>
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
					<Label>{t("admin.documents.bulk.filters.academicYear")}</Label>
					<Select
						value={academicYearId || "__ANY__"}
						onValueChange={(v) => {
							setAcademicYearId(v === "__ANY__" ? "" : v);
							setClassId("");
						}}
					>
						<SelectTrigger>
							<SelectValue
								placeholder={t("admin.documents.bulk.filters.allYears")}
							/>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="__ANY__">
								{t("admin.documents.bulk.filters.allYears")}
							</SelectItem>
							{(academicYears ?? []).map((y) => (
								<SelectItem key={y.id} value={y.id}>
									{y.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-1">
					<Label>{t("admin.documents.bulk.filters.class")}</Label>
					<Select
						value={classId}
						onValueChange={setClassId}
						disabled={classesLoading}
					>
						<SelectTrigger>
							<SelectValue
								placeholder={t("admin.documents.bulk.filters.classPlaceholder")}
							/>
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
	);
}
