import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
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
import { CheckCircle2, Edit, MoreVertical, Trash2, XCircle } from "lucide-react";

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

export function RuleCard({ rule, onEdit, onDelete, onToggleActive }: RuleCardProps) {
	return (
		<Card className="group hover:shadow-md transition-shadow duration-200">
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<div className="flex-1">
						<CardTitle className="text-lg flex items-center gap-2">
							{rule.name}
							{rule.isActive ? (
								<Badge variant="default" className="bg-green-500">
									<CheckCircle2 className="w-3 h-3 mr-1" />
									Active
								</Badge>
							) : (
								<Badge variant="secondary">
									<XCircle className="w-3 h-3 mr-1" />
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
							<Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
								<MoreVertical className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							{onEdit && (
								<DropdownMenuItem onClick={onEdit}>
									<Edit className="w-4 h-4 mr-2" />
									Edit
								</DropdownMenuItem>
							)}
							{onToggleActive && (
								<DropdownMenuItem onClick={onToggleActive}>
									{rule.isActive ? (
										<>
											<XCircle className="w-4 h-4 mr-2" />
											Deactivate
										</>
									) : (
										<>
											<CheckCircle2 className="w-4 h-4 mr-2" />
											Activate
										</>
									)}
								</DropdownMenuItem>
							)}
							{onDelete && (
								<DropdownMenuItem onClick={onDelete} className="text-red-600">
									<Trash2 className="w-4 h-4 mr-2" />
									Delete
								</DropdownMenuItem>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</CardHeader>
			<CardFooter className="text-xs text-muted-foreground pt-0">
				Created {new Date(rule.createdAt).toLocaleDateString()}
			</CardFooter>
		</Card>
	);
}
