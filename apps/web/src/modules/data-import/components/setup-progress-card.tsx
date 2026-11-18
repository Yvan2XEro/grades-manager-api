import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useImportOverview } from "../hooks/use-import-overview";
import { isEmptyInstitution, setupMilestones } from "../services/import-steps";
import { SetupProgress } from "./setup-progress";

const DISMISSED_KEY = "tkams.setup-card-dismissed";
const WELCOMED_KEY = "tkams.setup-welcomed";

const readFlag = (key: string) => {
	try {
		return localStorage.getItem(key) === "1";
	} catch {
		return false;
	}
};
const setFlag = (key: string) => {
	try {
		localStorage.setItem(key, "1");
	} catch {
		// storage unavailable: the card simply shows again next time
	}
};

/**
 * Dashboard reminder of the setup while it is incomplete. On the very first
 * visit of an empty institution, opens the setup page directly.
 */
export function SetupProgressCard() {
	const { t } = useTranslation();
	const { data } = useImportOverview();
	const navigate = useNavigate();
	const [dismissed, setDismissed] = useState(() => readFlag(DISMISSED_KEY));

	useEffect(() => {
		if (data && isEmptyInstitution(data) && !readFlag(WELCOMED_KEY)) {
			setFlag(WELCOMED_KEY);
			navigate("/import", { replace: true });
		}
	}, [data, navigate]);

	if (!data || dismissed) return null;
	const milestones = setupMilestones(data, t);
	if (milestones.every((m) => m.done)) return null;

	return (
		<SetupProgress
			compact
			milestones={milestones}
			onDismiss={() => {
				setFlag(DISMISSED_KEY);
				setDismissed(true);
			}}
		/>
	);
}
