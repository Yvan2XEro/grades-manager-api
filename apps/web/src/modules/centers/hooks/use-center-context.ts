import { createContext, useContext } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { CenterForm } from "./use-center-form";

export interface CenterContextValue {
	form: UseFormReturn<CenterForm>;
	isSaving: boolean;
	onSubmit: (values: CenterForm) => void;
}

/** Shares the center form of the detail layout with its tabs. */
export const CenterContext = createContext<CenterContextValue | null>(null);

export function useCenterContext(): CenterContextValue {
	const ctx = useContext(CenterContext);
	if (!ctx)
		throw new Error("useCenterContext must be used within CenterDetail");
	return ctx;
}
