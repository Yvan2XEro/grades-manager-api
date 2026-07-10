import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/utils/trpc";

export default function FeeStructureDetailsTab() {
	const { id } = useParams<{ id: string }>();
	const { t } = useTranslation();

	const { data: structure } = useQuery(
		trpc.feeClearance.getStructure.queryOptions({ id: id! }),
	);

	if (!structure) return null;

	const formatAmount = (v: string | null) =>
		v ? `${Number(v).toLocaleString()} ${structure.currency}` : "—";

	return (
		<div className="grid grid-cols-3 gap-4 rounded-lg border p-4 pt-6">
			<div>
				<p className="text-muted-foreground text-xs">
					{t("feeClearance.structures.fields.totalAmount")}
				</p>
				<p className="font-bold text-2xl">
					{formatAmount(structure.totalAmount)}
				</p>
			</div>
			<div>
				<p className="text-muted-foreground text-xs">
					{t("feeClearance.structures.fields.program")}
				</p>
				<p className="font-medium">{structure.program?.shortName ?? "—"}</p>
			</div>
			<div>
				<p className="text-muted-foreground text-xs">
					{t("feeClearance.structures.fields.isActive")}
				</p>
				<Badge variant={structure.isActive ? "default" : "secondary"}>
					{structure.isActive ? t("common.active") : t("common.inactive")}
				</Badge>
			</div>
		</div>
	);
}
