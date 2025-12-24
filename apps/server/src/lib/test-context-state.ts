import type { Institution } from "@/db/schema/app-schema";

let currentInstitution: Institution | null = null;

export function setTestInstitution(institution: Institution) {
	currentInstitution = institution;
}

export function getTestInstitution() {
	if (!currentInstitution) {
		throw new Error("Test institution not initialized");
	}
	return currentInstitution;
}
