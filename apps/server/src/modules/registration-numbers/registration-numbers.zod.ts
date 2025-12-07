import z from "zod";
import {
	registrationCounterScopes,
	registrationFormatFields,
} from "@/db/schema/registration-number-types";

const literalSegmentSchema = z.object({
	kind: z.literal("literal"),
	value: z.string().min(1),
});

const fieldSegmentSchema = z.object({
	kind: z.literal("field"),
	field: z.enum(registrationFormatFields),
	transform: z.enum(["upper", "lower", "none"]).optional(),
	length: z.number().int().min(1).max(32).optional(),
	format: z.enum(["yy", "yyyy"]).optional(),
	fallback: z.string().optional(),
});

const counterSegmentSchema = z.object({
	kind: z.literal("counter"),
	width: z.number().int().min(1).max(12).optional(),
	scope: z.array(z.enum(registrationCounterScopes)).min(1).optional(),
	start: z.number().int().min(0).max(1_000_000).optional(),
	padChar: z.string().length(1).optional(),
});

export const formatDefinitionSchema = z.object({
	segments: z
		.array(
			z.discriminatedUnion("kind", [
				literalSegmentSchema,
				fieldSegmentSchema,
				counterSegmentSchema,
			]),
		)
		.min(1),
});

const baseFormatSchema = z.object({
	name: z.string().min(1),
	description: z.string().optional(),
	definition: formatDefinitionSchema,
	isActive: z.boolean().optional(),
});

export const createFormatSchema = baseFormatSchema;

export const updateFormatSchema = z
	.object({ id: z.string() })
	.merge(
		z
			.object({
				name: z.string().optional(),
				description: z.string().optional(),
				definition: formatDefinitionSchema.optional(),
				isActive: z.boolean().optional(),
			})
			.partial(),
	);

export const idSchema = z.object({ id: z.string() });

const previewProfileSchema = z.object({
	nationality: z.string().optional(),
	firstName: z.string().optional(),
	lastName: z.string().optional(),
});

export const previewSchema = z
	.object({
		classId: z.string(),
		formatId: z.string().optional(),
		definition: formatDefinitionSchema.optional(),
		profile: previewProfileSchema.optional(),
	})
	.refine(
		(value) => Boolean(value.formatId) || Boolean(value.definition),
		"Provide either formatId or definition",
	);

export const listSchema = z.object({
	includeInactive: z.boolean().optional(),
});
