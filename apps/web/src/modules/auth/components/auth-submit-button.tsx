import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Full-width submit button with a spinner while submitting. */
export function AuthSubmitButton({
	isSubmitting,
	label,
	submittingLabel,
}: {
	isSubmitting: boolean;
	label: string;
	submittingLabel: string;
}) {
	return (
		<Button
			type="submit"
			disabled={isSubmitting}
			className="h-11 w-full font-semibold"
		>
			{isSubmitting ? (
				<>
					<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					{submittingLabel}
				</>
			) : (
				label
			)}
		</Button>
	);
}
