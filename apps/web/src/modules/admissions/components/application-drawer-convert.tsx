import { GraduationCap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { QuickCreate } from "@/components/callable/quick-create";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { ApplicationReview } from "../hooks/use-application-review";
import { DrawerSection } from "./drawer-section";

/** Turns an accepted application into a student (drawer version). */
export function ApplicationDrawerConvert({
	review: {
		classes,
		targetClassId,
		setTargetClassId,
		registrationNumber,
		setRegistrationNumber,
		createClass: onCreateClass,
		convert,
	},
}: {
	review: ApplicationReview;
}) {
	const { t } = useTranslation();
	return (
		<DrawerSection title={t("admissions.admin.convertTitle")}>
			<div className="grid gap-3 sm:grid-cols-2">
				<div className="space-y-1.5">
					<Label>{t("admissions.fields.class")}</Label>
					<QuickCreate
						onCreate={onCreateClass}
						label={t("admin.classes.actions.add")}
					>
						<Select value={targetClassId} onValueChange={setTargetClassId}>
							<SelectTrigger>
								<SelectValue
									placeholder={t("admissions.admin.useApplicationClass")}
								/>
							</SelectTrigger>
							<SelectContent>
								{classes.map((k) => (
									<SelectItem key={k.id} value={k.id}>
										{k.name} ({k.code})
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</QuickCreate>
				</div>
				<div className="space-y-1.5">
					<Label>{t("admissions.admin.registrationNumber")}</Label>
					<Input
						value={registrationNumber}
						onChange={(e) => setRegistrationNumber(e.target.value)}
						placeholder={t("admissions.admin.autoRegistration")}
					/>
				</div>
			</div>
			<Button
				className="mt-3"
				onClick={() => convert.mutate()}
				disabled={convert.isPending}
			>
				<GraduationCap className="mr-2 size-4" />
				{t("admissions.admin.convert")}
			</Button>
		</DrawerSection>
	);
}
