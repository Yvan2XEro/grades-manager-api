import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import type {
	RegistrationCounterScope,
	RegistrationFormatCounterSegment,
	RegistrationFormatFieldSegment,
	RegistrationNumberFormatDefinition,
} from "@/db/schema/registration-number-types";
import type { TransactionClient } from "@/modules/_shared/db-transaction";
import type { KlassRecord } from "@/modules/classes/classes.repo";

export type RegistrationNumberProfileInput = {
	nationality?: string | null;
	firstName?: string | null;
	lastName?: string | null;
};

type FormatLike = Pick<schema.RegistrationNumberFormat, "id" | "definition">;

type FormatContext = {
	classId: string;
	classCode?: string | null;
	programId: string;
	programCode?: string | null;
	programSlug?: string | null;
	facultyId?: string | null;
	facultyCode?: string | null;
	academicYearId: string;
	academicYearName?: string | null;
	academicYearStart?: Date | null;
	academicYearEnd?: Date | null;
	cycleId?: string | null;
	cycleCode?: string | null;
	cycleLevelId: string;
	cycleLevelCode?: string | null;
	programOptionId: string;
	programOptionCode?: string | null;
	semesterId?: string | null;
	semesterCode?: string | null;
};

type ScopeInfo = {
	key: string;
	parts: Array<{ scope: RegistrationCounterScope; value: string }>;
};

type CounterResolver = (args: {
	scope: ScopeInfo;
	segment: RegistrationFormatCounterSegment;
}) => Promise<number>;

export class RegistrationNumberError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "RegistrationNumberError";
	}
}

const defaultTransform = "upper" as const;

const trimValue = (value?: string | null) =>
	typeof value === "string" ? value.trim() : (value ?? undefined);

const toInitial = (value?: string | null) => {
	const trimmed = trimValue(value);
	if (!trimmed) return undefined;
	return trimmed.charAt(0);
};

const formatYear = (date: Date | null | undefined, format: "yy" | "yyyy") => {
	if (!date) return undefined;
	const year = date.getUTCFullYear();
	return format === "yy" ? String(year).slice(-2) : String(year);
};

const toContext = (klass: KlassRecord): FormatContext => ({
	classId: klass.id,
	classCode: klass.code,
	programId: klass.program,
	programCode: klass.programInfo?.code,
	programSlug: klass.programInfo?.slug,
	facultyId: klass.programInfo?.facultyId,
	facultyCode: klass.faculty?.code,
	academicYearId: klass.academicYear,
	academicYearName: klass.academicYearInfo?.name,
	academicYearStart: klass.academicYearInfo?.startDate
		? new Date(klass.academicYearInfo.startDate)
		: undefined,
	academicYearEnd: klass.academicYearInfo?.endDate
		? new Date(klass.academicYearInfo.endDate)
		: undefined,
	cycleId: klass.cycle?.id,
	cycleCode: klass.cycle?.code,
	cycleLevelId: klass.cycleLevelId,
	cycleLevelCode: klass.cycleLevel?.code,
	programOptionId: klass.programOptionId,
	programOptionCode: klass.programOption?.code,
	semesterId: klass.semesterId ?? undefined,
	semesterCode: klass.semester?.code,
});

const resolveFieldValue = (
	field: RegistrationFormatFieldSegment,
	context: FormatContext,
	profile?: RegistrationNumberProfileInput,
) => {
	let value: string | undefined;
	switch (field.field) {
		case "classCode":
			value = trimValue(context.classCode);
			break;
		case "programCode":
			value = trimValue(context.programCode);
			break;
		case "programSlug":
			value = trimValue(context.programSlug);
			break;
		case "programOptionCode":
			value = trimValue(context.programOptionCode);
			break;
		case "facultyCode":
			value = trimValue(context.facultyCode);
			break;
		case "cycleCode":
			value = trimValue(context.cycleCode);
			break;
		case "cycleLevelCode":
			value = trimValue(context.cycleLevelCode);
			break;
		case "semesterCode":
			value = trimValue(context.semesterCode);
			break;
		case "academicYearLabel":
			value = trimValue(context.academicYearName);
			break;
		case "academicYearStartYear":
			value = formatYear(context.academicYearStart, field.format ?? "yyyy");
			break;
		case "academicYearStartShort":
			value = formatYear(context.academicYearStart, "yy");
			break;
		case "academicYearEndYear":
			value = formatYear(context.academicYearEnd, field.format ?? "yyyy");
			break;
		case "academicYearEndShort":
			value = formatYear(context.academicYearEnd, "yy");
			break;
		case "studentNationality":
			value = trimValue(profile?.nationality);
			break;
		case "studentFirstInitial":
			value = toInitial(profile?.firstName);
			break;
		case "studentLastInitial":
			value = toInitial(profile?.lastName);
			break;
		case "studentInitials": {
			const combined = `${toInitial(profile?.firstName) ?? ""}${
				toInitial(profile?.lastName) ?? ""
			}`.trim();
			value = combined || undefined;
			break;
		}
		default:
			value = undefined;
	}
	if (value === undefined || value === "") {
		return field.fallback ?? undefined;
	}
	return value;
};

const applyFieldModifiers = (
	value: string,
	field: RegistrationFormatFieldSegment,
) => {
	const transform = field.transform ?? defaultTransform;
	let result =
		transform === "upper"
			? value.toUpperCase()
			: transform === "lower"
				? value.toLowerCase()
				: value;
	if (field.length && field.length > 0) {
		result = result.slice(0, field.length);
	}
	return result;
};

const formatCounterValue = (
	value: number,
	segment: RegistrationFormatCounterSegment,
) => {
	const width = segment.width ?? 4;
	const padChar = segment.padChar ?? "0";
	return value.toString().padStart(width, padChar);
};

const resolveScope = (
	context: FormatContext,
	scopeList?: RegistrationCounterScope[],
): ScopeInfo => {
	const scopes = scopeList && scopeList.length > 0 ? scopeList : ["global"];
	const scopeValues: Record<RegistrationCounterScope, string | undefined> = {
		global: "global",
		academicYear: context.academicYearId,
		faculty: context.facultyId,
		program: context.programId,
		class: context.classId,
		programOption: context.programOptionId,
		cycle: context.cycleId,
		cycleLevel: context.cycleLevelId,
	};
	const parts = scopes.map((scope) => {
		const value = scopeValues[scope];
		if (!value) {
			throw new RegistrationNumberError(
				`Scope "${scope}" is unavailable for this class`,
			);
		}
		return { scope, value };
	});
	const key = parts.map((part) => `${part.scope}:${part.value}`).join("|");
	return { key, parts };
};

const assembleRegistrationNumber = async (opts: {
	definition: RegistrationNumberFormatDefinition;
	context: FormatContext;
	profile?: RegistrationNumberProfileInput;
	resolveCounter: CounterResolver;
}) => {
	let output = "";
	for (const segment of opts.definition.segments) {
		if (segment.kind === "literal") {
			output += segment.value;
			continue;
		}
		if (segment.kind === "field") {
			const rawValue = resolveFieldValue(segment, opts.context, opts.profile);
			if (!rawValue) {
				throw new RegistrationNumberError(
					`Missing value for field "${segment.field}"`,
				);
			}
			output += applyFieldModifiers(rawValue, segment);
			continue;
		}
		const scope = resolveScope(opts.context, segment.scope);
		const counterValue = await opts.resolveCounter({ scope, segment });
		output += formatCounterValue(counterValue, segment);
	}
	return output;
};

export async function generateRegistrationNumber(opts: {
	format: FormatLike;
	klass: KlassRecord;
	profile?: RegistrationNumberProfileInput;
	tx: TransactionClient;
}) {
	const context = toContext(opts.klass);
	return assembleRegistrationNumber({
		definition: opts.format.definition,
		context,
		profile: opts.profile,
		resolveCounter: async ({ scope, segment }) => {
			const startValue = segment.start ?? 1;
			const [row] = await opts.tx
				.insert(schema.registrationNumberCounters)
				.values({
					formatId: opts.format.id,
					scopeKey: scope.key,
					lastValue: startValue,
				})
				.onConflictDoUpdate({
					target: [
						schema.registrationNumberCounters.formatId,
						schema.registrationNumberCounters.scopeKey,
					],
					set: {
						lastValue: sql`${schema.registrationNumberCounters.lastValue} + 1`,
						updatedAt: sql`now()`,
					},
				})
				.returning({ lastValue: schema.registrationNumberCounters.lastValue });
			return row.lastValue;
		},
	});
}

export async function previewRegistrationNumber(opts: {
	format:
		| Pick<FormatLike, "definition" | "id">
		| {
				id?: string;
				definition: RegistrationNumberFormatDefinition;
		  };
	klass: KlassRecord;
	profile?: RegistrationNumberProfileInput;
	useExistingCounters?: boolean;
}) {
	const context = toContext(opts.klass);
	const cache = new Map<string, number>();
	return assembleRegistrationNumber({
		definition: opts.format.definition,
		context,
		profile: opts.profile,
		resolveCounter: async ({ scope, segment }) => {
			const cached = cache.get(scope.key);
			if (cached !== undefined) {
				const next = cached + 1;
				cache.set(scope.key, next);
				return next;
			}
			if (!opts.useExistingCounters || !opts.format.id) {
				const next = segment.start ?? 1;
				cache.set(scope.key, next);
				return next;
			}
			const [existing] = await db
				.select({ lastValue: schema.registrationNumberCounters.lastValue })
				.from(schema.registrationNumberCounters)
				.where(
					and(
						eq(schema.registrationNumberCounters.formatId, opts.format.id),
						eq(schema.registrationNumberCounters.scopeKey, scope.key),
					),
				)
				.limit(1);
			const next = existing ? existing.lastValue + 1 : (segment.start ?? 1);
			cache.set(scope.key, next);
			return next;
		},
	});
}
