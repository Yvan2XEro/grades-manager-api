import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";

export default function FeeGatingSettings() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const { data: rules, isLoading } = useQuery(
		trpc.feeClearance.listGatingRules.queryOptions(),
	);

	const toggleMut = useMutation({
		mutationFn: ({ gate, isEnabled }: { gate: string; isEnabled: boolean }) =>
			trpcClient.feeClearance.toggleGate.mutate({
				gate: gate as never,
				isEnabled,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.feeClearance.listGatingRules.queryKey(),
			});
			toast.success(t("common.saved"));
		},
	});

	return (
		<div className="space-y-4">
			<div>
				<h2 className="font-semibold text-xl">
					{t("feeClearance.gating.title")}
				</h2>
				<p className="text-muted-foreground text-sm">
					{t("feeClearance.gating.subtitle")}
				</p>
			</div>

			<div className="divide-y rounded-lg border">
				{isLoading
					? Array.from({ length: 5 }).map((_, i) => (
							<div key={i} className="flex items-center justify-between p-4">
								<Skeleton className="h-5 w-48" />
								<Skeleton className="h-6 w-10" />
							</div>
						))
					: rules?.map((rule) => (
							<div
								key={rule.gate}
								className="flex items-center justify-between p-4"
							>
								<div>
									<p className="font-medium">
										{t(`feeClearance.gating.gates.${rule.gate}`)}
									</p>
									<p className="text-muted-foreground text-xs">
										{rule.isEnabled
											? "Students must be cleared to perform this action"
											: "Gate disabled — all students have access"}
									</p>
								</div>
								<Switch
									checked={rule.isEnabled}
									onCheckedChange={(v) =>
										toggleMut.mutate({ gate: rule.gate, isEnabled: v })
									}
									disabled={toggleMut.isPending}
								/>
							</div>
						))}
			</div>
		</div>
	);
}
