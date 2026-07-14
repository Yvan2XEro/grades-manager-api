import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { HubNav } from "@/components/navigation/HubNav";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { trpc } from "@/utils/trpc";

const TABS = [
	{ path: "details", labelKey: "admin.teachingUnits.tabs.details" },
	{ path: "courses", labelKey: "admin.teachingUnits.tabs.courses" },
] as const;

export default function TeachingUnitDetail() {
	const { teachingUnitId } = useParams<{ teachingUnitId: string }>();
	const { t } = useTranslation();
	const isCreating = teachingUnitId === "new";

	const { data: teachingUnit, isLoading } = useQuery({
		...trpc.teachingUnits.getById.queryOptions({ id: teachingUnitId! }),
		enabled: !isCreating,
	});

	if (!isCreating && isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Spinner className="h-8 w-8" />
			</div>
		);
	}

	if (!isCreating && !teachingUnit) {
		return (
			<div className="py-12 text-center text-muted-foreground">
				{t("common.notFound")}
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-start gap-4">
				<Button variant="ghost" size="icon" asChild>
					<Link to="/admin/programs/teaching-units">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div className="flex items-center gap-3">
					<BookOpen className="h-5 w-5 text-primary" />
					<div>
						<h1 className="font-semibold text-xl">
							{isCreating
								? t("admin.teachingUnits.actions.create", {
										defaultValue: "Create UE",
									})
								: teachingUnit!.name}
						</h1>
						{!isCreating && (
							<p className="text-muted-foreground text-sm">
								{teachingUnit!.code}
							</p>
						)}
					</div>
				</div>
			</div>
			{!isCreating && (
				<HubNav
					tabs={TABS}
					basePath={`/admin/programs/teaching-units/${teachingUnitId}`}
				/>
			)}
		</div>
	);
}
