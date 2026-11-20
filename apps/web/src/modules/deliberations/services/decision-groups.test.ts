import { describe, expect, it } from "vitest";
import { decisionGroups } from "./decision-groups";

const results = [
	{ finalDecision: "admitted" },
	{ finalDecision: "compensated" },
	{ finalDecision: "deferred" },
	{ finalDecision: "repeat" },
	{ finalDecision: "excluded" },
	{ finalDecision: "pending" },
];

describe("decisionGroups", () => {
	it("counts deferred students as repeaters without a retake session", () => {
		expect(decisionGroups(results)).toEqual({
			admitted: 2,
			repeat: 2,
			deferred: 1,
			awaitingRetake: 0,
			excluded: 1,
			undecided: 1,
		});
	});

	it("leaves deferred students to the retake jury that follows", () => {
		expect(decisionGroups(results, { retakeFollows: true })).toEqual({
			admitted: 2,
			repeat: 1,
			deferred: 0,
			awaitingRetake: 1,
			excluded: 1,
			undecided: 1,
		});
	});
});
