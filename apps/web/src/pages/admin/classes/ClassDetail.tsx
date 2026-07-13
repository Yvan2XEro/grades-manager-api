import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, Outlet, useParams } from "react-router";
import { HubNav } from "@/components/navigation/HubNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { trpc } from "@/utils/trpc";
import { ClassContext } from "./ClassContext";

const TABS = [
	{ path: "details", labelKey: "classes.hub.tabs.details" },
	{ path: "students", labelKey: "classes.hub.tabs.students" },
	{ path: "courses", labelKey: "classes.hub.tabs.courses" },
] as const;

export default function ClassDetail() {
	const { classId } = useParams<{ classId: string }>();
	const { t } = useTranslation();

	const {
		data: cls,
		isLoading,
		refetch,
	} = useQuery(trpc.classes.getById.queryOptions({ id: classId! }));

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Spinner className="h-8 w-8" />
			</div>
		);
	}

	if (!cls) {
		return (
			<div className="py-12 text-center text-muted-foreground">
				{t("common.notFound")}
			</div>
		);
	}

	return (
		<ClassContext.Provider value={{ cls, refetch }}>
			<div className="space-y-6">
				<div className="flex items-start gap-4">
					<Button variant="ghost" size="icon" asChild>
						<Link to="/admin/classes/classes">
							<ArrowLeft className="h-4 w-4" />
						</Link>
					</Button>
					<div className="flex items-center gap-3">
						<Users className="h-5 w-5 text-primary" />
						<div>
							<h1 className="font-semibold text-xl">{cls.code}</h1>
							<div className="flex items-center gap-2">
								<p className="text-muted-foreground text-sm">{cls.name}</p>
								{cls.academicYearInfo?.name && (
									<Badge variant="secondary">{cls.academicYearInfo.name}</Badge>
								)}
							</div>
						</div>
					</div>
				</div>
				<HubNav tabs={TABS} basePath={`/admin/classes/${classId}`} />
				<Outlet />
			</div>
		</ClassContext.Provider>
	);
}
