import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { DownloadHistorySection } from "../components/download-history-section";
import {
	type DocKind,
	DocumentCard,
} from "../components/student-document-card";

export default function DocumentsPage() {
	const { t } = useTranslation();

	const docsQuery = useQuery(
		trpc.academicDocuments.myAvailableDocuments.queryOptions(),
	);

	return (
		<div className="space-y-8">
			<PageHeader
				title={t("student.documents.title")}
				description={t("student.documents.description")}
			/>

			{docsQuery.isPending ? (
				<div className="space-y-3">
					<Skeleton className="h-24 w-full rounded-xl" />
					<Skeleton className="h-24 w-full rounded-xl" />
					<Skeleton className="h-24 w-full rounded-xl" />
				</div>
			) : (
				<div className="space-y-3">
					{(docsQuery.data ?? []).map((doc) => (
						<DocumentCard
							key={doc.kind}
							kind={doc.kind as DocKind}
							isGated={doc.isGated}
							isCleared={doc.isCleared}
							canDownload={doc.canDownload}
						/>
					))}
				</div>
			)}

			<section className="space-y-3">
				<h2 className="font-semibold text-sm">
					{t("student.documents.history.title")}
				</h2>
				<DownloadHistorySection />
			</section>
		</div>
	);
}
