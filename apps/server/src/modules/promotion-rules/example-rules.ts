/**
 * Example promotion rules that can be used as templates.
 * These demonstrate various criteria for student promotion.
 */

import type { RuleProperties } from "json-rules-engine";

/**
 * Standard promotion: Average >= 10, Credits >= 30, No eliminatory failures
 */
export const standardPromotionRule: RuleProperties = {
	name: "standard-promotion",
	conditions: {
		all: [
			{
				fact: "overallAverage",
				operator: "greaterThanInclusive",
				value: 10,
			},
			{
				fact: "creditsEarned",
				operator: "greaterThanInclusive",
				value: 30,
			},
			{
				fact: "eliminatoryFailures",
				operator: "equal",
				value: 0,
			},
		],
	},
	event: {
		type: "promotion-eligible",
		params: {
			message: "Student meets standard promotion criteria",
		},
	},
};

/**
 * Promotion with compensation: Average >= 10, max 2 failures, no scores < 8
 */
export const compensationPromotionRule: RuleProperties = {
	name: "compensation-promotion",
	conditions: {
		all: [
			{
				fact: "overallAverage",
				operator: "greaterThanInclusive",
				value: 10,
			},
			{
				fact: "creditsEarned",
				operator: "greaterThanInclusive",
				value: 28,
			},
			{
				fact: "failedCoursesCount",
				operator: "lessThanInclusive",
				value: 2,
			},
			{
				fact: "lowestScore",
				operator: "greaterThanInclusive",
				value: 8,
			},
		],
	},
	event: {
		type: "promotion-eligible",
		params: {
			message: "Student eligible with compensation",
		},
	},
};

/**
 * Conditional promotion with academic debt
 */
export const conditionalPromotionRule: RuleProperties = {
	name: "conditional-promotion",
	conditions: {
		all: [
			{
				fact: "overallAverage",
				operator: "greaterThanInclusive",
				value: 10,
			},
			{
				fact: "creditDeficit",
				operator: "lessThanInclusive",
				value: 10,
			},
			{
				fact: "successRate",
				operator: "greaterThanInclusive",
				value: 0.75,
			},
		],
	},
	event: {
		type: "promotion-eligible",
		params: {
			message: "Student eligible with conditional promotion",
		},
	},
};

/**
 * Excellence promotion: High grades, full credits
 */
export const excellencePromotionRule: RuleProperties = {
	name: "excellence-promotion",
	conditions: {
		all: [
			{
				fact: "overallAverage",
				operator: "greaterThanInclusive",
				value: 14,
			},
			{
				fact: "creditsEarned",
				operator: "greaterThanInclusive",
				value: 40,
			},
			{
				fact: "failedCoursesCount",
				operator: "equal",
				value: 0,
			},
		],
	},
	event: {
		type: "promotion-eligible",
		params: {
			message: "Student qualifies for excellence promotion",
		},
	},
};

/**
 * Repeat year (redoublement): Failed criteria
 */
export const repeatYearRule: RuleProperties = {
	name: "repeat-year",
	conditions: {
		any: [
			{
				fact: "eliminatoryFailures",
				operator: "greaterThan",
				value: 0,
			},
			{
				fact: "creditCompletionRate",
				operator: "lessThan",
				value: 0.5,
			},
			{
				fact: "overallAverage",
				operator: "lessThan",
				value: 8,
			},
		],
	},
	event: {
		type: "repeat-year-required",
		params: {
			message: "Student must repeat the year",
		},
	},
};

/**
 * Credit-based promotion: Focus on credits rather than average
 */
export const creditBasedPromotionRule: RuleProperties = {
	name: "credit-based-promotion",
	conditions: {
		all: [
			{
				fact: "creditsEarned",
				operator: "greaterThanInclusive",
				value: 35,
			},
			{
				fact: "creditCompletionRate",
				operator: "greaterThanInclusive",
				value: 0.85,
			},
			{
				fact: "overallAverage",
				operator: "greaterThanInclusive",
				value: 9,
			},
		],
	},
	event: {
		type: "promotion-eligible",
		params: {
			message: "Student meets credit-based promotion criteria",
		},
	},
};

/**
 * Unit-based promotion: All teaching units validated
 */
export const unitBasedPromotionRule: RuleProperties = {
	name: "unit-based-promotion",
	conditions: {
		all: [
			{
				fact: "failedTeachingUnitsCount",
				operator: "equal",
				value: 0,
			},
			{
				fact: "unitValidationRate",
				operator: "equal",
				value: 1,
			},
			{
				fact: "lowestUnitAverage",
				operator: "greaterThanInclusive",
				value: 10,
			},
		],
	},
	event: {
		type: "promotion-eligible",
		params: {
			message: "Student validated all teaching units",
		},
	},
};

/**
 * Progressive promotion: Good trajectory, on track
 */
export const progressivePromotionRule: RuleProperties = {
	name: "progressive-promotion",
	conditions: {
		all: [
			{
				fact: "isOnTrack",
				operator: "equal",
				value: true,
			},
			{
				fact: "canReachRequiredCredits",
				operator: "equal",
				value: true,
			},
			{
				fact: "performanceIndex",
				operator: "greaterThanInclusive",
				value: 60,
			},
		],
	},
	event: {
		type: "promotion-eligible",
		params: {
			message: "Student on track for promotion",
		},
	},
};

/**
 * Combined rule with multiple conditions
 */
export const comprehensivePromotionRule: RuleProperties = {
	name: "comprehensive-promotion",
	conditions: {
		all: [
			// Average requirement
			{
				fact: "overallAverage",
				operator: "greaterThanInclusive",
				value: 10,
			},
			// Credit requirement
			{
				fact: "creditsEarned",
				operator: "greaterThanInclusive",
				value: 30,
			},
			// No eliminatory failures
			{
				fact: "eliminatoryFailures",
				operator: "equal",
				value: 0,
			},
			// Max 3 failed courses
			{
				fact: "failedCoursesCount",
				operator: "lessThanInclusive",
				value: 3,
			},
			// At least 75% success rate
			{
				fact: "successRate",
				operator: "greaterThanInclusive",
				value: 0.75,
			},
			// On track
			{
				fact: "isOnTrack",
				operator: "equal",
				value: true,
			},
		],
	},
	event: {
		type: "promotion-eligible",
		params: {
			message: "Student meets comprehensive promotion criteria",
		},
	},
};

/**
 * All example rules exported as an array
 */
export const exampleRules = [
	standardPromotionRule,
	compensationPromotionRule,
	conditionalPromotionRule,
	excellencePromotionRule,
	repeatYearRule,
	creditBasedPromotionRule,
	unitBasedPromotionRule,
	progressivePromotionRule,
	comprehensivePromotionRule,
];
