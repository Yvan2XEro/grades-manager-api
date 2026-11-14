import { useState } from "react";
import { createCallable } from "react-call";
import { useMutationFlow } from "react-call/mutation-flow";
import { useTranslation } from "react-i18next";
import { DIALOG_EXIT_MS } from "@/components/callable/callable-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
import { DEFAULT_PREFERENCES, type PreferencesType } from "../types";

/** Edits a guardian's notification preferences; resolves `true` once saved. */
export const GuardianPreferencesSheet = createCallable<
	{
		id: string;
		name: string;
		preferences: PreferencesType;
		onSaved: () => void;
	},
	boolean
>(({ call, id, name, preferences: initialPreferences, onSaved }) => {
	const { t } = useTranslation();
	const [preferences, setPreferences] =
		useState<PreferencesType>(initialPreferences);

	const save = useMutationFlow(call, async (call) => {
		try {
			await trpcClient.guardians.updatePreferences.mutate({
				guardianId: id,
				preferences,
			});
			toast.success(t("guardians.admin.toasts.preferencesSaved"));
			onSaved();
			call.end(true);
		} catch (err) {
			toast.error((err as Error).message);
		}
	});

	return (
		<Sheet
			open={!call.ended}
			onOpenChange={(o) => !o && !save.pending && call.end(false)}
		>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>
						{t("guardians.admin.editPreferences", {
							defaultValue: "Edit preferences",
						})}{" "}
						— {name}
					</SheetTitle>
				</SheetHeader>
				<div className="space-y-4 px-1 pt-6">
					{Object.entries(DEFAULT_PREFERENCES).map(([key]) => (
						<label key={key} className="flex items-center gap-3 text-sm">
							<Checkbox
								checked={preferences[key as keyof PreferencesType] !== false}
								onCheckedChange={(v) =>
									setPreferences((prev) => ({ ...prev, [key]: v === true }))
								}
							/>
							{t(`guardians.preferences.${key}`)}
						</label>
					))}
					<Button
						className="mt-4 w-full"
						disabled={save.pending}
						onClick={() => save()}
					>
						{t("common.actions.saveChanges")}
					</Button>
				</div>
			</SheetContent>
		</Sheet>
	);
}, DIALOG_EXIT_MS);
