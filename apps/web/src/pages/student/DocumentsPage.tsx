import { useMutation, useQuery } from "@tanstack/react-query";
import {
	Clock,
	Download,
	FileText,
	GraduationCap,
	IdCard,
	Lock,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc, trpcClient } from "@/utils/trpc";

function downloadBase64Pdf(base64: string, filename: string) {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	const blob = new Blob([bytes], { type: "application/pdf" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

type DocKind = "transcript" | "attestation" | "enrollment_certificate";

const DOC_CONFIG: Record<
	DocKind,
	{
		icon: React.ReactNode;
		labelKey: string;
		descKey: string;
		blockedKey: string;
	}
> = {
	transcript: {
		icon: <FileText className="h-6 w-6 text-primary" />,
		labelKey: "student.documents.transcript.title",
		descKey: "student.documents.transcript.description",
		blockedKey: "student.documents.transcript.blocked",
	},
	attestation: {
		icon: <GraduationCap className="h-6 w-6 text-violet-600" />,
		labelKey: "student.documents.attestation.title",
		descKey: "student.documents.attestation.description",
		blockedKey: "student.documents.attestation.blocked",
	},
	enrollment_certificate: {
		icon: <IdCard className="h-6 w-6 text-sky-600" />,
		labelKey: "student.documents.enrollment_certificate.title",
		descKey: "student.documents.enrollment_certificate.description",
		blockedKey: "student.documents.enrollment_certificate.blocked",
	},
};

function DocumentCard({
	kind,
	isGated,
	isCleared,
	canDownload,
}: {
	kind: DocKind;
	isGated: boolean;
	isCleared: boolean;
	canDownload: boolean;
}) {
	const { t } = useTranslation();
	const cfg = DOC_CONFIG[kind];

	const generateMut = useMutation({
		mutationFn: () =>
			trpcClient.academicDocuments.myGenerateDocument.mutate({ kind }),
		onSuccess: (res) => {
			downloadBase64Pdf(res.data, res.filename);
		},
	});

	return (
		<div className="rounded-xl border bg-card p-5 shadow-sm">
			<div className="flex items-start gap-4">
				<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-muted/50">
					{cfg.icon}
				</div>
				<div className="min-w-0 flex-1">
					<p className="font-semibold text-foreground text-sm">
						{t(cfg.labelKey as Parameters<typeof t>[0])}
					</p>
					<p className="mt-1 text-muted-foreground text-xs">
						{t(cfg.descKey as Parameters<typeof t>[0])}
					</p>

					{isGated && !isCleared && (
						<div className="mt-3 flex items-center gap-1.5 text-amber-700 text-xs dark:text-amber-400">
							<Lock className="h-3.5 w-3.5" />
							<span>{t(cfg.blockedKey as Parameters<typeof t>[0])}</span>
						</div>
					)}

					{generateMut.isError && (
						<Alert variant="destructive" className="mt-3 py-2">
							<AlertDescription className="text-xs">
								{t("student.documents.generateError")}
							</AlertDescription>
						</Alert>
					)}
				</div>

				<Button
					size="sm"
					disabled={!canDownload || generateMut.isPending}
					onClick={() => generateMut.mutate()}
					className="shrink-0"
				>
					<Download className="mr-1.5 h-4 w-4" />
					{generateMut.isPending
						? t("student.documents.generating")
						: t("student.documents.download")}
				</Button>
			</div>
		</div>
	);
}

function DownloadHistorySection() {
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
