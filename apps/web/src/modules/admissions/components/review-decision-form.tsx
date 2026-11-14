import { CheckCircle2, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ApplicationReview } from "../hooks/use-application-review";

/**
 * Decision notes and the under review / accept / waitlist / reject buttons
 * (reject requires notes). `compact` is the drawer variant.
 */
export function ReviewDecisionForm({
	status,
	review: { decisionNotes, setDecisionNotes, setUnderReview, review },
	compact,
}: {
	status: string;
	review: ApplicationReview;
	compact?: boolean;
}) {
	const { t } = useTranslation();
	const size = compact ? "sm" : "default";
	const icon = compact ? "mr-1.5 size-3.5" : "mr-2 size-4";
	return (
		<>
			<Textarea
				rows={compact ? 3 : 4}
				value={decisionNotes}
				onChange={(e) => setDecisionNotes(e.target.value)}
				placeholder={t("admissions.admin.reviewNotes")}
			/>
			<div className={cn("flex flex-wrap", compact ? "mt-3 gap-2" : "gap-3")}>
				{status === "submitted" && (
					<Button
						variant="outline"
						size={size}
						onClick={() => setUnderReview.mutate()}
						disabled={setUnderReview.isPending}
					>
						{t("admissions.admin.markUnderReview")}
					</Button>
				)}
				<Button
					size={size}
					onClick={() => review.mutate("accepted")}
					disabled={review.isPending}
				>
					<CheckCircle2 className={icon} />
					{t("admissions.admin.accept")}
				</Button>
				<Button
					variant="outline"
					size={size}
					onClick={() => review.mutate("waitlisted")}
					disabled={review.isPending}
				>
					{t("admissions.admin.waitlist")}
				</Button>
				<Button
					variant="destructive"
					size={size}
					onClick={() => review.mutate("rejected")}
					disabled={review.isPending || !decisionNotes.trim()}
				>
					<XCircle className={icon} />
					{t("admissions.admin.reject")}
				</Button>
			</div>
		</>
	);
}
