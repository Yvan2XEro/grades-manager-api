import type { RuleProperties } from "json-rules-engine";

export const promotionRules: RuleProperties[] = [
	{
		name: "default-credit-threshold",
		conditions: {
			all: [
				{
					fact: "creditsEarned",
					operator: "greaterThanInclusive",
					value: {
						fact: "requiredCredits",
					},
				},
			],
		},
		event: {
			type: "promotion-eligible",
			params: {
				message: "Student meets minimum credits",
			},
		},
	},
];
