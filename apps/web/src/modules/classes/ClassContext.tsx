import { createContext, useContext } from "react";
import type { RouterOutputs } from "@/utils/trpc";

export type ClassData = NonNullable<RouterOutputs["classes"]["getById"]>;

export interface ClassContextValue {
	cls: ClassData;
	refetch: () => void;
}

export const ClassContext = createContext<ClassContextValue | null>(null);

export function useClassContext(): ClassContextValue {
	const ctx = useContext(ClassContext);
	if (!ctx) throw new Error("useClassContext must be used within ClassDetail");
	return ctx;
}
