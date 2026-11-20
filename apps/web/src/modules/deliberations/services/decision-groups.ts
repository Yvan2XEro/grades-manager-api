/** Counts of the groups the jury's final decisions split a class into. */
export interface DecisionGroups {
	/** Admitted or compensated: promoted, or graduated on the last level. */
	admitted: number;
	/** Repeating, deferred included unless a retake jury follows. */
	repeat: number;
	/** Deferred students counted in `repeat`. */
	deferred: number;
	/** Deferred students left to the retake jury that follows (annual jury). */
	awaitingRetake: number;
	excluded: number;
	/** No final decision yet (pending, incomplete results). */
	undecided: number;
}

/**
 * `retakeFollows`: a retake jury follows this annual jury, so its deferred
 * students sit the retake session instead of repeating (as the server does).
 */
export function decisionGroups(
	results: ReadonlyArray<{ finalDecision?: string | null }>,
	opts: { retakeFollows?: boolean } = {},
): DecisionGroups {
	const groups: DecisionGroups = {
		admitted: 0,
		repeat: 0,
		deferred: 0,
		awaitingRetake: 0,
		excluded: 0,
		undecided: 0,
	};
	for (const { finalDecision } of results) {
		if (finalDecision === "admitted" || finalDecision === "compensated")
			groups.admitted += 1;
		else if (finalDecision === "repeat") groups.repeat += 1;
		else if (finalDecision === "deferred") {
			if (opts.retakeFollows) groups.awaitingRetake += 1;
			else {
				groups.repeat += 1;
				groups.deferred += 1;
			}
		} else if (finalDecision === "excluded") groups.excluded += 1;
		else groups.undecided += 1;
	}
	return groups;
}
