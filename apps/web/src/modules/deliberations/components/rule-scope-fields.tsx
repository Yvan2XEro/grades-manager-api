import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { ScopeOption } from "../hooks/use-rule-scope-options";
import { DELIBERATION_TYPES } from "../services/deliberation-status";
import type { RuleFormState } from "../types";

const ALL = "__all__";

type Scope = Pick<
	RuleFormState,
	"programId" | "cycleLevelId" | "deliberationType"
>;

interface RuleScopeFieldsProps {
	value: Scope;
	onChange: (patch: Partial<Scope>) => void;
	programs: ScopeOption[];
	levels: ScopeOption[];
}

function ScopeSelect({
	id,
	label,
	allLabel,
	value,
	options,
	onChange,
}: {
	id: string;
	label: string;
	allLabel: string;
	value: string | null;
	options: ScopeOption[];
	onChange: (value: string | null) => void;
}) {
	return (
		<div className="min-w-0 space-y-2">
			<Label htmlFor={id}>{label}</Label>
			<Select
				value={value ?? ALL}
				onValueChange={(v) => onChange(v === ALL ? null : v)}
			>
				<SelectTrigger id={id} className="w-full">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={ALL}>{allLabel}</SelectItem>
					{options.map((o) => (
						<SelectItem key={o.id} value={o.id}>
							{o.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}

/** Limits a rule to a program, a level and a jury type ("all" by default). */
export function RuleScopeFields({
	value,
	onChange,
	programs,
	levels,
}: RuleScopeFieldsProps) {
	const { t } = useTranslation();
	return (
		<fieldset className="space-y-2">
			<legend className="font-medium text-sm">
				{t("admin.deliberations.rules.scope.title")}
			</legend>
			<p className="text-muted-foreground text-xs">
				{t("admin.deliberations.rules.scope.help")}
			</p>
			<div className="grid gap-3 sm:grid-cols-3">
				<ScopeSelect
					id="rule-scope-program"
					label={t("admin.deliberations.rules.scope.program")}
					allLabel={t("admin.deliberations.rules.scope.allPrograms")}
					value={value.programId}
					options={programs}
					onChange={(programId) => onChange({ programId })}
				/>
				<ScopeSelect
					id="rule-scope-level"
					label={t("admin.deliberations.rules.scope.level")}
					allLabel={t("admin.deliberations.rules.scope.allLevels")}
					value={value.cycleLevelId}
					options={levels}
					onChange={(cycleLevelId) => onChange({ cycleLevelId })}
				/>
				<ScopeSelect
					id="rule-scope-type"
					label={t("admin.deliberations.rules.scope.type")}
					allLabel={t("admin.deliberations.rules.scope.allTypes")}
					value={value.deliberationType}
					options={DELIBERATION_TYPES.map((type) => ({
						id: type,
						label: t(`admin.deliberations.type.${type}`),
					}))}
					onChange={(deliberationType) => onChange({ deliberationType })}
				/>
			</div>
		</fieldset>
	);
}
