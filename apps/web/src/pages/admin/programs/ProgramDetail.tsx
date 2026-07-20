import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { HubNav } from "@/components/navigation/HubNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { trpc } from "@/utils/trpc";
import { ProgramContext } from "./ProgramContext";

const TABS = [
	{ path: "details", labelKey: "programs.hub.tabs.details" },
	{ path: "options", labelKey: "programs.hub.tabs.options" },
	{ path: "templates", labelKey: "programs.hub.tabs.templates" },
] as const;

export default function ProgramDetail() {
	const { programId } = useParams<{ programId: string }>();
	const { t } = useTranslation();

	const {
		data: program,
		isLoading,
		refetch,
	} = useQuery(trpc.programs.getById.queryOptions({ id: programId! }));

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Spinner className="h-8 w-8" />
			</div>
		);
	}

	if (!program) {
		return (
			<div className="py-12 text-center text-muted-foreground">
				{t("common.notFound")}
			</div>
		);
	}

	return (
		<ProgramContext.Provider value={{ program, refetch }}>
			<div className="space-y-6">
				<div className="flex items-start gap-4">
					<Button variant="ghost" size="icon" asChild>
						<Link to="/admin/programs/programs">
							<ArrowLeft className="h-4 w-4" />
						</Link>
					</Button>
					<div className="flex items-center gap-3">
						<GraduationCap className="h-5 w-5 text-primary" />
						<div>
							<h1 className="font-semibold text-xl">{program.name}</h1>
							<div className="flex items-center gap-2">
								<p className="text-muted-foreground text-sm">{program.code}</p>
								{program.abbreviation && (
									<Badge variant="outline">{program.abbreviation}</Badge>
								)}
							</div>
						</div>
					</div>
				</div>
				<HubNav tabs={TABS} basePath={`/admin/programs/${programId}`} />
			</div>
		</ProgramContext.Provider>
	);
}
