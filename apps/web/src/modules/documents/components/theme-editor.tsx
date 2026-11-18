import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	groupDescription,
	groupLabel,
	TAB_GROUP_ORDER,
	type ThemeTab,
	tabLabel,
} from "../services/theme-fields";
import { deepMergeTheme, setIn } from "../services/theme-utils";
import { GroupSection } from "./theme-group-section";

type ThemeValue = Record<string, unknown>;

interface ThemeEditorProps {
	/** Default theme used as the visual baseline (typically returned by `getThemePresets`). */
	defaultTheme: ThemeValue;
	/** Current value: only the fields the user has overridden. Empty `{}` = inherit defaults. */
	value: Partial<ThemeValue>;
	onChange: (next: Partial<ThemeValue>) => void;
	/** When provided, shows a "preset" picker that pre-fills the override blob. */
	presets?: Array<{ id: string; name: string; theme: ThemeValue }>;
}

export function ThemeEditor({
	defaultTheme,
	value,
	onChange,
	presets,
}: ThemeEditorProps) {
	const { t } = useTranslation();
	const merged = useMemo(
		() => deepMergeTheme(defaultTheme, value),
		[defaultTheme, value],
	);

	const tabs: ThemeTab[] = ["typography", "colors", "sizes", "options"];

	const setField = (path: string[], v: unknown) => {
		// Persist override (we always write into `value` even if v equals default —
		// keeps round-trips stable; future: detect equality and prune).
		onChange(setIn(value as Record<string, unknown>, path, v));
	};

	return (
		<div className="space-y-4">
			{presets && presets.length > 0 && (
				<div className="flex items-center gap-2">
					<Label className="text-muted-foreground text-xs">
						{t("admin.documents.theme.preset")}
					</Label>
					<Select
						onValueChange={(presetId) => {
							const p = presets.find((x) => x.id === presetId);
							if (!p) return;
							onChange(p.theme);
						}}
					>
						<SelectTrigger className="h-8 w-48">
							<SelectValue
								placeholder={t("admin.documents.theme.presetPlaceholder")}
							/>
						</SelectTrigger>
						<SelectContent>
							{presets.map((p) => (
								<SelectItem key={p.id} value={p.id}>
									{p.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<button
						type="button"
						onClick={() => onChange({})}
						className="text-muted-foreground text-xs underline hover:text-foreground"
					>
						{t("admin.documents.theme.resetAll")}
					</button>
				</div>
			)}
			<Tabs defaultValue="typography">
				<TabsList>
					{tabs.map((tab) => (
						<TabsTrigger key={tab} value={tab}>
							{tabLabel(tab)}
						</TabsTrigger>
					))}
				</TabsList>
				{tabs.map((tab) => (
					<TabsContent key={tab} value={tab} className="space-y-4">
						{TAB_GROUP_ORDER[tab].map((groupKey) => {
							const group = (merged as Record<string, unknown>)[groupKey];
							if (!group || typeof group !== "object") return null;
							return (
								<GroupSection
									key={groupKey}
									title={groupLabel(groupKey)}
									description={groupDescription(groupKey)}
									group={group as Record<string, unknown>}
									path={[groupKey]}
									setField={setField}
									valueOverride={
										(value[groupKey] as Record<string, unknown> | undefined) ??
										null
									}
								/>
							);
						})}
					</TabsContent>
				))}
			</Tabs>
		</div>
	);
}
