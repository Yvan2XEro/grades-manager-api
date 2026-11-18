"use client";

import {
	BookOpen,
	CalendarClock,
	ClipboardList,
	FileText,
	Gavel,
	GraduationCap,
	LayoutDashboard,
	ListChecks,
	Settings2,
	ShieldCheck,
} from "lucide-react";
import type React from "react";
import type { Locale } from "@/i18n";
import { AppWindow, type NavItem } from "./shell";
import { type DemoStrings, demoStrings } from "./strings";

/**
 * Adapter: mounts one of the older demo bodies inside the real product shell.
 *
 * Four screens — attendance, approvals, document export and the rules engine —
 * have good, bilingual, working bodies but were wrapped in `demos/DemoFrame`, a
 * mock browser window with three grey dots and a URL pill. That frame is not
 * what the software looks like, so the site was showing two different
 * interfaces and calling both "TKAMS".
 *
 * Rather than rewrite four working demos, this wraps their bodies in the same
 * `AppWindow` the deliberation and grade-entry screens use: real sidebar, real
 * 56px header with its controls, real window chrome. One interface across the
 * whole site.
 *
 * Sidebar labels and screen titles come from the demo strings, so the chrome
 * follows the site's language — the bodies inside were already bilingual, and
 * a French sidebar around an English screen was the one seam left.
 */

const screensFor = (t: DemoStrings) =>
	({
		attendance: {
			url: "tkams.com/enseignant/assiduite",
			breadcrumb: t.chrome.teacher,
			title: t.screens.attendance,
			nav: [
				{
					group: t.groups.overview,
					label: t.nav.dashboard,
					icon: LayoutDashboard,
				},
				{ group: t.groups.teaching, label: t.nav.courses, icon: BookOpen },
				{
					group: t.groups.teaching,
					label: t.nav.attendance,
					icon: CalendarClock,
					active: true,
				},
				{ group: t.groups.assessment, label: t.nav.grades, icon: ListChecks },
				{ group: t.groups.assessment, label: t.nav.exams, icon: ClipboardList },
			] satisfies NavItem[],
		},
		approvals: {
			url: "tkams.com/admin/validations",
			breadcrumb: t.chrome.admin,
			title: t.screens.approvals,
			nav: [
				{
					group: t.groups.overview,
					label: t.nav.dashboard,
					icon: LayoutDashboard,
				},
				{ group: t.groups.assessment, label: t.nav.grades, icon: ListChecks },
				{
					group: t.groups.assessment,
					label: t.nav.approvals,
					icon: ShieldCheck,
					active: true,
				},
				{ group: t.groups.assessment, label: t.nav.exams, icon: ClipboardList },
				{ group: t.groups.rules, label: t.nav.deliberations, icon: Gavel },
			] satisfies NavItem[],
		},
		docexport: {
			url: "tkams.com/admin/documents",
			breadcrumb: t.chrome.admin,
			title: t.screens.officialDocs,
			nav: [
				{
					group: t.groups.overview,
					label: t.nav.dashboard,
					icon: LayoutDashboard,
				},
				{ group: t.groups.people, label: t.nav.students, icon: GraduationCap },
				{
					group: t.groups.documents,
					label: t.nav.officialDocs,
					icon: FileText,
					active: true,
				},
				{
					group: t.groups.documents,
					label: t.nav.exportTemplates,
					icon: ClipboardList,
				},
				{ group: t.groups.rules, label: t.nav.deliberations, icon: Gavel },
			] satisfies NavItem[],
		},
		rules: {
			url: "tkams.com/admin/regles",
			breadcrumb: t.chrome.admin,
			title: t.screens.juryRules,
			nav: [
				{
					group: t.groups.overview,
					label: t.nav.dashboard,
					icon: LayoutDashboard,
				},
				{ group: t.groups.people, label: t.nav.students, icon: GraduationCap },
				{ group: t.groups.rules, label: t.nav.deliberations, icon: Gavel },
				{
					group: t.groups.rules,
					label: t.nav.juryRules,
					icon: Settings2,
					active: true,
				},
				{ group: t.groups.rules, label: t.nav.promotion, icon: ListChecks },
			] satisfies NavItem[],
		},
	}) as const;

export function LegacyInAppWindow({
	screen,
	caption,
	children,
	locale,
}: {
	screen: "attendance" | "approvals" | "docexport" | "rules";
	caption?: string;
	children: React.ReactNode;
	locale?: Locale;
}) {
	const t = demoStrings(locale);
	const s = screensFor(t)[screen];

	return (
		<figure className="m-0">
			<AppWindow
				url={s.url}
				breadcrumb={s.breadcrumb}
				title={s.title}
				nav={s.nav}
				locale={locale}
			>
				{children}
			</AppWindow>
			{caption ? (
				<figcaption className="mt-3 font-body text-[0.8125rem] text-tk-muted">
					{caption}
				</figcaption>
			) : null}
		</figure>
	);
}
