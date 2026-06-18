"use client";

import type { Form as FormType } from "@payloadcms/plugin-form-builder/types";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import type { Dict } from "@/i18n";
import { getClientSideURL } from "@/utilities/getURL";

const inputClass =
	"w-full py-3 px-4 bg-tk-surface border border-tk-border rounded-[0.625rem] text-tk-ink text-[0.9375rem] font-body outline-none transition-colors duration-150 focus:border-tk-primary box-border";
const labelClass =
	"block text-tk-ink-soft text-sm font-medium mb-1.5 font-body";
const errorClass = "mt-1 text-[0.8125rem] text-red-500 font-body";

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

function FieldInput({
	field,
	register,
	errors,
}: {
	field: FormField;
	register: ReturnType<typeof useForm>["register"];
	errors: ReturnType<typeof useForm>["formState"]["errors"];
}) {
	const name = "name" in field ? (field.name as string) : "";
	const label = "label" in field ? (field.label as string) : "";
	const required = "required" in field ? !!field.required : false;
	const blockType = field.blockType as string;

	if (blockType === "text" || blockType === "email") {
		return (
			<div>
				<label className={labelClass}>{label}</label>
				<input
					type={blockType}
					{...register(name, { required })}
					className={inputClass}
				/>
				{errors[name] && <p className={errorClass}>Ce champ est requis</p>}
			</div>
		);
	}

	if (blockType === "number") {
		return (
			<div>
				<label className={labelClass}>{label}</label>
				<input
					type="tel"
					{...register(name, { required })}
					className={inputClass}
				/>
				{errors[name] && <p className={errorClass}>Ce champ est requis</p>}
			</div>
		);
	}

	if (blockType === "textarea") {
		return (
			<div>
				<label className={labelClass}>{label}</label>
				<textarea
					{...register(name, { required })}
					rows={5}
					className={`${inputClass} min-h-[120px] resize-y`}
				/>
				{errors[name] && <p className={errorClass}>Ce champ est requis</p>}
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
	const { id: formID, fields = [], submitButtonLabel } = form;
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
					setServerError(body.errors?.[0]?.message || "Erreur serveur");
					return;
				}
				setSubmitted(true);
			} catch {
				setServerError("Une erreur est survenue. Veuillez réessayer.");
			}
		},
		[formID],
	);

	if (submitted) {
		return (
			<div className="rounded-[1.25rem] border border-[oklch(0.58_0.17_149/0.3)] bg-tk-surface px-8 py-12 text-center">
				<div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-tk-accent-emerald bg-[oklch(0.58_0.17_149/0.1)] text-[1.75rem]">
					✓
				</div>
				<p className="font-display font-semibold text-[1.0625rem] text-tk-ink">
					{d.contact.form.success}
				</p>
			</div>
		);
	}

	const rows = buildRows(fields);

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="flex flex-col gap-5 rounded-[1.25rem] border border-tk-border bg-tk-surface p-10"
		>
			{serverError && (
				<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 font-body text-red-700 text-sm">
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
						/>
					))}
				</div>
			))}

			<button
				type="submit"
				disabled={isSubmitting}
				className={`tk-btn-primary justify-center ${isSubmitting ? "cursor-wait opacity-70" : ""}`}
			>
				{isSubmitting
					? d.contact.form.sending
					: (submitButtonLabel ?? d.contact.form.submit)}
			</button>
		</form>
	);
}
