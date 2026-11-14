import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { HubLayout } from "@/components/layouts/ListLayout";
import { HubNav } from "@/components/navigation/HubNav";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
	useFeeStructure,
	useUpdateStructure,
} from "../../hooks/use-fee-structures";

const TABS = [
	{ path: "details", labelKey: "feeClearance.structures.tabs.details" },
	{
		path: "installments",
		labelKey: "feeClearance.structures.tabs.installments",
	},
	{ path: "impact", labelKey: "feeClearance.structures.tabs.impact" },
	{
		path: "assignments",
		labelKey: "feeClearance.structures.tabs.assignments",
	},
] as const;

export default function FeeStructureDetailLayout() {
	const { id } = useParams<{ id: string }>();
	const { t } = useTranslation();
	const { structure, isLoading } = useFeeStructure(id!);
	const updateMut = useUpdateStructure(id!);

	if (isLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-40 w-full" />
			</div>
		);
	}

	if (!structure) return null;

	return (
		<HubLayout>
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="icon" asChild>
					<Link to="/fee-clearance/structures">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div>
					<h2 className="font-semibold text-xl">{structure.name}</h2>
					<p className="text-muted-foreground text-sm">
						{structure.academicYear?.name}
					</p>
				</div>
				<div className="ml-auto flex items-center gap-3">
					<span className="text-sm">
						{t("feeClearance.structures.fields.isActive")}
					</span>
					<Switch
						checked={structure.isActive}
						onCheckedChange={(v) => updateMut.mutate({ isActive: v })}
					/>
				</div>
			</div>
			<HubNav tabs={TABS} basePath={`/fee-clearance/structures/${id}`} />
		</HubLayout>
	);
}
