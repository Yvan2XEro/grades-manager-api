import {
	CheckCircle2,
	Edit,
	MoreVertical,
	Trash2,
	XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RuleCardProps {
	rule: {
		id: string;
		name: string;
		description: string | null;
		isActive: boolean;
		createdAt: Date;
	};
	onEdit?: () => void;
	onDelete?: () => void;
	onToggleActive?: () => void;
}

export function RuleCard({
	rule,
	onEdit,
	onDelete,
	onToggleActive,
}: RuleCardProps) {
	return (
		<Card className="group border-0 shadow-sm transition-shadow duration-200 hover:shadow-md">
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<div className="flex-1">
						<CardTitle className="flex items-center gap-2 text-lg">
							{rule.name}
							{rule.isActive ? (
								<Badge variant="default" className="bg-emerald-600">
									<CheckCircle2 className="mr-1 h-3 w-3" />
									Active
								</Badge>
							) : (
								<Badge variant="secondary">
									<XCircle className="mr-1 h-3 w-3" />
									Inactive
								</Badge>
							)}
						</CardTitle>
						<CardDescription className="mt-1.5">
							{rule.description || "No description"}
						</CardDescription>
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="opacity-0 transition-opacity group-hover:opacity-100"
							>
								<MoreVertical className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							{onEdit && (
								<DropdownMenuItem onClick={onEdit}>
									<Edit className="mr-2 h-4 w-4" />
									Edit
								</DropdownMenuItem>
							)}
							{onToggleActive && (
								<DropdownMenuItem onClick={onToggleActive}>
									{rule.isActive ? (
										<>
											<XCircle className="mr-2 h-4 w-4" />
											Deactivate
										</>
									) : (
										<>
											<CheckCircle2 className="mr-2 h-4 w-4" />
											Activate
										</>
									)}
								</DropdownMenuItem>
							)}
							{onDelete && (
								<DropdownMenuItem
									onClick={onDelete}
									className="text-destructive"
								>
									<Trash2 className="mr-2 h-4 w-4" />
									Delete
								</DropdownMenuItem>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</CardHeader>
			<CardFooter className="pt-0 text-muted-foreground text-xs">
				Created {new Date(rule.createdAt).toLocaleDateString()}
			</CardFooter>
		</Card>
	);
}
