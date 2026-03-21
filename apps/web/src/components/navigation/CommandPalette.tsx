import {
	BookOpen,
	Calendar,
	CheckSquare,
	ClipboardCheck,
	ClipboardList,
	GraduationCap,
	LayoutDashboard,
	Layers,
	School,
	Settings,
	Bell,
	Users,
	Building2,
	BarChart2,
	FileText,
	GitBranch,
} from "lucide-react";
import { useEffect, useState } from "react";
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

type CommandEntry = {
	label: string;
	icon: React.ReactNode;
	href: string;
	keywords?: string;
};

const COMMANDS: { group: string; items: CommandEntry[] }[] = [
	{
		group: "Principal",
		items: [
			{
				label: "Dashboard",
				icon: <LayoutDashboard className="h-4 w-4" />,
				href: "/admin",
				keywords: "accueil home overview",
			},
			{
				label: "Étudiants",
				icon: <GraduationCap className="h-4 w-4" />,
				href: "/admin/students",
				keywords: "students élèves",
			},
			{
				label: "Examens",
				icon: <ClipboardCheck className="h-4 w-4" />,
				href: "/admin/exams",
				keywords: "exams tests épreuves",
			},
			{
				label: "Inscriptions",
				icon: <ClipboardList className="h-4 w-4" />,
				href: "/admin/enrollments",
				keywords: "enrollments inscriptions",
			},
			{
				label: "Utilisateurs",
				icon: <Users className="h-4 w-4" />,
				href: "/admin/users",
				keywords: "users comptes accounts",
			},
		],
	},
	{
		group: "Académique",
		items: [
			{
				label: "Années académiques",
				icon: <Calendar className="h-4 w-4" />,
				href: "/admin/academic-years",
				keywords: "années years",
			},
			{
				label: "Cours",
				icon: <BookOpen className="h-4 w-4" />,
				href: "/admin/courses",
				keywords: "courses matières",
			},
			{
				label: "Classes",
				icon: <Layers className="h-4 w-4" />,
				href: "/admin/classes",
				keywords: "classes groupes",
			},
			{
				label: "Facultés",
				icon: <Building2 className="h-4 w-4" />,
				href: "/admin/faculties",
				keywords: "facultés institutions",
			},
			{
				label: "Filières",
				icon: <School className="h-4 w-4" />,
				href: "/admin/programs",
				keywords: "programmes programs filières",
			},
			{
				label: "Cycles d'études",
				icon: <GitBranch className="h-4 w-4" />,
				href: "/admin/study-cycles",
				keywords: "cycles licence master",
			},
			{
				label: "Unités d'enseignement",
				icon: <Layers className="h-4 w-4" />,
				href: "/admin/teaching-units",
				keywords: "UE teaching units",
			},
		],
	},
	{
		group: "Outils",
		items: [
			{
				label: "Planificateur d'examens",
				icon: <CheckSquare className="h-4 w-4" />,
				href: "/admin/exam-scheduler",
				keywords: "scheduler planificateur",
			},
			{
				label: "Export de notes",
				icon: <FileText className="h-4 w-4" />,
				href: "/admin/grade-export",
				keywords: "export grades notes résultats",
			},
			{
				label: "Délibérations",
				icon: <ClipboardList className="h-4 w-4" />,
				href: "/admin/deliberations",
				keywords: "délibérations jury",
			},
			{
				label: "Notifications",
				icon: <Bell className="h-4 w-4" />,
				href: "/admin/notifications",
				keywords: "notifications alertes",
			},
			{
				label: "Monitoring",
				icon: <BarChart2 className="h-4 w-4" />,
				href: "/admin/monitoring",
				keywords: "monitoring surveillance logs",
			},
			{
				label: "Paramètres institution",
				icon: <Settings className="h-4 w-4" />,
				href: "/admin/institution",
				keywords: "institution settings paramètres",
			},
		],
	},
];

type Props = {
	open: boolean;
	onOpenChange: (v: boolean) => void;
};

export function CommandPalette({ open, onOpenChange }: Props) {
	const navigate = useNavigate();
	const [search, setSearch] = useState("");

	// Reset search on close
	useEffect(() => {
		if (!open) setSearch("");
	}, [open]);

	const handleSelect = (href: string) => {
		onOpenChange(false);
		navigate(href);
	};

	return (
		<CommandDialog
			open={open}
			onOpenChange={onOpenChange}
			title="Recherche rapide"
			description="Naviguez rapidement vers une page"
			className="max-w-lg"
			showCloseButton={false}
		>
			<CommandInput
				placeholder="Rechercher une page…"
				value={search}
				onValueChange={setSearch}
			/>
			<CommandList>
				<CommandEmpty>Aucun résultat pour « {search} »</CommandEmpty>
				{COMMANDS.map((section, i) => (
					<span key={section.group}>
						{i > 0 && <CommandSeparator />}
						<CommandGroup heading={section.group}>
							{section.items.map((item) => (
								<CommandItem
									key={item.href}
									value={`${item.label} ${item.keywords ?? ""}`}
									onSelect={() => handleSelect(item.href)}
									className="gap-3"
								>
									<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground">
										{item.icon}
									</span>
									<span>{item.label}</span>
								</CommandItem>
							))}
						</CommandGroup>
					</span>
				))}
			</CommandList>
			<div className="border-t px-3 py-2">
				<p className="text-[11px] text-muted-foreground">
					<kbd className="rounded border bg-muted px-1 font-mono text-[10px]">↑↓</kbd> naviguer ·{" "}
					<kbd className="rounded border bg-muted px-1 font-mono text-[10px]">↵</kbd> ouvrir ·{" "}
					<kbd className="rounded border bg-muted px-1 font-mono text-[10px]">Esc</kbd> fermer
				</p>
			</div>
		</CommandDialog>
	);
}
