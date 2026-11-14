import {
	AlertTriangle,
	CheckCircle,
	RefreshCw,
	Search,
	Shield,
	ShieldOff,
	UserCheck,
	Users,
	XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { DataTable, type RowAction } from "@/components/data-table";
import { ListLayout } from "@/components/layouts/ListLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RetakeExamPicker } from "../components/retake-exam-picker";
import { RetakeOverrideDialog } from "../components/retake-override-dialog";
import {
	useRetakeEligibility,
	useRetakeExamSelection,
} from "../hooks/use-retake-eligibility";
import { getRetakeEligibilityColumns } from "../table/retake-eligibility-columns";
import type { EligibilityRow, OverrideDecision } from "../types";

type EligibilityTab = "eligible" | "ineligible";

export default function RetakeEligibilityPage() {
	const { t } = useTranslation();
	const selection = useRetakeExamSelection();
	const { examId, selectedExam } = selection;
	const [search, setSearch] = useState("");
	const [tab, setTab] = useState<EligibilityTab>("eligible");
	const {
		isLoading,
		isFeatureEnabled,
		items,
		eligible,
		ineligible,
		deleteOverride,
	} = useRetakeEligibility(examId, search);
	const columns = useMemo(() => getRetakeEligibilityColumns(t), [t]);

	const openOverride = (row: EligibilityRow, action: OverrideDecision) => {
		if (!examId) return;
		RetakeOverrideDialog.call({
			examId,
			studentCourseEnrollmentId: row.studentCourseEnrollmentId,
			studentName: row.studentName,
			action,
		});
	};

	const rowActions = (row: EligibilityRow): RowAction[] => {
		if (row.override) {
			return [
				{
					label: t("admin.retake.override.remove"),
					icon: RefreshCw,
					disabled: deleteOverride.isPending,
					onSelect: () =>
						examId &&
						deleteOverride.mutate({
							examId,
							studentCourseEnrollmentId: row.studentCourseEnrollmentId,
						}),
				},
			];
		}
		return row.status === "eligible"
			? [
					{
						label: t("admin.retake.override.forceIneligible"),
						icon: ShieldOff,
						destructive: true,
						onSelect: () => openOverride(row, "force_ineligible"),
					},
				]
			: [
					{
						label: t("admin.retake.override.forceEligible"),
						icon: Shield,
						onSelect: () => openOverride(row, "force_eligible"),
					},
				];
	};

	const showResults = Boolean(examId) && !isLoading && isFeatureEnabled;
	const showTabs = showResults && items.length > 0;
	const rows = tab === "eligible" ? eligible : ineligible;

	return (
		<ListLayout
			header={
				<PageHeader
					title={t("admin.retake.title")}
					description={t("admin.retake.subtitle")}
				/>
			}
			toolbar={
				<>
					<RetakeExamPicker selection={selection} />
					{showResults && (
						<div className="flex items-center justify-between">
							<div>
								<p className="font-semibold">{selectedExam?.name}</p>
								<p className="text-muted-foreground text-sm">
									{selectedExam?.className} • {selectedExam?.courseName}
								</p>
							</div>
							<div className="flex gap-4">
								<div className="flex items-center gap-2">
									<UserCheck className="h-5 w-5 text-green-600" />
									<span className="font-medium">
										{t("admin.retake.eligibleCount", {
											count: eligible.length,
										})}
									</span>
								</div>
								<div className="flex items-center gap-2">
									<Users className="h-5 w-5 text-muted-foreground" />
									<span className="font-medium">
										{t("admin.retake.ineligibleCount", {
											count: ineligible.length,
										})}
									</span>
								</div>
							</div>
						</div>
					)}
					{showTabs && (
						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<Tabs
								value={tab}
								onValueChange={(v) => setTab(v as EligibilityTab)}
							>
								<TabsList>
									<TabsTrigger value="eligible" className="gap-2">
										<CheckCircle className="h-4 w-4" />
										{t("admin.retake.eligible")} ({eligible.length})
									</TabsTrigger>
									<TabsTrigger value="ineligible" className="gap-2">
										<XCircle className="h-4 w-4" />
										{t("admin.retake.ineligible")} ({ineligible.length})
									</TabsTrigger>
								</TabsList>
							</Tabs>
							<div className="relative w-full sm:w-64">
								<Search className="-translate-y-1/2 absolute top-1/2 left-2.5 h-3.5 w-3.5 text-muted-foreground" />
								<Input
									placeholder="Nom ou n° d’inscription…"
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									className="h-8 pl-8 text-sm"
								/>
							</div>
						</div>
					)}
				</>
			}
		>
			{!examId ? (
				<p className="m-auto p-6 text-center text-muted-foreground text-sm">
					{t("admin.retake.selectExamPlaceholder")}
				</p>
			) : isLoading ? (
				<div className="flex h-48 items-center justify-center">
					<Spinner className="h-8 w-8" />
				</div>
			) : !isFeatureEnabled ? (
				<Alert variant="destructive" className="m-4 w-auto">
					<AlertTriangle className="h-4 w-4" />
					<AlertTitle>{t("admin.retake.featureDisabled")}</AlertTitle>
					<AlertDescription>
						{t("admin.retake.featureDisabled")}
					</AlertDescription>
				</Alert>
			) : items.length === 0 ? (
				<Empty className="m-4 border border-dashed">
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<Users className="h-8 w-8 text-muted-foreground" />
						</EmptyMedia>
						<EmptyTitle>{t("admin.retake.empty.title")}</EmptyTitle>
						<EmptyDescription>
							{t("admin.retake.empty.description")}
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent />
				</Empty>
			) : (
				<DataTable
					columns={columns}
					data={rows}
					rowActions={rowActions}
					empty={
						<p className="py-6 text-center text-muted-foreground text-sm">
							{t("admin.retake.empty.title")}
						</p>
					}
				/>
			)}
		</ListLayout>
	);
}
