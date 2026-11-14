import { createContext, useContext } from "react";
import type { ProgramData } from "../types";

export type { ProgramData } from "../types";

export interface ProgramContextValue {
	program: ProgramData;
	refetch: () => void;
}

export const ProgramContext = createContext<ProgramContextValue | null>(null);

export function useProgramContext(): ProgramContextValue {
	const ctx = useContext(ProgramContext);
	if (!ctx)
		throw new Error("useProgramContext must be used within ProgramDetail");
	return ctx;
}
