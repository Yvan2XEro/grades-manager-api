import { AlertCircle, ArrowUpDown, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { TeacherCourseSort } from "../types";

/** Search, "action required" filter and sort of the teacher home. */
export function TeacherCoursesToolbar({
	search,
	filterAction,
	actionCount,
	sortBy,
	onSearchChange,
	onFilterActionChange,
	onSortChange,
}: {
	search: string;
	filterAction: boolean;
	actionCount: number;
	sortBy: TeacherCourseSort;
	onSearchChange: (value: string) => void;
	onFilterActionChange: (value: boolean) => void;
	onSortChange: (value: TeacherCourseSort) => void;
}) {
	return (
		<div className="flex flex-wrap items-center gap-3">
			<div className="relative min-w-[200px] flex-1">
				<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
				<Input
					placeholder="Rechercher un cours ou une classe…"
					className="pl-9"
					value={search}
					onChange={(e) => onSearchChange(e.target.value)}
				/>
				{search && (
					<button
						type="button"
						onClick={() => onSearchChange("")}
						className="-translate-y-1/2 absolute top-1/2 right-3 text-muted-foreground transition-colors hover:text-foreground"
					>
						<X className="h-4 w-4" />
					</button>
				)}
			</div>

			<Button
				variant={filterAction ? "default" : "outline"}
				size="sm"
				onClick={() => onFilterActionChange(!filterAction)}
				className="shrink-0 gap-2"
			>
				<AlertCircle className="h-4 w-4" />
				Action requise
				{actionCount > 0 && (
					<span
						className={cn(
							"rounded-full px-1.5 py-0.5 font-bold text-xs",
							filterAction
								? "bg-white/20 text-white"
								: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
						)}
					>
						{actionCount}
					</span>
				)}
			</Button>

			<Select
				value={sortBy}
				onValueChange={(v) => onSortChange(v as TeacherCourseSort)}
			>
				<SelectTrigger className="h-9 w-auto shrink-0 gap-2 text-sm">
					<ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
					<SelectValue />
				</SelectTrigger>
				<SelectContent align="end">
					<SelectItem value="relevance">Pertinence</SelectItem>
					<SelectItem value="name">Nom A→Z</SelectItem>
					<SelectItem value="class">Classe</SelectItem>
				</SelectContent>
			</Select>
		</div>
	);
}
