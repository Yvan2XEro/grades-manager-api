import {
	Copy,
	MoreHorizontal,
	Settings,
	Trash2,
	UserMinus,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { GuardianRow } from "../types";

/** "…" menu of a guardian row; "remove from student" lists the linked students. */
export function GuardianRowActions({
	guardian: g,
	onCopyPortalLink,
	onEditPreferences,
	onRemoveLink,
	onDelete,
}: {
	guardian: GuardianRow;
	onCopyPortalLink: () => void;
	onEditPreferences: () => void;
	onRemoveLink: (studentId: string) => void;
	onDelete: () => void;
}) {
	const { t } = useTranslation();
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon-sm">
					<MoreHorizontal className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={onCopyPortalLink}>
					<Copy className="mr-2 h-4 w-4" />
					{t("guardians.admin.copyPortalLink")}
				</DropdownMenuItem>
				<DropdownMenuItem onClick={onEditPreferences}>
					<Settings className="mr-2 h-4 w-4" />
					{t("guardians.admin.editPreferences", {
						defaultValue: "Edit preferences",
					})}
				</DropdownMenuItem>
				{g.studentLinks.length > 0 && (
					<DropdownMenuSub>
						<DropdownMenuSubTrigger>
							<UserMinus className="mr-2 h-4 w-4" />
							{t("guardians.admin.removeFromStudent", {
								defaultValue: "Remove from student",
							})}
						</DropdownMenuSubTrigger>
						<DropdownMenuSubContent>
							{g.studentLinks.map((link) => (
								<DropdownMenuItem
									key={link.id}
									onClick={() => onRemoveLink(link.student.id)}
								>
									{link.student.firstName} {link.student.lastName}
								</DropdownMenuItem>
							))}
						</DropdownMenuSubContent>
					</DropdownMenuSub>
				)}
				<DropdownMenuSeparator />
				<DropdownMenuItem className="text-destructive" onClick={onDelete}>
					<Trash2 className="mr-2 h-4 w-4" />
					{t("common.actions.delete")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
