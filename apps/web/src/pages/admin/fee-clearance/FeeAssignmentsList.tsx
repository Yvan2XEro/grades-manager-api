import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CheckCircle2, Clock, Search, Users, XCircle } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";

const statusVariants: Record<
	string,
	"default" | "secondary" | "destructive" | "outline"
> = {
	unpaid: "destructive",
	partial: "outline",
	paid: "default",
	exempt: "secondary",
};

const statusIcons: Record<string, React.ReactNode> = {
	paid: <CheckCircle2 className="mr-1 h-3 w-3" />,
	partial: <Clock className="mr-1 h-3 w-3" />,
	unpaid: <XCircle className="mr-1 h-3 w-3" />,
	exempt: <CheckCircle2 className="mr-1 h-3 w-3" />,
};

export default function FeeAssignmentsList() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const [yearFilter, setYearFilter] = useState("");
	const [classFilter, setClassFilter] = useState("");
	const [statusFilter, setStatusFilter] = useState("");
	const [search, setSearch] = useState("");
	const [showBulkAssign, setShowBulkAssign] = useState(false);

	const { data: years } = useQuery(trpc.academicYears.list.queryOptions());
	const { data: classes } = useQuery(
		trpc.classes.list.queryOptions(
			yearFilter ? { academicYearId: yearFilter } : {},
		),
	);

	const { data, isLoading } = useQuery(
		trpc.feeClearance.listAssignments.queryOptions({
			academicYearId: yearFilter || undefined,
			classId: classFilter || undefined,
			status: statusFilter ? [statusFilter] : undefined,
			search: search || undefined,
			limit: 200,
			offset: 0,
		}),
	);

	// Compute status counts from current result set
	const statusCounts = (data?.items ?? []).reduce(
		(acc, a) => {
			acc[a.status] = (acc[a.status] ?? 0) + 1;
			return acc;
		},
		{} as Record<string, number>,
	);

	const formatAmount = (amount: string | null, currency: string) =>
		amount ? `${Number(amount).toLocaleString()} ${currency}` : "—";

	const getStudentName = (assignment: {
		student?: {
			profile?: { firstName: string; lastName: string } | null;
		} | null;
	}) => {
		const p = assignment.student?.profile;
		return p ? `${p.firstName} ${p.lastName}` : "—";
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-semibold text-xl">
						{t("feeClearance.assignments.title")}
					</h2>
					<p className="text-muted-foreground text-sm">
						{t("feeClearance.assignments.subtitle")}
					</p>
				</div>
				<Button variant="outline" onClick={() => setShowBulkAssign(true)}>
					<Users className="mr-2 h-4 w-4" />
					{t("feeClearance.assignments.bulkAssign")}
				</Button>
			</div>

			{/* Summary stats */}
			{data && (
				<div className="grid grid-cols-4 gap-3">
					{(["unpaid", "partial", "paid", "exempt"] as const).map((s) => (
						<button
							key={s}
							type="button"
							onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
							className={`rounded-lg border p-3 text-left transition-colors ${
								statusFilter === s
									? "border-primary bg-primary/5"
									: "hover:bg-muted/50"
							}`}
						>
							<div className="flex items-center gap-1">
								<Badge variant={statusVariants[s]}>
									{statusIcons[s]}
									{t(`feeClearance.assignments.status.${s}`)}
								</Badge>
							</div>
							<p className="mt-1 font-bold text-xl">{statusCounts[s] ?? 0}</p>
						</button>
					))}
				</div>
			)}

			{/* Filters */}
			<div className="flex flex-wrap gap-2">
				<div className="relative max-w-xs flex-1">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						className="pl-9"
						placeholder={t("common.search")}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</div>
				<Select
					value={yearFilter}
					onValueChange={(v) => {
						setYearFilter(v);
						setClassFilter("");
					}}
				>
					<SelectTrigger className="w-48">
						<SelectValue
							placeholder={t("feeClearance.structures.fields.academicYear")}
						/>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="">{t("common.all")}</SelectItem>
						{years?.map((y) => (
							<SelectItem key={y.id} value={y.id}>
								{y.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{classes && classes.length > 0 && (
					<Select value={classFilter} onValueChange={setClassFilter}>
						<SelectTrigger className="w-44">
							<SelectValue
								placeholder={t("feeClearance.assignments.fields.class")}
							/>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="">{t("common.all")}</SelectItem>
							{classes.map((c) => (
								<SelectItem key={c.id} value={c.id}>
									{c.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}
				<Select value={statusFilter} onValueChange={setStatusFilter}>
					<SelectTrigger className="w-36">
						<SelectValue
							placeholder={t("feeClearance.assignments.fields.status")}
						/>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="">{t("common.all")}</SelectItem>
						{["unpaid", "partial", "paid", "exempt"].map((s) => (
							<SelectItem key={s} value={s}>
								{t(`feeClearance.assignments.status.${s}`)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{isLoading ? (
				<TableSkeleton columns={6} rows={5} />
			) : !data?.items?.length ? (
				<Empty>
					<EmptyMedia />
					<EmptyHeader>
						<EmptyTitle>{t("feeClearance.assignments.empty.title")}</EmptyTitle>
						<EmptyDescription>
							{t("feeClearance.assignments.empty.description")}
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>
								{t("feeClearance.assignments.fields.student")}
							</TableHead>
							<TableHead>
								{t("feeClearance.structures.fields.academicYear")}
							</TableHead>
							<TableHead>
								{t("feeClearance.assignments.fields.effectiveAmount")}
							</TableHead>
							<TableHead>
								{t("feeClearance.assignments.fields.status")}
							</TableHead>
							<TableHead>
								{t("feeClearance.assignments.fields.clearedAt")}
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{data.items.map((a) => (
							<TableRow
								key={a.id}
								className="cursor-pointer"
								onClick={() =>
									navigate(`/admin/fee-clearance/assignments/${a.id}`)
								}
							>
								<TableCell className="font-medium">
									{getStudentName(a)}
								</TableCell>
								<TableCell>{a.academicYear?.name ?? "—"}</TableCell>
								<TableCell>
									{formatAmount(a.effectiveAmount, a.currency)}
								</TableCell>
								<TableCell>
									<Badge variant={statusVariants[a.status]}>
										{statusIcons[a.status]}
										{t(`feeClearance.assignments.status.${a.status}`)}
									</Badge>
								</TableCell>
								<TableCell>
									{a.clearedAt
										? format(new Date(a.clearedAt), "dd/MM/yyyy")
										: "—"}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}

			{data && (
				<p className="text-muted-foreground text-sm">
					{data.items.length} / {data.total}
				</p>
			)}

			<BulkAssignDialog
				open={showBulkAssign}
				onOpenChange={setShowBulkAssign}
				years={years ?? []}
				onDone={() => {
					queryClient.invalidateQueries({
						queryKey: trpc.feeClearance.listAssignments.queryKey(),
					});
					setShowBulkAssign(false);
				}}
			/>
		</div>
	);
}

function BulkAssignDialog({
	open,
	onOpenChange,
	years,
	onDone,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	years: Array<{ id: string; name: string }>;
	onDone: () => void;
}) {
	const { t } = useTranslation();
	const [yearId, setYearId] = useState("");
	const [structureId, setStructureId] = useState("");
	const [classId, setClassId] = useState("");

	const { data: structures } = useQuery(
		trpc.feeClearance.listStructures.queryOptions({
			academicYearId: yearId || undefined,
			isActive: true,
		}),
	);
	const { data: classes } = useQuery(
		trpc.classes.list.queryOptions({ academicYear: yearId || undefined }),
	);

	const mut = useMutation({
		mutationFn: () =>
			trpcClient.feeClearance.bulkAssignClass.mutate({
				classId,
				feeStructureId: structureId,
				skipExisting: true,
			}),
		onSuccess: (result) => {
			toast.success(`${result.assigned} assigned, ${result.skipped} skipped`);
			onDone();
		},
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("feeClearance.assignments.bulkAssign")}</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<div>
						<Label>{t("feeClearance.structures.fields.academicYear")}</Label>
						<Select
							value={yearId}
							onValueChange={(v) => {
								setYearId(v);
								setStructureId("");
								setClassId("");
							}}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{years.map((y) => (
									<SelectItem key={y.id} value={y.id}>
										{y.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div>
						<Label>{t("feeClearance.assignments.fields.structure")}</Label>
						<Select
							value={structureId}
							onValueChange={setStructureId}
							disabled={!yearId}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{structures?.map((s) => (
									<SelectItem key={s.id} value={s.id}>
										{s.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div>
						<Label>{t("admin.classes.title")}</Label>
						<Select
							value={classId}
							onValueChange={setClassId}
							disabled={!yearId}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{classes?.items?.map((c) => (
									<SelectItem key={c.id} value={c.id}>
										{c.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{t("common.cancel")}
					</Button>
					<Button
						disabled={!structureId || !classId || mut.isPending}
						onClick={() => mut.mutate()}
					>
						{t("feeClearance.assignments.bulkAssign")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
