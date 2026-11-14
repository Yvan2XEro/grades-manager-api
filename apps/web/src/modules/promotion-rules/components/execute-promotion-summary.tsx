import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ExecutePromotionSummaryProps {
	ruleName?: string;
	ruleDescription?: string | null;
	sourceClassName?: string;
	studentCount: number;
}

/** Rule, source class and number of students of the promotion to execute. */
export function ExecutePromotionSummary({
	ruleName,
	ruleDescription,
	sourceClassName,
	studentCount,
}: ExecutePromotionSummaryProps) {
	return (
		<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
			<Card className="border-0 shadow-sm">
				<CardHeader>
					<CardTitle className="font-medium text-muted-foreground text-sm">
						Rule
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="font-semibold text-foreground">{ruleName}</div>
					<p className="mt-1 text-muted-foreground text-sm">
						{ruleDescription}
					</p>
				</CardContent>
			</Card>

			<Card className="border-0 shadow-sm">
				<CardHeader>
					<CardTitle className="font-medium text-muted-foreground text-sm">
						Source Class
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="font-semibold text-foreground">{sourceClassName}</div>
					<Badge variant="secondary" className="mt-2">
						{studentCount} students selected
					</Badge>
				</CardContent>
			</Card>

			<Card className="border-primary/20 bg-primary/5 shadow-sm">
				<CardHeader>
					<CardTitle className="font-medium text-muted-foreground text-sm">
						Students to Promote
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="font-bold text-3xl text-primary">{studentCount}</div>
				</CardContent>
			</Card>
		</div>
	);
}
