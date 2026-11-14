import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { GradeSpreadsheetGrid } from "../components/grade-spreadsheet-grid";
import { SpreadsheetHeader } from "../components/spreadsheet-header";
import { useSpreadsheetCells } from "../hooks/use-spreadsheet-cells";
import { useSpreadsheetData } from "../hooks/use-spreadsheet-data";

/** Fast grade entry: every exam of a class course in one auto-saving grid. */
export default function GradeSpreadsheet() {
	const { courseId } = useParams<{ courseId: string }>();
	const navigate = useNavigate();
	const { t } = useTranslation();

	const [search, setSearch] = useState("");
	const debouncedSearch = useDebounce(search, 200);

	const { courseInfo, students, exams, grades, isLoading } =
		useSpreadsheetData(courseId);
	const cells = useSpreadsheetCells(grades);
	const { values, states } = cells;

	const filteredStudents = useMemo(() => {
		const all = students ?? [];
		const q = debouncedSearch.trim().toLowerCase();
		if (!q) return all;
		return all.filter((s) =>
			`${s.firstName} ${s.lastName} ${s.registrationNumber}`
				.toLowerCase()
				.includes(q),
		);
	}, [students, debouncedSearch]);

	if (!courseId) {
		return (
			<Card>
				<CardContent className="py-10 text-center text-muted-foreground text-sm">
					{t("teacher.spreadsheet.noCourse", {
						defaultValue: "Aucun cours sélectionné",
					})}
				</CardContent>
			</Card>
		);
	}

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Spinner className="h-10 w-10 text-primary" />
			</div>
		);
	}

	// Counters for the header
	const totalCells = filteredStudents.length * exams.length;
	const filledCells = Object.entries(values).filter(([k, v]) => {
		const [sId, eId] = k.split("::");
		return (
			v.trim() !== "" &&
			filteredStudents.some((s) => s.id === sId) &&
			exams.some((ex) => ex.id === eId)
		);
	}).length;
	const dirtyCount = Object.values(states).filter(
		(s) => s === "dirty" || s === "saving",
	).length;
	const errorCount = Object.values(states).filter((s) => s === "error").length;

	return (
		<div className="space-y-4">
			<SpreadsheetHeader
				courseInfo={courseInfo}
				filledCells={filledCells}
				totalCells={totalCells}
				dirtyCount={dirtyCount}
				errorCount={errorCount}
				onPerExamMode={() => navigate(`/grades/${courseId}`)}
			/>

			{/* Search */}
			<Card>
				<CardContent className="py-3">
					<div className="relative max-w-md">
						<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder={t("teacher.spreadsheet.searchStudent", {
								defaultValue: "Rechercher un étudiant…",
							})}
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-9"
						/>
					</div>
				</CardContent>
			</Card>

			{/* Spreadsheet */}
			{!exams.length ? (
				<Card>
					<CardContent className="py-10 text-center text-muted-foreground text-sm">
						{t("teacher.spreadsheet.noExams", {
							defaultValue: "Aucun examen pour ce cours. Créez-en un d'abord.",
						})}
					</CardContent>
				</Card>
			) : !filteredStudents.length ? (
				<Card>
					<CardContent className="py-10 text-center text-muted-foreground text-sm">
						{t("teacher.spreadsheet.noStudents", {
							defaultValue: "Aucun étudiant ne correspond à la recherche.",
						})}
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-base">
							{t("teacher.spreadsheet.legend.title", {
								defaultValue: "Saisie rapide — auto-enregistrement",
							})}
						</CardTitle>
						<CardDescription className="text-xs">
							{t("teacher.spreadsheet.legend.hint", {
								defaultValue:
									"Tab/Entrée/flèches pour naviguer. Vide une cellule pour supprimer la note. Sauvegarde automatique au blur.",
							})}
						</CardDescription>
					</CardHeader>
					<CardContent className="overflow-x-auto p-0">
						<GradeSpreadsheetGrid
							students={filteredStudents}
							exams={exams}
							cells={cells}
						/>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
