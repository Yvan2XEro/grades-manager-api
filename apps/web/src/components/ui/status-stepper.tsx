import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
	key: string;
	label: string;
}

interface StatusStepperProps {
	steps: Step[];
	currentStatus: string;
	rejectedStatus?: string;
	className?: string;
}

export function StatusStepper({
	steps,
	currentStatus,
	rejectedStatus,
	className,
}: StatusStepperProps) {
	const currentIndex = steps.findIndex((s) => s.key === currentStatus);
	const isRejected = rejectedStatus && currentStatus === rejectedStatus;

	return (
		<div className={cn("flex items-center gap-0", className)}>
			{steps.map((step, i) => {
				const isPast = i < currentIndex;
				const isCurrent = i === currentIndex;
				const isFuture = i > currentIndex;

				return (
					<div key={step.key} className="flex items-center">
						<div className="flex flex-col items-center gap-1">
							<div
								className={cn(
									"flex h-6 w-6 items-center justify-center rounded-full border-2 font-semibold text-xs transition-colors",
									isPast && "border-primary bg-primary text-primary-foreground",
									isCurrent &&
										!isRejected &&
										"border-primary bg-primary/10 text-primary ring-2 ring-primary/20",
									isCurrent &&
										isRejected &&
										"border-destructive bg-destructive/10 text-destructive ring-2 ring-destructive/20",
									isFuture &&
										"border-border bg-background text-muted-foreground",
								)}
							>
								{isPast ? <Check className="h-3 w-3" /> : <span>{i + 1}</span>}
							</div>
							<span
								className={cn(
									"whitespace-nowrap font-medium text-[10px]",
									isPast && "text-primary",
									isCurrent && !isRejected && "text-primary",
									isCurrent && isRejected && "text-destructive",
									isFuture && "text-muted-foreground",
								)}
							>
								{step.label}
							</span>
						</div>
						{i < steps.length - 1 && (
							<div
								className={cn(
									"mx-1 mb-4 h-0.5 w-8 transition-colors",
									i < currentIndex ? "bg-primary" : "bg-border",
								)}
							/>
						)}
					</div>
				);
			})}
		</div>
	);
}
