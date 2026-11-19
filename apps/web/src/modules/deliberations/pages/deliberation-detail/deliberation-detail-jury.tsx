import { Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/date-format";
import { DeliberationStatusStepper } from "../../components/deliberation-status-stepper";
import { JuryCompositionDialog } from "../../components/jury-composition-dialog";
import { useInvalidateDeliberation } from "../../hooks/use-deliberation";
import { useDeliberationContext } from "../../hooks/use-deliberation-context";
import {
	JURY_MEMBER_ROLE,
	type JuryMember,
	splitJury,
} from "../../services/jury";

export default function DeliberationJuryTab() {
	const { t } = useTranslation();
	const { delib, deliberationId, isSigned } = useDeliberationContext();
	const invalidate = useInvalidateDeliberation(deliberationId);

	const status = delib.status;
	const juryMembers = (delib.juryMembers ?? []) as JuryMember[];
	const jury = splitJury(juryMembers);
	const presidentName = delib.president
		? `${delib.president.firstName} ${delib.president.lastName}`
		: (jury.president?.name ?? null);

	const editJury = async () => {
		const saved = await JuryCompositionDialog.call({
			deliberationId,
			juryMembers,
			juryNumber: delib.juryNumber ?? null,
		});
		if (saved) invalidate();
	};

	return (
		<div className="space-y-6 pt-6">
			{/* Status workflow stepper */}
			<DeliberationStatusStepper currentStatus={status} />

			{/* Jury + Lifecycle grid */}
			<div className="grid gap-4 md:grid-cols-2">
				{/* Jury */}
				<div className="rounded-xl border bg-card p-5 shadow-sm">
					<div className="mb-3 flex items-center justify-between gap-2">
						<h3 className="font-medium text-foreground text-sm">
							{t("admin.deliberations.detail.jury")}
						</h3>
						{!isSigned && (
							<Button variant="outline" size="sm" onClick={editJury}>
								<Pencil className="mr-1.5 h-3.5 w-3.5" />
								{t("admin.deliberations.juryEdit.edit")}
							</Button>
						)}
					</div>
					<dl className="space-y-2 text-sm">
						{delib.juryNumber && (
							<div className="flex justify-between">
								<dt className="text-muted-foreground">
									{t("admin.deliberations.detail.juryNumber")}
								</dt>
								<dd className="font-medium">{delib.juryNumber}</dd>
							</div>
						)}
						<div className="flex justify-between">
							<dt className="text-muted-foreground">
								{t("admin.deliberations.detail.president")}
							</dt>
							<dd className="font-medium">
								{presidentName ?? (
									<span className="text-amber-600 dark:text-amber-400">
										{t("admin.deliberations.detail.noPresident")}
									</span>
								)}
							</dd>
						</div>
						{jury.members.length === 0 ? (
							<div className="flex justify-between">
								<dt className="text-muted-foreground">
									{t("admin.deliberations.juryEdit.members")}
								</dt>
								<dd className="text-muted-foreground">
									{t("admin.deliberations.detail.noMembers")}
								</dd>
							</div>
						) : (
							jury.members.map((m, i) => (
								<div key={`${m.name}-${i}`} className="flex justify-between">
									<dt className="text-muted-foreground">
										{m.role === JURY_MEMBER_ROLE
											? t("admin.deliberations.detail.member")
											: m.role}
									</dt>
									<dd>{m.name}</dd>
								</div>
							))
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
									? formatDate(delib.openedAt, "PPp")
									: t("admin.deliberations.detail.notYet")}
							</dd>
						</div>
						<div className="flex justify-between">
							<dt className="text-muted-foreground">
								{t("admin.deliberations.detail.closedAt")}
							</dt>
							<dd>
								{delib.closedAt
									? formatDate(delib.closedAt, "PPp")
									: t("admin.deliberations.detail.notYet")}
							</dd>
						</div>
						<div className="flex justify-between">
							<dt className="text-muted-foreground">
								{t("admin.deliberations.detail.signedAt")}
							</dt>
							<dd>
								{delib.signedAt
									? formatDate(delib.signedAt, "PPp")
									: t("admin.deliberations.detail.notYet")}
							</dd>
						</div>
					</dl>
				</div>
			</div>
		</div>
	);
}
