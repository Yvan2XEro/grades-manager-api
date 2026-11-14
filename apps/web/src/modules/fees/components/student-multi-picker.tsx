import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStudentSearch } from "../hooks/use-fee-options";

/** Search box + checkbox list to pick several students. */
export function StudentMultiPicker({
	search,
	onSearchChange,
	selectedIds,
	onSelectedIdsChange,
}: {
	search: string;
	onSearchChange: (value: string) => void;
	selectedIds: string[];
	onSelectedIdsChange: (update: (ids: string[]) => string[]) => void;
}) {
	const { t } = useTranslation();
	const { data: results } = useStudentSearch(search, 20);

	return (
		<div className="space-y-2">
			<Label>{t("feeClearance.assignments.assignStudentTitle")}</Label>
			<Input
				placeholder={t("common.search")}
				value={search}
				onChange={(e) => onSearchChange(e.target.value)}
			/>
			{results?.items && results.items.length > 0 && (
				<div className="max-h-40 overflow-y-auto rounded border text-sm">
					{results.items.map((s) => {
						const name =
							`${s.profile?.firstName ?? ""} ${s.profile?.lastName ?? ""}`.trim();
						const checked = selectedIds.includes(s.id);
						return (
							<label
								key={s.id}
								className="flex cursor-pointer items-center gap-2 px-3 py-1.5 hover:bg-muted/50"
							>
								<input
									type="checkbox"
									className="h-4 w-4 rounded border"
									checked={checked}
									onChange={(e) =>
										onSelectedIdsChange((ids) =>
											e.target.checked
												? [...ids, s.id]
												: ids.filter((x) => x !== s.id),
										)
									}
								/>
								<span>{name || s.registrationNumber}</span>
							</label>
						);
					})}
				</div>
			)}
			{selectedIds.length > 0 && (
				<p className="text-muted-foreground text-xs">
					{selectedIds.length} {t("feeClearance.assignments.fields.student")}(s)
					sélectionné(s)
				</p>
			)}
		</div>
	);
}
