import { createContext, useContext } from "react";
import type { ClassData } from "../types";

export interface ClassContextValue {
	cls: ClassData;
	refetch: () => void;
}

/** Class loaded by the class detail layout, shared with its tabs. */
export const ClassContext = createContext<ClassContextValue | null>(null);

export function useClassContext(): ClassContextValue {
	const ctx = useContext(ClassContext);
	if (!ctx)
		throw new Error("useClassContext must be used within the class detail");
	return ctx;
}
