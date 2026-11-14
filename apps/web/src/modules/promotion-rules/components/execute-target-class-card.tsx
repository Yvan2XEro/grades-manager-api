import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { QuickCreate } from "@/components/callable/quick-create";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface ExecuteTargetClassCardProps {
	classes: { id: string; name: string }[];
	sourceClassId: string;
	sourceClassName?: string;
	targetClassId: string;
	targetClassName?: string;
	onTargetClassChange: (id: string) => void;
	onCreateClass: () => Promise<void>;
}

/** Destination class select (with in-place creation) and the source → target flow. */
export function ExecuteTargetClassCard({
	classes,
	sourceClassId,
	sourceClassName,
	targetClassId,
	targetClassName,
	onTargetClassChange,
	onCreateClass,
}: ExecuteTargetClassCardProps) {
	const { t } = useTranslation();
	return (
		<Card className="border-0 shadow-sm">
			<CardHeader>
				<CardTitle>Select Target Class</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="space-y-2">
					<Label>Destination Class</Label>
					<QuickCreate
						onCreate={onCreateClass}
						label={t("admin.classes.actions.add")}
					>
						<Select value={targetClassId} onValueChange={onTargetClassChange}>
							<SelectTrigger>
								<SelectValue placeholder="Select the next class level" />
							</SelectTrigger>
							<SelectContent>
								{classes
									.filter((cls) => cls.id !== sourceClassId)
									.map((cls) => (
										<SelectItem key={cls.id} value={cls.id}>
											{cls.name}
										</SelectItem>
									))}
							</SelectContent>
						</Select>
					</QuickCreate>
					<p className="text-muted-foreground text-xs">
						Students will be enrolled in this class for the next academic year
					</p>
				</div>

				{targetClassId && (
					<div className="flex items-center justify-center gap-4 rounded-lg bg-muted p-6">
						<div className="text-center">
							<div className="font-semibold">{sourceClassName}</div>
							<Badge variant="outline" className="mt-1">
								Current
							</Badge>
						</div>
						<ArrowRight className="h-8 w-8 text-primary" />
						<div className="text-center">
							<div className="font-semibold">{targetClassName}</div>
							<Badge variant="default" className="mt-1">
								Target
							</Badge>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
