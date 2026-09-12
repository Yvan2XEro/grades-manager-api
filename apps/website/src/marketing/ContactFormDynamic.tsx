"use client";

import type { Form as FormType } from "@payloadcms/plugin-form-builder/types";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import type { Dict } from "@/i18n";
import { getClientSideURL } from "@/utilities/getURL";

/*
 * Field styling.
 *
 * The inputs used to be plain bordered boxes on white — the same control any
 * framework ships by default, which made the one form on the site look like it
 * belonged to a different product than the pages around it.
 *
 * Three deliberate choices:
 *
 *   - The resting field sits on `tk-bg-deep`, not white. On a white card a
 *     white input is defined only by its hairline; tinting the well makes the
 *     input legible as a place to type before the visitor reads the label.
 *     On focus it lifts to white — the field the cursor is in is the brightest
 *     thing in the form.
 *   - Focus draws a 3px violet halo via ring, not a 1px border swap. The old
 *     treatment changed one pixel of border colour, which is invisible at a
 *     glance and thin for keyboard users.
 *   - Errors use `tk-block`, the palette's semantic red, instead of Tailwind's
 *     `red-500`, which is a different hue from everything else on the site.
 */
const inputBase =
	"w-full box-border rounded-lg border px-4 py-3 font-body text-[0.9375rem] text-tk-ink outline-none transition-[background-color,border-color,box-shadow] duration-150 placeholder:text-tk-muted focus:bg-tk-surface focus:ring-[3px]";
const inputRest =
	"border-tk-border bg-tk-bg-deep focus:border-tk-primary focus:ring-tk-primary/18";
const inputError =
	"border-tk-block bg-tk-block-wash focus:border-tk-block focus:ring-tk-block/18";
const labelClass =
	"mb-1.5 flex items-baseline gap-2 font-body font-medium text-[0.875rem] text-tk-ink";
const errorClass =
	"mt-1.5 flex items-center gap-1.5 font-body text-[0.8125rem] text-tk-block";

type FormField = NonNullable<FormType["fields"]>[number];

function buildRows(fields: NonNullable<FormType["fields"]>): FormField[][] {
	const rows: FormField[][] = [];
	let current: FormField[] = [];
	let currentWidth = 0;

	for (const field of fields) {
		const w = "width" in field ? (field.width ?? 100) : 100;
		if (currentWidth + w > 100 && current.length > 0) {
			rows.push(current);
			current = [field];
			currentWidth = w;
		} else {
			current = [...current, field];
			currentWidth += w;
			if (currentWidth >= 100) {
				rows.push(current);
				current = [];
				currentWidth = 0;
			}
		}
	}
	if (current.length > 0) rows.push(current);

	return rows;
}

/**
 * The translated label for a known field, or undefined for an unknown one.
 *
 * Labels come from the Payload form record, which stores one string per field
 * with no locale — so an English visitor was reading "Nom complet" and "Email
 * professionnel" above their inputs. The dictionary already carries all five
 * labels in both languages, so it wins for the fields the seed defines, and the
 * CMS value remains the fallback for any field added later through the admin.
 */
function dictLabel(name: string, d: Dict): string | undefined {
	const f = d.contact.form;
	switch (name) {
		case "full-name":
			return f.name;
		case "institution":
			return f.institution;
		case "email":
			return f.email;
		case "phone":
			return f.phone;
		case "message":
			return f.message;
		default:
			return undefined;
	}
}

/** Inline warning glyph beside an error message. */
function ErrorIcon() {
	return (
		<svg
			width="13"
			height="13"
			viewBox="0 0 13 13"
			fill="none"
			aria-hidden="true"
			className="flex-none"
		>
			<circle
				cx="6.5"
				cy="6.5"
				r="5.75"
				stroke="currentColor"
				strokeWidth="1.2"
			/>
			<path
				d="M6.5 3.6v3.3"
				stroke="currentColor"
				strokeWidth="1.4"
				strokeLinecap="round"
			/>
			<circle cx="6.5" cy="9.2" r="0.75" fill="currentColor" />
		</svg>
	);
}

function FieldInput({
	field,
	register,
	errors,
	dict: d,
}: {
	field: FormField;
	register: ReturnType<typeof useForm>["register"];
	errors: ReturnType<typeof useForm>["formState"]["errors"];
	dict: Dict;
}) {
	const name = "name" in field ? (field.name as string) : "";
	const required = "required" in field ? !!field.required : false;
	const blockType = field.blockType as string;

	const label =
		dictLabel(name, d) ?? ("label" in field ? (field.label as string) : "");

	const hasError = Boolean(errors[name]);
	const fieldId = `contact-${name}`;
	const errorId = `${fieldId}-error`;

	/**
	 * Labels are bound to their control with htmlFor/id, which the previous
	 * markup omitted entirely: clicking a label did nothing and a screen reader
	 * announced the input unnamed. `aria-invalid` and `aria-describedby` tie the
	 * error message to the field it belongs to.
	 */
	const fieldProps = {
		id: fieldId,
		"aria-invalid": hasError || undefined,
		"aria-describedby": hasError ? errorId : undefined,
		className: `${inputBase} ${hasError ? inputError : inputRest}`,
	};

	const labelNode = (
		<label htmlFor={fieldId} className={labelClass}>
			{label}
			{!required && (
				<span className="font-code text-[0.6875rem] text-tk-muted uppercase tracking-[0.1em]">
					{d.contact.form.optional}
				</span>
			)}
		</label>
	);

	const errorNode = hasError ? (
		<p id={errorId} className={errorClass}>
			<ErrorIcon />
			{d.contact.form.required}
		</p>
	) : null;

	if (blockType === "text" || blockType === "email" || blockType === "number") {
		return (
			<div>
				{labelNode}
				<input
					type={blockType === "number" ? "tel" : blockType}
					autoComplete={
						blockType === "email"
							? "email"
							: blockType === "number"
								? "tel"
								: undefined
					}
					{...register(name, { required })}
					{...fieldProps}
				/>
				{errorNode}
			</div>
		);
	}

	if (blockType === "textarea") {
		return (
			<div>
				{labelNode}
				<textarea
					rows={6}
					{...register(name, { required })}
					{...fieldProps}
					className={`${fieldProps.className} min-h-[9rem] resize-y`}
				/>
				{errorNode}
			</div>
		);
	}

	return null;
}

export function ContactFormDynamic({
	form,
	dict: d,
}: {
	form: FormType;
	dict: Dict;
}) {
	const { id: formID, fields = [] } = form;
	const [submitted, setSubmitted] = useState(false);
	const [serverError, setServerError] = useState<string>();

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm();

	const onSubmit = useCallback(
		async (data: Record<string, string>) => {
			setServerError(undefined);
			try {
				const res = await fetch(`${getClientSideURL()}/api/form-submissions`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						form: formID,
						submissionData: Object.entries(data).map(([field, value]) => ({
							field,
							value,
						})),
					}),
				});
				const body = await res.json();
				if (res.status >= 400) {
					setServerError(
						body.errors?.[0]?.message || d.contact.form.server_error,
					);
					return;
				}
				setSubmitted(true);
			} catch {
				setServerError(d.contact.form.server_error);
			}
		},
		[formID, d.contact.form.server_error],
	);

	if (submitted) {
		return (
			/*
			 * Success state, on the palette's semantic green rather than the
			 * hardcoded `oklch(0.58 0.17 149/…)` literals it carried before — those
			 * were a third green, matching neither `tk-pass` nor
			 * `tk-accent-emerald`, and would drift on any retune of the palette.
			 *
			 * `role="status"` announces the outcome to a screen reader: the form
			 * disappears on submit, and without it that change is silent.
			 */
			<div
				role="status"
				className="rounded-xl border border-tk-pass/30 bg-tk-pass-wash px-6 py-12 text-center lg:px-8"
			>
				<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-tk-pass text-tk-on-primary">
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						aria-hidden="true"
					>
						<path
							d="M5 12.5l4.5 4.5L19 7.5"
							stroke="currentColor"
							strokeWidth="2.2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</div>
				<p className="mt-5 font-bold font-display text-[1.125rem] text-tk-ink tracking-[-0.02em]">
					{d.contact.form.success_title}
				</p>
				<p className="mx-auto mt-2 max-w-[38ch] font-body text-[0.9375rem] text-tk-ink-2 leading-[1.65]">
					{d.contact.form.success}
				</p>
			</div>
		);
	}

	const rows = buildRows(fields);

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			noValidate
			className="flex flex-col gap-5 rounded-xl border border-tk-border bg-tk-surface p-6 lg:p-8"
		>
			{/*
			 * A titled header bar, so the card announces itself instead of opening
			 * cold on an input. The hairline under it separates the frame from the
			 * fields without adding another box.
			 */}
			<div className="-mx-6 lg:-mx-8 -mt-6 lg:-mt-8 mb-1 border-tk-border border-b bg-tk-bg-deep px-6 py-4 lg:px-8">
				<p className="font-bold font-display text-[0.9375rem] text-tk-ink tracking-[-0.02em]">
					{d.contact.form.card_title}
				</p>
				<p className="mt-1 font-body text-[0.8125rem] text-tk-muted">
					{d.contact.form.card_sub}
				</p>
			</div>

			{serverError && (
				<div
					role="alert"
					className="flex items-start gap-2.5 rounded-lg border border-tk-block/30 bg-tk-block-wash px-4 py-3 font-body text-[0.875rem] text-tk-block"
				>
					<span className="mt-0.5">
						<ErrorIcon />
					</span>
					{serverError}
				</div>
			)}

			{rows.map((row, ri) => (
				<div
					key={ri}
					className={
						row.length > 1 ? "grid grid-cols-1 gap-4 sm:grid-cols-2" : undefined
					}
				>
					{row.map((field) => (
						<FieldInput
							key={"name" in field ? field.name : ri}
							field={field}
							register={register}
							errors={errors}
							dict={d}
						/>
					))}
				</div>
			))}

			{/*
			 * The button spans the form. A 200px control floating at the bottom-left
			 * of a full-width card reads as an afterthought; the send action is the
			 * whole purpose of this component and should look like it.
			 */}
			<button
				type="submit"
				disabled={isSubmitting}
				className={`tk-btn-primary mt-1 w-full justify-center ${isSubmitting ? "cursor-wait opacity-70" : ""}`}
			>
				{/*
				 * The dictionary label wins over `submitButtonLabel` for the same
				 * reason as the field labels: the CMS value is French-only, so
				 * preferring it left an English form with a French button.
				 */}
				{isSubmitting ? d.contact.form.sending : d.contact.form.submit}
			</button>
		</form>
	);
}
