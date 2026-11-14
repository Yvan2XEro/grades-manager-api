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
import {
	type BulkDocumentKind,
	KIND_LABELS,
	type useBulkDocumentGeneration,
} from "../hooks/use-bulk-document-generation";

type State = ReturnType<typeof useBulkDocumentGeneration>;

/** Document kind, transcript period/semester, academic year and class. */
export function BulkDocumentFilters({ state }: { state: State }) {
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
						onValueChange={(v) => setKind(v as BulkDocumentKind)}
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
	);
}
