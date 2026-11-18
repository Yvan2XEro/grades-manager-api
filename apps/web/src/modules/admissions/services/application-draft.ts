import type { WizardValues } from "./application-schema";

const DRAFT_KEY = "admission_draft_v2";

export type ApplicationDraft = { step: number; form: WizardValues };

export function readDraft(): ApplicationDraft | null {
	const raw = localStorage.getItem(DRAFT_KEY);
	if (!raw) return null;
	try {
		const d = JSON.parse(raw) as ApplicationDraft;
		if (d.form && d.step) return d;
	} catch {
		/* ignore */
	}
	return null;
}

export function saveDraft(draft: { step: number; form: unknown }) {
	localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function clearDraft() {
	localStorage.removeItem(DRAFT_KEY);
}
