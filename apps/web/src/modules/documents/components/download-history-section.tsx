import { useQuery } from "@tanstack/react-query";
import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

/** Documents the student downloaded, newest first. */
export function DownloadHistorySection() {
	const { t } = useTranslation();
	const historyQuery = useQuery(
		trpc.academicDocuments.myDownloadHistory.queryOptions(),
	);

	const rows = historyQuery.data ?? [];

	const kindLabel = (kind: string) => {
		const key = `student.documents.${kind}.title` as Parameters<typeof t>[0];
		return t(key, { defaultValue: kind });
	};

	const formatDate = (iso: string) =>
		new Date(iso).toLocaleDateString(undefined, {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});

	if (historyQuery.isPending) {
		return (
			<div className="space-y-2">
				<Skeleton className="h-10 w-full rounded-lg" />
				<Skeleton className="h-10 w-full rounded-lg" />
			</div>
		);
	}

	if (rows.length === 0) {
		return (
			<p className="text-muted-foreground text-sm">
				{t("student.documents.history.empty")}
			</p>
		);
	}

	return (
		<ul className="divide-y rounded-xl border bg-card">
			{rows.map((row) => (
				<li key={row.id} className="flex items-center gap-3 px-4 py-3">
					<Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
					<span className="flex-1 text-sm">{kindLabel(row.kind)}</span>
					<Badge variant="secondary" className="text-xs">
						{formatDate(row.downloadedAt)}
					</Badge>
				</li>
			))}
		</ul>
	);
}
