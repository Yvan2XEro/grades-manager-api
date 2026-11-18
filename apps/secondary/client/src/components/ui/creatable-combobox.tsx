import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Combobox,
	type ComboboxOption,
	type ComboboxProps,
} from "@/components/ui/combobox";

interface CreatableComboboxProps extends ComboboxProps {
	/**
	 * Opens a nested Callable to create the missing entity. Resolve with the new
	 * option to select it, or with nothing when the user cancelled.
	 */
	onCreate?: () => Promise<ComboboxOption | null | undefined>;
	/** Accessible label of the "+" button. */
	createLabel?: string;
}

/**
 * Combobox with an aligned "+" button that creates a missing option in place.
 *
 * The caller is responsible for inserting the created entity into the React
 * Query cache feeding `options`; until that refetch lands, the created option
 * is kept locally so the selection never renders as an unknown value.
 */
export function CreatableCombobox({
	onCreate,
	createLabel,
	options,
	onValueChange,
	disabled,
	...props
}: CreatableComboboxProps) {
	const { t } = useTranslation();
	const [creating, setCreating] = useState(false);
	const [created, setCreated] = useState<ComboboxOption | null>(null);

	const mergedOptions =
		created && !options.some((o) => o.value === created.value)
			? [...options, created]
			: options;

	const handleCreate = async () => {
		if (!onCreate) return;
		setCreating(true);
		try {
			const option = await onCreate();
			if (option) {
				setCreated(option);
				onValueChange?.(option.value);
			}
		} finally {
			setCreating(false);
		}
	};

	const label = createLabel ?? t("common.create", "Create");

	return (
		<div className="flex items-center gap-2">
			<div className="min-w-0 flex-1">
				<Combobox
					{...props}
					options={mergedOptions}
					onValueChange={onValueChange}
					disabled={disabled}
				/>
			</div>
			{onCreate && (
				<Button
					type="button"
					variant="outline"
					size="icon"
					className="shrink-0"
					onClick={handleCreate}
					disabled={disabled || creating}
					aria-label={label}
					title={label}
				>
					{creating ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<Plus className="h-4 w-4" />
					)}
				</Button>
			)}
		</div>
	);
}
