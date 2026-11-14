import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { GuardianRow } from "../types";
import { GuardianStudentLinks } from "./guardian-student-links";

/**
 * Guardians with their linked students; clicking a row expands its student
 * links. Hand-written because of the expandable rows.
 */
export function GuardiansTable({
	guardians,
	renderActions,
}: {
	guardians: GuardianRow[];
	renderActions: (guardian: GuardianRow) => React.ReactNode;
}) {
	const { t } = useTranslation();
	const [expandedId, setExpandedId] = useState<string | null>(null);

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className="w-8" />
					<TableHead>{t("guardians.fields.firstName")}</TableHead>
					<TableHead>{t("guardians.fields.email")}</TableHead>
					<TableHead>
						{t("guardians.admin.linkedStudents", {
							defaultValue: "Linked to",
						})}
					</TableHead>
					<TableHead>{t("guardians.fields.relationshipType")}</TableHead>
					<TableHead className="w-10" />
				</TableRow>
			</TableHeader>
			<TableBody>
				{guardians.length === 0 ? (
					<TableRow>
						<TableCell
							colSpan={6}
							className="py-12 text-center text-muted-foreground"
						>
							{t("guardians.admin.empty")}
						</TableCell>
					</TableRow>
				) : (
					guardians.flatMap((g) => {
						const expanded = expandedId === g.id;
						const linkCount = g.studentLinks.length;
						const relationships = [
							...new Set(g.studentLinks.map((l) => l.relationshipType)),
						];
						return [
							<TableRow
								key={g.id}
								className="cursor-pointer"
								onClick={() => setExpandedId(expanded ? null : g.id)}
							>
								<TableCell>
									{linkCount > 0 &&
										(expanded ? (
											<ChevronDown className="h-4 w-4 text-muted-foreground" />
										) : (
											<ChevronRight className="h-4 w-4 text-muted-foreground" />
										))}
								</TableCell>
								<TableCell className="font-medium">
									{g.firstName} {g.lastName}
								</TableCell>
								<TableCell className="text-muted-foreground text-sm">
									{g.email}
								</TableCell>
								<TableCell>
									{linkCount === 0 ? (
										<span className="text-muted-foreground text-sm">—</span>
									) : (
										<Badge variant="secondary">
											{linkCount}{" "}
											{linkCount === 1
												? t("guardians.admin.student", {
														defaultValue: "student",
													})
												: t("guardians.admin.students")}
										</Badge>
									)}
								</TableCell>
								<TableCell>
									<div className="flex flex-wrap gap-1">
										{relationships.map((r) => (
											<Badge key={r} variant="outline">
												{t(`guardians.relationships.${r}`)}
											</Badge>
										))}
									</div>
								</TableCell>
								<TableCell onClick={(e) => e.stopPropagation()}>
									{renderActions(g)}
								</TableCell>
							</TableRow>,
							...(expanded
								? [
										<TableRow key={`${g.id}-expanded`} className="bg-muted/30">
											<TableCell />
											<TableCell colSpan={5}>
												<GuardianStudentLinks guardian={g} />
											</TableCell>
										</TableRow>,
									]
								: []),
						];
					})
				)}
			</TableBody>
		</Table>
	);
}
