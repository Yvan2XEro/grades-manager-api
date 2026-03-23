import { CircleHelp, ChevronDown, X, ArrowRight, Check, Circle, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { useLocation, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { getHelpSections } from "./help-content";
import { ADMIN_WORKFLOW, getCurrentStepIndex } from "./workflow-steps";

export function HelpWidget() {
	const [open, setOpen] = useState(false);
	const [expanded, setExpanded] = useState<string | null>(null);
	const [workflowExpanded, setWorkflowExpanded] = useState(false);
	const location = useLocation();
	const { i18n, t } = useTranslation();

	const lang = (i18n.language?.startsWith("fr") ? "fr" : "en") as "en" | "fr";
	const sections = getHelpSections(location.pathname, lang);

	const currentStepIndex = getCurrentStepIndex(location.pathname);
	const isInWorkflow = currentStepIndex !== -1;
	const nextStep =
		isInWorkflow && currentStepIndex < ADMIN_WORKFLOW.length - 1
			? ADMIN_WORKFLOW[currentStepIndex + 1]
			: null;

	const toggleItem = (key: string) => {
		setExpanded((prev) => (prev === key ? null : key));
	};

	return (
		<>
			{/* Floating button */}
			<button
				type="button"
				onClick={() => setOpen(true)}
				className={cn(
					"fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full",
					"bg-primary text-primary-foreground shadow-lg",
					"transition-transform duration-200 hover:scale-110 active:scale-95",
					open && "opacity-0 pointer-events-none",
				)}
				aria-label={t("help.openButton", "Help")}
			>
				<CircleHelp className="h-5 w-5" />
			</button>

			{/* Backdrop */}
			{open && (
				<div
					className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
					onClick={() => setOpen(false)}
				/>
			)}

			{/* Panel */}
			<div
				className={cn(
					"fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-card shadow-2xl",
					"transition-transform duration-300 ease-in-out",
					open ? "translate-x-0" : "translate-x-full",
				)}
			>
				{/* Header */}
				<div className="flex items-center justify-between border-b border-border px-5 py-4">
					<div className="flex items-center gap-2">
						<CircleHelp className="h-5 w-5 text-primary" />
						<span className="font-semibold text-sm">
							{t("help.title", "Help")}
						</span>
					</div>
					<button
						type="button"
						onClick={() => setOpen(false)}
						className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
					>
						<X className="h-4 w-4" />
					</button>
				</div>

					{/* Workflow progression */}
				{isInWorkflow && (
					<div className="border-b border-border">
						{/* Toggle header */}
						<button
							type="button"
							onClick={() => setWorkflowExpanded((v) => !v)}
							className="flex w-full items-center justify-between px-5 py-3 text-left hover:bg-muted/40 transition-colors"
						>
							<div className="flex items-center gap-2">
								<p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
									{t("help.workflow.title", "Setup progression")}
								</p>
								<span className="text-[11px] text-muted-foreground/60">
									{currentStepIndex + 1}/{ADMIN_WORKFLOW.length}
								</span>
							</div>
							<ChevronsUpDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", workflowExpanded && "rotate-180")} />
						</button>

						{/* Collapsible content */}
						{workflowExpanded && (
							<div className="px-5 pb-4 space-y-1">
								{/* Step list */}
								<div className="space-y-0.5">
									{ADMIN_WORKFLOW.map((step, i) => {
										const isPast = i < currentStepIndex;
										const isCurrent = i === currentStepIndex;
										const isFuture = i > currentStepIndex;
										return (
											<Link
												key={step.key}
												to={step.route}
												onClick={() => setOpen(false)}
												className={cn(
													"flex items-center gap-2.5 rounded-md px-2 py-1.5 text-xs transition-colors",
													isPast && "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
													isCurrent && "bg-primary/10 text-primary font-semibold hover:bg-primary/15",
													isFuture && "text-muted-foreground/50 hover:bg-muted/40 hover:text-muted-foreground",
												)}
											>
												{isPast && <Check className="h-3 w-3 shrink-0 text-primary/60" />}
												{isCurrent && <Circle className="h-2.5 w-2.5 shrink-0 fill-primary text-primary" />}
												{isFuture && <Circle className="h-2.5 w-2.5 shrink-0 text-muted-foreground/30" />}
												<span className="leading-tight">{step.label[lang]}</span>
												{isCurrent && <ArrowRight className="ml-auto h-3 w-3 shrink-0 opacity-50" />}
											</Link>
										);
									})}
								</div>

								{/* Next step CTA */}
								{nextStep ? (
									<Link
										to={nextStep.route}
										onClick={() => setOpen(false)}
										className="mt-1 flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary hover:bg-primary/10 transition-colors"
									>
										<ArrowRight className="h-3 w-3 shrink-0" />
										<span>
											{t("help.workflow.next", "Next step")} :{" "}
											<span className="font-semibold">{nextStep.label[lang]}</span>
										</span>
									</Link>
								) : (
									<div className="mt-1 flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-2 text-xs text-primary font-medium">
										<Check className="h-3 w-3 shrink-0" />
										<span>{t("help.workflow.done", "Setup complete")}</span>
									</div>
								)}
							</div>
						)}
					</div>
				)}

				{/* Content */}
				<div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
					{sections.map((section, si) => (
						<div key={`${si}-${section.title}`}>
							<p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
								{section.title}
							</p>
							<div className="space-y-1">
								{section.items.map((item, ii) => {
									const key = `${si}-${ii}`;
									const isOpen = expanded === key;
									return (
										<div
											key={key}
											className="rounded-lg border border-border overflow-hidden"
										>
											<button
												type="button"
												className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left text-sm font-medium hover:bg-muted/50 transition-colors"
												onClick={() => toggleItem(key)}
											>
												<span className="leading-snug">{item.q}</span>
												<ChevronDown
													className={cn(
														"mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
														isOpen && "rotate-180",
													)}
												/>
											</button>
											{isOpen && (
												<div className="border-t border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground leading-relaxed">
													{item.a}
												</div>
											)}
										</div>
									);
								})}
							</div>
						</div>
					))}
				</div>

				{/* Footer */}
				<div className="border-t border-border px-5 py-3">
					<p className="text-[11px] text-muted-foreground/60 text-center">
						{t("help.footer", "OverBrand · Grades Manager")}
					</p>
				</div>
			</div>
		</>
	);
}
