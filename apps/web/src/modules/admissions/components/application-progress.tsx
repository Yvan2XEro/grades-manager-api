import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TOTAL_STEPS } from "../services/application-schema";

/** Wizard progress: a bar on mobile, clickable step dots on desktop. */
export function ApplicationProgress({
	step,
	stepTitles,
	onStepClick: goToStep,
}: {
	step: number;
	stepTitles: string[];
	/** Called with a completed step to go back to it. */
	onStepClick: (step: number) => void;
}) {
	const { t } = useTranslation();
	return (
		<div className="border-b bg-background/80 backdrop-blur-sm">
			<div className="mx-auto max-w-3xl px-4 py-3">
				{/* Mobile: bar */}
				<div className="flex items-center gap-3 sm:hidden">
					<span className="whitespace-nowrap font-medium text-sm">
						{t("admissions.wizard.stepOf", {
							current: step,
							total: TOTAL_STEPS,
						})}
					</span>
					<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
						<div
							className="h-full rounded-full bg-primary transition-all duration-500"
							style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
						/>
					</div>
					<span className="whitespace-nowrap text-muted-foreground text-xs">
						{stepTitles[step - 1]}
					</span>
				</div>
				{/* Desktop: dots */}
				<div className="hidden items-center sm:flex">
					{stepTitles.map((title, i) => {
						const n = i + 1;
						const done = n < step;
						const current = n === step;
						return (
							<div key={n} className="flex flex-1 items-center">
								<button
									type="button"
									onClick={() => done && goToStep(n)}
									className={`flex flex-col items-center gap-1 ${done ? "cursor-pointer" : "cursor-default"}`}
								>
									<div
										className={`flex size-7 items-center justify-center rounded-full font-semibold text-xs transition-all duration-300 ${done ? "bg-emerald-500 text-white" : current ? "bg-primary text-primary-foreground ring-4 ring-primary/20" : "bg-muted text-muted-foreground"}`}
									>
										{done ? <CheckCircle2 className="size-4" /> : n}
									</div>
									<span
										className={`text-center text-[10px] leading-tight ${current ? "font-semibold text-primary" : "text-muted-foreground"}`}
									>
										{title}
									</span>
								</button>
								{i < TOTAL_STEPS - 1 && (
									<div
										className={`mx-1 h-0.5 flex-1 transition-all duration-500 ${done ? "bg-emerald-500" : "bg-muted"}`}
									/>
								)}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
