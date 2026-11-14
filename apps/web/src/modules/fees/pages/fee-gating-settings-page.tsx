import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useGatingRules, useToggleGate } from "../hooks/use-gating-rules";

export default function FeeGatingSettingsPage() {
	const { t } = useTranslation();
	const { data: rules, isLoading } = useGatingRules();
	const toggleMut = useToggleGate();

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
