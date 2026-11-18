import { Filter, Search } from "lucide-react";
import { startTransition } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
	itemStatusFilters,
	outcomeTabs,
	outcomeVariant,
	statusVariant,
} from "../services/transition-status";
import type { ItemStatus, TransitionItem, TransitionOutcome } from "../types";

interface TransitionItemsCardProps {
	items: TransitionItem[] | undefined;
	search: string;
	onSearchChange: (value: string) => void;
	itemStatus: ItemStatus | "all";
	onItemStatusChange: (value: ItemStatus | "all") => void;
	outcome: TransitionOutcome | "all";
	onOutcomeChange: (value: TransitionOutcome | "all") => void;
	onSelectItem: (item: TransitionItem) => void;
}

/** Students of a transition plan, filtered by outcome/status/search. */
export function TransitionItemsCard({
	items,
	search,
	onSearchChange,
	itemStatus,
	onItemStatusChange,
	outcome,
	onOutcomeChange,
	onSelectItem,
}: TransitionItemsCardProps) {
	const { t } = useTranslation();
	return (
		<Card className="rounded-lg">
			<CardHeader className="gap-4 border-b pb-4">
				<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
					<div>
						<CardTitle>
							{t("admin.academicYearTransitions.review.title")}
						</CardTitle>
						<CardDescription>
							{t("admin.academicYearTransitions.review.description")}
						</CardDescription>
					</div>
					<div className="flex min-w-0 flex-col gap-2 sm:flex-row">
						<div className="relative min-w-0 sm:w-72">
							<Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground" />
							<Input
								value={search}
								onChange={(event) =>
									startTransition(() => onSearchChange(event.target.value))
								}
								placeholder={t(
									"admin.academicYearTransitions.placeholders.search",
								)}
								className="pl-9"
							/>
						</div>
						<Select
							value={itemStatus}
							onValueChange={(value) =>
								onItemStatusChange(value as ItemStatus | "all")
							}
						>
							<SelectTrigger className="sm:w-44">
								<Filter className="size-4" />
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{itemStatusFilters.map((value) => (
									<SelectItem key={value} value={value}>
										{t(`admin.academicYearTransitions.itemStatus.${value}`)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
				<Tabs
					value={outcome}
					onValueChange={(value) =>
						onOutcomeChange(value as TransitionOutcome | "all")
					}
				>
					<TabsList className="flex h-auto flex-wrap justify-start">
						{outcomeTabs.map((value) => (
							<TabsTrigger key={value} value={value}>
								{t(`admin.academicYearTransitions.outcome.${value}`)}
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>
			</CardHeader>
			<CardContent className="px-0">
				<div className="max-h-[620px] overflow-auto">
					<Table>
						<TableHeader className="sticky top-0 z-10 bg-card">
							<TableRow>
								<TableHead>
									{t("admin.academicYearTransitions.table.student")}
								</TableHead>
								<TableHead>
									{t("admin.academicYearTransitions.table.decision")}
								</TableHead>
								<TableHead>
									{t("admin.academicYearTransitions.table.source")}
								</TableHead>
								<TableHead>
									{t("admin.academicYearTransitions.table.outcome")}
								</TableHead>
								<TableHead>
									{t("admin.academicYearTransitions.table.destination")}
								</TableHead>
								<TableHead>
									{t("admin.academicYearTransitions.table.status")}
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{items?.map((item) => (
								<TableRow
									key={item.id}
									className="cursor-pointer"
									onClick={() => onSelectItem(item)}
								>
									<TableCell>
										<div className="font-medium">
											{item.student.lastName} {item.student.firstName}
										</div>
										<div className="text-muted-foreground text-xs">
											{item.student.registrationNumber}
										</div>
									</TableCell>
									<TableCell>
										{item.decision
											? t(
													`admin.academicYearTransitions.decision.${item.decision}`,
												)
											: "-"}
									</TableCell>
									<TableCell>
										{item.sourceClass.code}
										<div className="text-muted-foreground text-xs">
											{item.sourceClass.name}
										</div>
									</TableCell>
									<TableCell>
										<Badge variant={outcomeVariant(item.finalOutcome)}>
											{t(
												`admin.academicYearTransitions.outcome.${item.finalOutcome}`,
											)}
										</Badge>
									</TableCell>
									<TableCell>
										{item.targetClass
											? `${item.targetClass.code} - ${item.targetClass.name}`
											: "-"}
									</TableCell>
									<TableCell>
										<Badge variant={statusVariant(item.status)}>
											{t(
												`admin.academicYearTransitions.itemStatus.${item.status}`,
											)}
										</Badge>
										{item.blockerCode && (
											<div className="mt-1 text-muted-foreground text-xs">
												{t(
													`admin.academicYearTransitions.blocker.${item.blockerCode}`,
													{ defaultValue: item.blockerCode },
												)}
											</div>
										)}
									</TableCell>
								</TableRow>
							))}
							{items?.length === 0 && (
								<TableRow>
									<TableCell
										colSpan={6}
										className="h-32 text-center text-muted-foreground"
									>
										{t("admin.academicYearTransitions.empty.noItems")}
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	);
}
