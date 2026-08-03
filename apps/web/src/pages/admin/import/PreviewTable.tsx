import { useTranslation } from "react-i18next";

type PreviewRow = { row: number; col?: string; message: string };

interface Props {
	rows: PreviewRow[];
	label: string;
	variant?: "error" | "warning";
}

export function PreviewTable({ rows, label, variant = "error" }: Props) {
	const { t } = useTranslation();
	if (rows.length === 0) return null;
	const color =
		variant === "error"
			? "text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950 dark:border-red-800"
			: "text-yellow-800 bg-yellow-50 border-yellow-200 dark:text-yellow-300 dark:bg-yellow-950 dark:border-yellow-800";

	return (
		<div className={`rounded-md border p-3 ${color}`}>
			<p className="mb-2 font-medium text-sm">{label}</p>
			<div className="overflow-x-auto">
				<table className="w-full text-xs">
					<thead>
						<tr className="border-current/20 border-b">
							<th className="pr-4 pb-1 text-left font-medium">
								{t("admin.dataImport.preview.row")}
							</th>
							<th className="pr-4 pb-1 text-left font-medium">
								{t("admin.dataImport.preview.column")}
							</th>
							<th className="pb-1 text-left font-medium">
								{t("admin.dataImport.preview.message")}
							</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((r, i) => (
							<tr key={i} className="border-current/10 border-b">
								<td className="py-0.5 pr-4">{r.row}</td>
								<td className="py-0.5 pr-4">{r.col ?? "—"}</td>
								<td className="py-0.5">{r.message}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
