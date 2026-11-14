import { Building2, Check, ChevronRight, Circle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { G } from "../services/import-steps";
import type { ImportOverview } from "../types";

/** First setup step: the identity shown on every document (name, logo, contact). */
export function ProfileCard({
	profile,
}: {
	profile: ImportOverview["profile"];
}) {
	const { t } = useTranslation();
	const items = [
		{ key: "name", done: Boolean(profile.name) },
		{ key: "logo", done: profile.hasLogo },
		{ key: "contact", done: profile.hasContact },
		{ key: "address", done: profile.hasAddress },
	];
	const complete = profile.hasLogo && profile.hasContact;

	return (
		<Card>
			<CardHeader className="flex flex-row items-start justify-between gap-4">
				<div className="space-y-1">
					<CardTitle className="flex items-center gap-2 text-base">
						<Building2 className="h-4 w-4 text-muted-foreground" />
						{t(`${G}profile.title`)}
					</CardTitle>
					<p className="text-muted-foreground text-sm">
						{t(`${G}profile.text`)}
					</p>
				</div>
				<Button
					asChild
					size="sm"
					variant={complete ? "outline" : "default"}
					className="shrink-0"
				>
					<Link to="/institution/overview">
						{complete ? t(`${G}profile.edit`) : t(`${G}profile.complete`)}
						<ChevronRight className="ml-1 h-4 w-4" />
					</Link>
				</Button>
			</CardHeader>
			<CardContent>
				<ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
					{items.map((item) => (
						<li key={item.key} className="flex items-center gap-2">
							{item.done ? (
								<Check className="h-4 w-4 text-primary" />
							) : (
								<Circle className="h-4 w-4 text-muted-foreground/50" />
							)}
							<span className={item.done ? undefined : "text-muted-foreground"}>
								{t(`${G}profile.${item.key}`)}
							</span>
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
}
