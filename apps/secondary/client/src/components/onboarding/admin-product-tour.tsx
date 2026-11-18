import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import { authClient, useSession } from "@/lib/auth-client";

type TourStep = {
	selector: string;
	route: string;
	title: string;
	body: string;
	activate?: boolean;
};

const stepsFor = (t: (key: string, fallback: string) => string): TourStep[] => [
	{
		selector: "[data-tour='dashboard-overview']",
		route: "/",
		title: t("tour.dashboard_title", "Your dashboard"),
		body: t(
			"tour.dashboard_body",
			"Start here for a quick view of your school's activity and the current academic year.",
		),
	},
	{
		selector: "[data-tour='students-add']",
		route: "/students",
		title: t("tour.students_title", "Manage students"),
		body: t(
			"tour.students_body",
			"Create student records, review profiles and access grades, fees and attendance.",
		),
	},
	{
		selector: "[data-tour='classes-add']",
		route: "/classes",
		title: t("tour.classes_title", "Organise classes"),
		body: t(
			"tour.classes_body",
			"Set up classes, rosters, tracks and the assignments used by teachers.",
		),
	},
	{
		selector: "[data-tour='grades-workflow']",
		route: "/grades",
		title: t("tour.grades_title", "Enter grades"),
		body: t(
			"tour.grades_body",
			"Teachers enter marks only for their assigned classes and subjects. Review the grade workflow here.",
		),
	},
	{
		selector: "[data-tour='grades-save']",
		route: "/grades",
		title: t("tour.grades_save_title", "Save grades safely"),
		body: t(
			"tour.grades_save_body",
			"After entering marks, use Save to validate and publish the changes for this assessment.",
		),
	},
	{
		selector: "[data-tour='report-cards-workflow']",
		route: "/report-cards",
		title: t("tour.report_cards_title", "Prepare report cards"),
		body: t(
			"tour.report_cards_body",
			"Generate term report cards with averages, rankings and teacher comments.",
		),
	},
	{
		selector: "[data-tour='class-councils-create']",
		route: "/class-councils",
		title: t("tour.councils_title", "Run class councils"),
		body: t(
			"tour.councils_body",
			"Review term results and record the teaching team's decisions and observations.",
		),
	},
	{
		selector: "[data-tour='finance-payment']",
		route: "/finance",
		title: t("tour.school_title", "Follow school life"),
		body: t(
			"tour.school_body",
			"Attendance and school fees keep day-to-day follow-up in the same workspace.",
		),
	},
	{
		selector: "[data-tour='settings-school-tab']",
		route: "/settings",
		activate: true,
		title: t("tour.settings_title", "Configure your school"),
		body: t(
			"tour.settings_body",
			"Update the school profile, academic configuration, terms, language and security settings.",
		),
	},
	{
		selector: "[data-tour='settings-academic-tab']",
		route: "/settings",
		activate: true,
		title: t("tour.academic_title", "Set up the academic year"),
		body: t(
			"tour.academic_body",
			"Manage academic years, classes and the rules that structure your school year.",
		),
	},
	{
		selector: "[data-tour='settings-terms-tab']",
		route: "/settings",
		activate: true,
		title: t("tour.terms_title", "Define your terms"),
		body: t(
			"tour.terms_body",
			"Create and publish terms so grades, reports and councils use the same calendar.",
		),
	},
];

export function AdminProductTour() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const { data: session } = useSession();
	const { data: org } = authClient.useActiveOrganization();
	const member = org?.members?.find(
		(item) => item.userId === session?.user?.id,
	);
	const isAdmin = member?.role === "admin" || member?.role === "owner";
	const storageKey =
		session?.user?.id && org?.id
			? `tkams:admin-tour:${session.user.id}:${org.id}`
			: null;
	const [open, setOpen] = useState(false);
	const [index, setIndex] = useState(0);
	const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
	const steps = useMemo(() => stepsFor(t), [t]);

	useEffect(() => {
		if (!isAdmin || !storageKey || localStorage.getItem(storageKey)) return;
		const id = window.setTimeout(() => setOpen(true), 500);
		return () => window.clearTimeout(id);
	}, [isAdmin, storageKey]);
	useEffect(() => {
		const restart = () => {
			setIndex(0);
			setOpen(true);
		};
		window.addEventListener("tkams:restart-admin-tour", restart);
		return () =>
			window.removeEventListener("tkams:restart-admin-tour", restart);
	}, []);

	useEffect(() => {
		if (!open) return;
		const currentStep = steps[index];
		if (!currentStep) return;
		if (location.pathname !== currentStep.route) {
			setTargetRect(null);
			navigate(currentStep.route);
			return;
		}
		let activated = false;
		const updateRect = () => {
			const target = document.querySelector(currentStep.selector);
			if (currentStep.activate && !activated && target instanceof HTMLElement) {
				activated = true;
				target.click();
			}
			target?.scrollIntoView({ behavior: "smooth", block: "center" });
			setTargetRect(target?.getBoundingClientRect() ?? null);
		};
		updateRect();
		const interval = window.setInterval(updateRect, 250);
		window.addEventListener("resize", updateRect);
		return () => {
			window.clearInterval(interval);
			window.removeEventListener("resize", updateRect);
		};
	}, [open, index, steps, location.pathname, navigate]);

	if (!isAdmin || !open) return null;
	const step = steps[index];
	const close = () => {
		if (storageKey) localStorage.setItem(storageKey, "completed");
		setOpen(false);
		setIndex(0);
	};
	const next = () =>
		index === steps.length - 1 ? close() : setIndex((value) => value + 1);

	return (
		<div
			className="fixed inset-0 z-[100]"
			role="dialog"
			aria-modal="true"
			aria-labelledby="admin-tour-title"
		>
			<div
				className={
					targetRect ? "absolute inset-0" : "absolute inset-0 bg-black/45"
				}
				onClick={close}
				aria-hidden="true"
			/>
			{targetRect && (
				<div
					className="pointer-events-none fixed rounded-md border-2 border-primary transition-all duration-300"
					style={{
						top: targetRect.top - 4,
						left: targetRect.left - 4,
						width: targetRect.width + 8,
						height: targetRect.height + 8,
						boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.45)",
					}}
				/>
			)}
			<div className="-translate-x-1/2 sm:-translate-y-1/2 fixed bottom-5 left-1/2 w-[min(92vw,28rem)] rounded-xl border bg-popover p-5 text-popover-foreground shadow-2xl sm:top-1/2 sm:bottom-auto">
				<div className="flex items-start justify-between gap-4">
					<div>
						<p className="mb-1 font-medium text-muted-foreground text-xs">
							{t("tour.step", "Step {{current}} of {{total}}", {
								current: index + 1,
								total: steps.length,
							})}
						</p>
						<h2 id="admin-tour-title" className="font-semibold text-lg">
							{step.title}
						</h2>
					</div>
					<button
						type="button"
						onClick={close}
						className="rounded p-1 text-muted-foreground hover:bg-muted"
						aria-label={t("tour.close", "Close tour")}
					>
						×
					</button>
				</div>
				<p className="mt-3 text-muted-foreground text-sm leading-relaxed">
					{step.body}
				</p>
				<div className="mt-5 flex items-center justify-between gap-3">
					<button
						type="button"
						onClick={close}
						className="text-muted-foreground text-sm hover:text-foreground"
					>
						{t("tour.skip", "Skip tour")}
					</button>
					<div className="flex gap-2">
						{index > 0 && (
							<button
								type="button"
								onClick={() => setIndex((value) => value - 1)}
								className="rounded-md border px-3 py-2 text-sm"
							>
								{t("common.previous", "Previous")}
							</button>
						)}
						<button
							type="button"
							onClick={next}
							className="rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground text-sm"
						>
							{index === steps.length - 1
								? t("tour.finish", "Finish")
								: t("common.next", "Next")}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

export function RestartAdminProductTour() {
	const { t } = useTranslation();
	const { data: session } = useSession();
	const { data: org } = authClient.useActiveOrganization();
	const member = org?.members?.find(
		(item) => item.userId === session?.user?.id,
	);
	if (member?.role !== "admin" && member?.role !== "owner") return null;
	const restart = () => {
		if (session?.user?.id && org?.id)
			localStorage.removeItem(`tkams:admin-tour:${session.user.id}:${org.id}`);
		window.dispatchEvent(new Event("tkams:restart-admin-tour"));
	};
	return (
		<button
			type="button"
			onClick={restart}
			className="text-primary text-sm hover:underline"
		>
			{t("tour.restart", "Take the product tour again")}
		</button>
	);
}

export function AdminProductTourTrigger() {
	const { t } = useTranslation();
	const { data: session } = useSession();
	const { data: org } = authClient.useActiveOrganization();
	const member = org?.members?.find(
		(item) => item.userId === session?.user?.id,
	);
	if (member?.role !== "admin" && member?.role !== "owner") return null;

	const restart = () => {
		if (session?.user?.id && org?.id)
			localStorage.removeItem(`tkams:admin-tour:${session.user.id}:${org.id}`);
		window.dispatchEvent(new Event("tkams:restart-admin-tour"));
	};

	return (
		<button
			type="button"
			onClick={restart}
			className="rounded p-1 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
			aria-label={t("tour.trigger_label", "Open the TKAMS tour")}
			title={t(
				"tour.trigger_description",
				"Discover the main actions available in TKAMS Secondary",
			)}
		>
			<span aria-hidden="true" className="font-semibold text-sm leading-none">
				?
			</span>
		</button>
	);
}
