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
import { useNavMenu } from "./nav-menu";

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

	// Same entries as the sidebar of the user's role, so search never offers
	// a page the role cannot open.
	const menu = useNavMenu("h-4 w-4");
	const sections =
		menu.type === "grouped"
			? menu.groups.map((g) => ({
					key: g.key,
					heading: t(g.titleKey),
					items: g.items,
				}))
			: [
					{
						key: "main",
						heading: t("navigation.command.groups.main"),
						items: menu.items,
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
				{sections.map((section, i) => (
					<span key={section.key}>
						{i > 0 && <CommandSeparator />}
						<CommandGroup heading={section.heading}>
							{section.items.map((item) => {
								const label = t(item.labelKey);
								return (
									<CommandItem
										key={item.to}
										value={`${label} ${section.heading} ${item.to}`}
										onSelect={() => handleSelect(item.to)}
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
					<kbd className="rounded border bg-muted px-1 font-mono text-[10px]">
						↑↓
					</kbd>{" "}
					{t("navigation.command.hint.navigate")} ·{" "}
					<kbd className="rounded border bg-muted px-1 font-mono text-[10px]">
						↵
					</kbd>{" "}
					{t("navigation.command.hint.open")} ·{" "}
					<kbd className="rounded border bg-muted px-1 font-mono text-[10px]">
						Esc
					</kbd>{" "}
					{t("navigation.command.hint.close")}
				</p>
			</div>
		</CommandDialog>
	);
}
