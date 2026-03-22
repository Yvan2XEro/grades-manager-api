import {
	BarChart2,
	Bell,
	BookOpen,
	Building2,
	Calendar,
	CheckSquare,
	ClipboardCheck,
	ClipboardList,
	FileText,
	GitBranch,
	GraduationCap,
	LayoutDashboard,
	Layers,
	School,
	Settings,
	Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";

type Props = {
	open: boolean;
	onOpenChange: (v: boolean) => void;
};

export function CommandPalette({ open, onOpenChange }: Props) {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const [search, setSearch] = useState("");

	useEffect(() => {
		if (!open) setSearch("");
	}, [open]);

	const handleSelect = (href: string) => {
		onOpenChange(false);
		navigate(href);
	};

	const IC = "h-4 w-4";

	const COMMANDS = [
		{
			groupKey: "main" as const,
			items: [
				{ labelKey: "navigation.sidebar.admin.dashboard",    icon: <LayoutDashboard className={IC} />, href: "/admin",              keywords: "home overview accueil" },
				{ labelKey: "navigation.sidebar.admin.students",     icon: <GraduationCap   className={IC} />, href: "/admin/students",      keywords: "students élèves étudiants" },
				{ labelKey: "navigation.sidebar.admin.exams",        icon: <ClipboardCheck  className={IC} />, href: "/admin/exams",         keywords: "exams tests épreuves" },
				{ labelKey: "navigation.sidebar.admin.enrollments",  icon: <ClipboardList   className={IC} />, href: "/admin/enrollments",   keywords: "enrollments inscriptions" },
				{ labelKey: "navigation.sidebar.admin.users",        icon: <Users           className={IC} />, href: "/admin/users",         keywords: "users comptes accounts" },
			],
		},
		{
			groupKey: "academic" as const,
			items: [
				{ labelKey: "navigation.sidebar.admin.academicYears",  icon: <Calendar    className={IC} />, href: "/admin/academic-years",  keywords: "années years" },
				{ labelKey: "navigation.sidebar.admin.courses",        icon: <BookOpen    className={IC} />, href: "/admin/courses",         keywords: "courses matières" },
				{ labelKey: "navigation.sidebar.admin.classes",        icon: <Layers      className={IC} />, href: "/admin/classes",         keywords: "classes groupes" },
				{ labelKey: "navigation.sidebar.admin.faculties",      icon: <Building2   className={IC} />, href: "/admin/faculties",       keywords: "facultés institutions" },
				{ labelKey: "navigation.sidebar.admin.programs",       icon: <School      className={IC} />, href: "/admin/programs",        keywords: "programmes filières" },
				{ labelKey: "navigation.sidebar.admin.studyCycles",    icon: <GitBranch   className={IC} />, href: "/admin/study-cycles",    keywords: "cycles licence master" },
				{ labelKey: "navigation.sidebar.admin.teachingUnits",  icon: <Layers      className={IC} />, href: "/admin/teaching-units",  keywords: "UE teaching units unités" },
			],
		},
		{
			groupKey: "tools" as const,
			items: [
				{ labelKey: "navigation.sidebar.admin.examScheduler",  icon: <CheckSquare className={IC} />, href: "/admin/exam-scheduler",  keywords: "scheduler planificateur" },
				{ labelKey: "navigation.sidebar.admin.gradeExport",    icon: <FileText    className={IC} />, href: "/admin/grade-export",    keywords: "export grades notes résultats" },
				{ labelKey: "navigation.sidebar.admin.deliberations",  icon: <ClipboardList className={IC} />, href: "/admin/deliberations", keywords: "délibérations jury" },
				{ labelKey: "navigation.sidebar.admin.notifications",  icon: <Bell        className={IC} />, href: "/admin/notifications",   keywords: "notifications alertes" },
				{ labelKey: "navigation.sidebar.admin.monitoring",     icon: <BarChart2   className={IC} />, href: "/admin/monitoring",      keywords: "monitoring surveillance logs" },
				{ labelKey: "navigation.sidebar.admin.institution",    icon: <Settings    className={IC} />, href: "/admin/institution",     keywords: "institution settings paramètres" },
			],
		},
	];

	return (
		<CommandDialog
			open={open}
			onOpenChange={onOpenChange}
			title={t("navigation.command.title")}
			description={t("navigation.command.description")}
			className="max-w-lg"
			showCloseButton={false}
		>
			<CommandInput
				placeholder={t("navigation.command.placeholder")}
				value={search}
				onValueChange={setSearch}
			/>
			<CommandList>
				<CommandEmpty>
					{t("navigation.command.empty", { query: search })}
				</CommandEmpty>
				{COMMANDS.map((section, i) => (
					<span key={section.groupKey}>
						{i > 0 && <CommandSeparator />}
						<CommandGroup heading={t(`navigation.command.groups.${section.groupKey}`)}>
							{section.items.map((item) => {
								const label = t(item.labelKey);
								return (
									<CommandItem
										key={item.href}
										value={`${label} ${item.keywords}`}
										onSelect={() => handleSelect(item.href)}
										className="gap-3"
									>
										<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground">
											{item.icon}
										</span>
										<span>{label}</span>
									</CommandItem>
								);
							})}
						</CommandGroup>
					</span>
				))}
			</CommandList>
			<div className="border-t px-3 py-2">
				<p className="text-[11px] text-muted-foreground">
					<kbd className="rounded border bg-muted px-1 font-mono text-[10px]">↑↓</kbd>{" "}
					{t("navigation.command.hint.navigate")} ·{" "}
					<kbd className="rounded border bg-muted px-1 font-mono text-[10px]">↵</kbd>{" "}
					{t("navigation.command.hint.open")} ·{" "}
					<kbd className="rounded border bg-muted px-1 font-mono text-[10px]">Esc</kbd>{" "}
					{t("navigation.command.hint.close")}
				</p>
			</div>
		</CommandDialog>
	);
}
