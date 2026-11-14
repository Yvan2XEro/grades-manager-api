import { AlertCircle, CheckCircle2, ExternalLink, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

import type { TransitionReadiness } from "../types";

/** Per-class readiness of a transition plan (signed deliberation, blocked students). */
export function TransitionReadinessCard({
	readiness,
	isLoading,
}: {
	readiness: TransitionReadiness | undefined;
	isLoading: boolean;
}) {
	const { t } = useTranslation();
	return (
		<Card className="rounded-lg">
			<CardHeader className="border-b pb-4">
				<CardTitle>
					{t("admin.academicYearTransitions.readiness.title")}
				</CardTitle>
				<CardDescription>
					{t("admin.academicYearTransitions.readiness.description")}
				</CardDescription>
				{readiness && (
					<div className="mt-2 flex flex-wrap gap-3">
						<span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm">
							<CheckCircle2 className="size-3.5 text-emerald-500" />
							{readiness.summary.readyClasses}/{readiness.summary.classCount}{" "}
							{t("admin.academicYearTransitions.readiness.classesReady")}
						</span>
						{readiness.summary.missingDeliberationCount > 0 && (
							<span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-amber-50 px-3 py-1 text-amber-700 text-sm dark:bg-amber-950/30 dark:text-amber-300">
								<AlertCircle className="size-3.5" />
								{readiness.summary.missingDeliberationCount}{" "}
								{t(
									"admin.academicYearTransitions.readiness.missingDeliberation",
								)}
							</span>
						)}
						{readiness.summary.blockedStudentCount > 0 && (
							<span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/50 bg-destructive/5 px-3 py-1 text-destructive text-sm">
								<XCircle className="size-3.5" />
								{readiness.summary.blockedStudentCount}{" "}
								{t("admin.academicYearTransitions.readiness.blockedStudents")}
							</span>
						)}
					</div>
				)}
			</CardHeader>
			<CardContent className="px-0">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>
								{t("admin.academicYearTransitions.readiness.class")}
							</TableHead>
							<TableHead>
								{t("admin.academicYearTransitions.readiness.deliberation")}
							</TableHead>
							<TableHead className="text-right">
								{t("admin.academicYearTransitions.readiness.ready")}
							</TableHead>
							<TableHead className="text-right">
								{t("admin.academicYearTransitions.readiness.blocked")}
							</TableHead>
							<TableHead className="text-right">
								{t("admin.academicYearTransitions.readiness.total")}
							</TableHead>
							<TableHead>
								{t("admin.academicYearTransitions.readiness.issues")}
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{readiness?.classes.map((cls) => (
							<TableRow key={cls.classId}>
								<TableCell>
									<span className="font-medium">{cls.classCode}</span>
									<div className="text-muted-foreground text-xs">
										{cls.className}
									</div>
								</TableCell>
								<TableCell>
									{cls.hasSignedDeliberation ? (
										<span className="flex items-center gap-1 text-emerald-600 text-sm">
											<CheckCircle2 className="size-3.5" />
											{t("admin.academicYearTransitions.readiness.signed")}
										</span>
									) : (
										<a
											href="/academic-results/deliberations"
											className="flex items-center gap-1 text-amber-600 text-sm hover:underline"
										>
											<AlertCircle className="size-3.5" />
											{t("admin.academicYearTransitions.readiness.missing")}
											<ExternalLink className="size-3" />
										</a>
									)}
								</TableCell>
								<TableCell className="text-right text-sm tabular-nums">
									{cls.studentCounts.ready + cls.studentCounts.succeeded}
								</TableCell>
								<TableCell className="text-right text-sm tabular-nums">
									{cls.studentCounts.blocked > 0 ? (
										<span className="font-medium text-destructive">
											{cls.studentCounts.blocked}
										</span>
									) : (
										cls.studentCounts.blocked
									)}
								</TableCell>
								<TableCell className="text-right text-sm tabular-nums">
									{cls.studentCounts.total}
								</TableCell>
								<TableCell>
									<div className="flex flex-wrap gap-1">
										{cls.blockerCodes.map((code) => (
											<Badge key={code} variant="outline" className="text-xs">
												{t(`admin.academicYearTransitions.blocker.${code}`, {
													defaultValue: code,
												})}
											</Badge>
										))}
									</div>
								</TableCell>
							</TableRow>
						))}
						{isLoading && (
							<TableRow>
								<TableCell
									colSpan={6}
									className="h-24 text-center text-muted-foreground"
								>
									{t("common.loading")}
								</TableCell>
							</TableRow>
						)}
						{!isLoading && readiness?.classes.length === 0 && (
							<TableRow>
								<TableCell
									colSpan={6}
									className="h-24 text-center text-muted-foreground"
								>
									{t("admin.academicYearTransitions.readiness.empty")}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}
