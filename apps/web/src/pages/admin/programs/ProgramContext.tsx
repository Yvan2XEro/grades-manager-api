import { createContext, useContext } from "react";
import type { RouterOutputs } from "@/utils/trpc";

export type ProgramData = NonNullable<RouterOutputs["programs"]["getById"]>;

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
