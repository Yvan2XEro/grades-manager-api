import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";

const statusVariants: Record<
	string,
	"default" | "secondary" | "destructive" | "outline"
> = {
	pending: "outline",
	previewed: "secondary",
	running: "default",
	completed: "default",
	failed: "destructive",
	cancelled: "secondary",
	stale: "destructive",
	rolled_back: "secondary",
};

const statusIcons: Record<string, React.ReactNode> = {
	pending: <Clock className="mr-1 h-3 w-3" />,
	previewed: <Clock className="mr-1 h-3 w-3" />,
	running: <Loader2 className="mr-1 h-3 w-3 animate-spin" />,
	completed: <CheckCircle2 className="mr-1 h-3 w-3" />,
	failed: <XCircle className="mr-1 h-3 w-3" />,
	cancelled: <XCircle className="mr-1 h-3 w-3" />,
	stale: <XCircle className="mr-1 h-3 w-3" />,
	rolled_back: <XCircle className="mr-1 h-3 w-3" />,
};

/** Status of a job in the jobs list, with its icon. */
export function BatchJobStatusBadge({ status }: { status: string }) {
	const { t } = useTranslation();
	return (
		<Badge variant={statusVariants[status] ?? "outline"}>
			{statusIcons[status]}
			{t(`admin.batchJobs.status.${status}`, { defaultValue: status })}
		</Badge>
	);
}
