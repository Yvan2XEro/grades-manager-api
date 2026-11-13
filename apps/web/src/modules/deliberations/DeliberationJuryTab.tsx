import { useTranslation } from "react-i18next";
import { StatusStepper } from "@/components/ui/status-stepper";
import { useDeliberationContext } from "./DeliberationContext";

export default function DeliberationJuryTab() {
	const { t } = useTranslation();
	const { delib } = useDeliberationContext();

	const status = delib.status;

	return (
		<div className="space-y-6 pt-6">
			{/* Status workflow stepper */}
			<StatusStepper
				steps={[
					{ key: "draft", label: t("admin.deliberations.status.draft") },
					{ key: "open", label: t("admin.deliberations.status.open") },
					{ key: "closed", label: t("admin.deliberations.status.closed") },
					{ key: "signed", label: t("admin.deliberations.status.signed") },
				]}
				currentStatus={status}
			/>

			{/* Jury + Lifecycle grid */}
			<div className="grid gap-4 md:grid-cols-2">
				{/* Jury */}
				<div className="rounded-xl border bg-card p-5 shadow-sm">
					<h3 className="mb-3 font-medium text-foreground text-sm">
						{t("admin.deliberations.detail.jury")}
					</h3>
					<dl className="space-y-2 text-sm">
						{delib.juryNumber && (
							<div className="flex justify-between">
								<dt className="text-muted-foreground">
									{t("admin.deliberations.detail.juryNumber", {
										defaultValue: "N° jury",
									})}
								</dt>
								<dd className="font-medium">{delib.juryNumber}</dd>
							</div>
						)}
						<div className="flex justify-between">
							<dt className="text-muted-foreground">
								{t("admin.deliberations.detail.president")}
							</dt>
							<dd className="font-medium">
								{delib.president
									? `${delib.president.firstName} ${delib.president.lastName}`
									: t("admin.deliberations.detail.noPresident")}
							</dd>
						</div>
						{(delib.juryMembers ?? []).map(
							(m: { role: string; name: string }, i: number) => (
								<div key={i} className="flex justify-between">
									<dt className="text-muted-foreground">{m.role}</dt>
									<dd>{m.name}</dd>
								</div>
							),
						)}
					</dl>
				</div>

				{/* Lifecycle */}
				<div className="rounded-xl border bg-card p-5 shadow-sm">
					<h3 className="mb-3 font-medium text-foreground text-sm">
						{t("admin.deliberations.detail.lifecycle")}
					</h3>
					<dl className="space-y-2 text-sm">
						<div className="flex justify-between">
							<dt className="text-muted-foreground">
								{t("admin.deliberations.detail.openedAt")}
							</dt>
							<dd>
								{delib.openedAt
									? new Date(delib.openedAt).toLocaleString()
									: t("admin.deliberations.detail.notYet")}
							</dd>
						</div>
						<div className="flex justify-between">
							<dt className="text-muted-foreground">
								{t("admin.deliberations.detail.closedAt")}
							</dt>
							<dd>
								{delib.closedAt
									? new Date(delib.closedAt).toLocaleString()
									: t("admin.deliberations.detail.notYet")}
							</dd>
						</div>
						<div className="flex justify-between">
							<dt className="text-muted-foreground">
								{t("admin.deliberations.detail.signedAt")}
							</dt>
							<dd>
								{delib.signedAt
									? new Date(delib.signedAt).toLocaleString()
									: t("admin.deliberations.detail.notYet")}
							</dd>
						</div>
					</dl>
				</div>
			</div>
		</div>
	);
}
