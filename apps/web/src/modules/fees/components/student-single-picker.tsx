import { X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStudentSearch } from "../hooks/use-fee-options";

export type PickedStudent = { id: string; name: string };

/** Search box to pick one student (by name or registration number). */
export function StudentSinglePicker({
	value,
	onChange,
}: {
	value: PickedStudent | null;
	onChange: (student: PickedStudent | null) => void;
}) {
	const { t } = useTranslation();
	const [search, setSearch] = useState("");
	const { data } = useStudentSearch(search, 15, !value);
	const results = data?.items ?? [];

	return (
		<div className="space-y-2">
			<Label>{t("feeClearance.assignments.fields.student")}</Label>
			{value ? (
				<p className="flex items-center justify-between rounded bg-muted px-2 py-1.5 text-sm">
					<span className="font-medium">{value.name}</span>
					<button
						type="button"
						aria-label={t("common.clear")}
						className="text-muted-foreground hover:text-destructive"
						onClick={() => {
							onChange(null);
							setSearch("");
						}}
					>
						<X className="h-4 w-4" />
					</button>
				</p>
			) : (
				<>
					<Input
						autoFocus
						placeholder={t("feeClearance.payments.searchStudent")}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
					{results.length > 0 && (
						<div className="max-h-48 overflow-y-auto rounded border text-sm">
							{results.map((s) => {
								const name =
									`${s.profile?.firstName ?? ""} ${s.profile?.lastName ?? ""}`.trim() ||
									s.registrationNumber;
								return (
									<button
										key={s.id}
										type="button"
										className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-muted/50"
										onClick={() => onChange({ id: s.id, name })}
									>
										<span>{name}</span>
										<span className="ml-auto text-muted-foreground text-xs">
											{s.registrationNumber}
										</span>
									</button>
								);
							})}
						</div>
					)}
				</>
			)}
		</div>
	);
}
