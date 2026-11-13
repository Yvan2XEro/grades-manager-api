import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { HubNav } from "@/components/navigation/HubNav";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";

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

export default function FeeStructureDetail() {
	const { id } = useParams<{ id: string }>();
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const { data: structure, isLoading } = useQuery(
		trpc.feeClearance.getStructure.queryOptions({ id: id! }),
	);

	const updateMut = useMutation({
		mutationFn: (data: { isActive?: boolean }) =>
			trpcClient.feeClearance.updateStructure.mutate({ id: id!, ...data }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.feeClearance.getStructure.queryKey({ id: id! }),
			});
			toast.success(t("common.saved"));
		},
	});

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
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="icon" asChild>
					<Link to="/admin/fee-clearance/structures">
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
			<HubNav tabs={TABS} basePath={`/admin/fee-clearance/structures/${id}`} />
		</div>
	);
}
