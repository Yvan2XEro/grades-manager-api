import { motion } from "framer-motion";
import { Building2, ChevronLeft } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { Spinner } from "@/components/ui/spinner";
import {
	loginContainer as container,
	loginItem as item,
} from "../services/login-motion";
import type { Organization } from "../types";

type OrgPickerProps = {
	orgs: Organization[];
	onSelect: (org: Organization) => Promise<void>;
	onBack: () => void;
};

/** Cloud mode: institution choice after login. */
export const OrgPicker: React.FC<OrgPickerProps> = ({
	orgs,
	onSelect,
	onBack,
}) => {
	const { t } = useTranslation();
	const [selecting, setSelecting] = React.useState<string | null>(null);

	const handleSelect = async (org: Organization) => {
		setSelecting(org.id);
		await onSelect(org);
		setSelecting(null);
	};

	return (
		<motion.div
			variants={container}
			initial="hidden"
			animate="visible"
			className="space-y-6"
		>
			<motion.div variants={item}>
				<h2 className="text-foreground">
					{t("auth.orgPicker.title", {
						defaultValue: "Choisissez votre établissement",
					})}
				</h2>
				<p className="mt-2 text-muted-foreground text-sm">
					{t("auth.orgPicker.subtitle", {
						defaultValue:
							"Sélectionnez l'établissement auquel vous souhaitez accéder.",
					})}
				</p>
			</motion.div>

			{orgs.length === 0 ? (
				<motion.div
					variants={item}
					className="rounded-xl border border-dashed p-8 text-center"
				>
					<Building2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
					<p className="text-muted-foreground text-sm">
						{t("auth.orgPicker.noOrgs", {
							defaultValue:
								"Aucun établissement trouvé pour ce compte. Contactez votre administrateur.",
						})}
					</p>
				</motion.div>
			) : (
				<motion.div variants={item} className="space-y-2">
					{orgs.map((org) => (
						<button
							key={org.id}
							type="button"
							onClick={() => handleSelect(org)}
							disabled={selecting !== null}
							className="flex w-full items-center gap-4 rounded-xl border bg-card p-4 text-left shadow-sm transition-colors hover:bg-accent disabled:opacity-60"
						>
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
								{org.logo ? (
									<img
										src={org.logo}
										alt={org.name}
										className="h-8 w-8 rounded object-cover"
									/>
								) : (
									<Building2 className="h-5 w-5 text-primary" />
								)}
							</div>
							<div className="min-w-0 flex-1">
								<p className="truncate font-semibold text-foreground text-sm">
									{org.name}
								</p>
								<p className="truncate text-muted-foreground text-xs">
									{org.slug}
								</p>
							</div>
							{selecting === org.id && (
								<Spinner className="h-4 w-4 shrink-0 text-primary" />
							)}
						</button>
					))}
				</motion.div>
			)}

			<motion.div variants={item}>
				<button
					type="button"
					onClick={onBack}
					className="flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground"
				>
					<ChevronLeft className="h-4 w-4" />
					{t("auth.orgPicker.back", { defaultValue: "Changer de compte" })}
				</button>
			</motion.div>
		</motion.div>
	);
};
