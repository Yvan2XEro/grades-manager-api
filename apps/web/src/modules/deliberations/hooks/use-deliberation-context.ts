import { createContext, useContext } from "react";
import type { Deliberation, LogEntry, OverrideState } from "../types";

export interface DeliberationContextValue {
	deliberationId: string;
	delib: Deliberation;
	isOpen: boolean;
	isDraft: boolean;
	isClosed: boolean;
	isSigned: boolean;
	logsLoading: boolean;
	logs: LogEntry[];
	/** Opens the decision-override dialog for one student result. */
	overrideDecision: (s: OverrideState) => void;
	/** Opens the dialog promoting admitted students to their next class. */
	promoteAdmitted: () => void;
}

export const DeliberationContext =
	createContext<DeliberationContextValue | null>(null);

export function useDeliberationContext(): DeliberationContextValue {
	const ctx = useContext(DeliberationContext);
	if (!ctx)
		throw new Error(
			"useDeliberationContext must be used within DeliberationDetail",
		);
	return ctx;
}
