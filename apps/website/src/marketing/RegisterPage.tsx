"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { Dict } from "@/i18n";
import { type FileData, SeedUploadStep } from "./SeedUploadStep";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toSlug(s: string) {
	return s
		.toLowerCase()
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 40);
}

const BASE_DOMAIN = process.env.NEXT_PUBLIC_TKAMS_BASE_DOMAIN ?? "tkams.com";

// ─── Shared field styles ──────────────────────────────────────────────────────

const inputCls =
	"w-full py-3 px-4 bg-tk-bg border border-tk-border rounded-[0.625rem] text-tk-ink text-[0.9375rem] font-body outline-none transition-colors duration-150 focus:border-tk-primary box-border";
const labelCls = "block text-tk-ink-soft text-sm font-medium mb-1.5 font-body";
const errorCls = "mt-1 text-[0.8125rem] text-[oklch(0.55_0.2_25)] font-body";

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
	return (
		<div className="mb-10 flex items-center justify-center">
			{Array.from({ length: total }, (_, i) => {
				const done = i < current;
				const active = i === current;
				return (
					<React.Fragment key={i}>
						<div
							className={`flex h-8 w-8 items-center justify-center rounded-full font-code font-semibold text-sm transition-all duration-300 ${
								done
									? "bg-tk-primary text-white"
									: active
										? "bg-tk-primary text-white ring-4 ring-[oklch(0.48_0.2_277/0.18)]"
										: "border border-tk-border bg-tk-bg-deep text-tk-muted"
							}`}
						>
							{done ? (
								<svg width="13" height="13" viewBox="0 0 13 13" fill="none">
									<path
										d="M2 6.5l3 3 6-6"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
							) : (
								i + 1
							)}
						</div>
						{i < total - 1 && (
							<div
								className={`h-px w-10 transition-colors duration-300 ${done ? "bg-tk-primary" : "bg-tk-border"}`}
							/>
						)}
					</React.Fragment>
				);
			})}
		</div>
	);
}

// ─── Step 1 — Institution ─────────────────────────────────────────────────────

type Step1Data = {
	orgName: string;
	subdomain: string;
	institutionType: string;
	country: string;
};

function Step1({
	dict: d,
	onNext,
}: {
	dict: Dict;
	onNext: (v: Step1Data) => void;
}) {
	const inst = d.register.institution;
	const {
		register,
		handleSubmit,
		watch,
		setValue,
		formState: { errors },
	} = useForm<Step1Data>({
		defaultValues: { institutionType: "university", country: "Cameroun" },
	});

	const orgName = watch("orgName");
	const subdomain = watch("subdomain");

	useEffect(() => {
		if (orgName) setValue("subdomain", toSlug(orgName));
	}, [orgName, setValue]);

	return (
		<form onSubmit={handleSubmit(onNext)} className="flex flex-col gap-5">
			<div>
				<label className={labelCls}>{inst.name}</label>
				<input
					type="text"
					placeholder={inst.name_placeholder}
					{...register("orgName", { required: d.register.errors.required })}
					className={inputCls}
				/>
				{errors.orgName && <p className={errorCls}>{errors.orgName.message}</p>}
			</div>

			<div>
				<label className={labelCls}>{inst.type_label}</label>
				<select {...register("institutionType")} className={inputCls}>
					{Object.entries(inst.types).map(([k, v]) => (
						<option key={k} value={k}>
							{v}
						</option>
					))}
				</select>
			</div>

			<div>
				<label className={labelCls}>{inst.country}</label>
				<input
					type="text"
					{...register("country", { required: d.register.errors.required })}
					className={inputCls}
				/>
				{errors.country && <p className={errorCls}>{errors.country.message}</p>}
			</div>

			<div>
				<label className={labelCls}>{inst.subdomain}</label>
				<div className="flex items-center overflow-hidden rounded-[0.625rem] border border-tk-border bg-tk-bg transition-colors duration-150 focus-within:border-tk-primary">
					<input
						type="text"
						{...register("subdomain", {
							required: d.register.errors.required,
							pattern: {
								value: /^[a-z0-9-]+$/,
								message: d.register.errors.subdomain_pattern,
							},
							minLength: { value: 2, message: d.register.errors.subdomain_min },
						})}
						className="flex-1 bg-transparent px-4 py-3 font-body text-[0.9375rem] text-tk-ink outline-none"
					/>
					<span className="whitespace-nowrap border-tk-border border-l bg-tk-bg-deep px-4 py-3 font-code text-[0.875rem] text-tk-muted">
						.{BASE_DOMAIN}
					</span>
				</div>
				{errors.subdomain ? (
					<p className={errorCls}>{errors.subdomain.message}</p>
				) : (
					subdomain && (
						<p className="mt-1 font-body text-[0.8125rem] text-tk-muted">
							{inst.subdomain_hint}{" "}
							<span className="font-medium text-tk-primary">
								https://{subdomain}.{BASE_DOMAIN}
							</span>
						</p>
					)
				)}
			</div>

			<button type="submit" className="tk-btn-primary mt-1 justify-center">
				{d.register.next}
			</button>
		</form>
	);
}

// ─── Step 2 — Admin ───────────────────────────────────────────────────────────

type Step2Data = {
	adminName: string;
	adminEmail: string;
	adminPassword: string;
	adminPasswordConfirm: string;
};

function Step2({
	dict: d,
	onNext,
	onBack,
}: {
	dict: Dict;
	onNext: (v: Step2Data) => void;
	onBack: () => void;
}) {
	const adm = d.register.admin;
	const {
		register,
		handleSubmit,
		watch,
		formState: { errors },
	} = useForm<Step2Data>();
	const password = watch("adminPassword");

	return (
		<form onSubmit={handleSubmit(onNext)} className="flex flex-col gap-5">
			<div>
				<label className={labelCls}>{adm.name}</label>
				<input
					type="text"
					placeholder={adm.name_placeholder}
					{...register("adminName", { required: d.register.errors.required })}
					className={inputCls}
				/>
				{errors.adminName && (
					<p className={errorCls}>{errors.adminName.message}</p>
				)}
			</div>

			<div>
				<label className={labelCls}>{adm.email}</label>
				<input
					type="email"
					{...register("adminEmail", { required: d.register.errors.required })}
					className={inputCls}
				/>
				{errors.adminEmail && (
					<p className={errorCls}>{errors.adminEmail.message}</p>
				)}
			</div>

			<div>
				<label className={labelCls}>{adm.password}</label>
				<input
					type="password"
					{...register("adminPassword", {
						required: d.register.errors.required,
						minLength: { value: 8, message: d.register.errors.password_min },
					})}
					className={inputCls}
				/>
				{errors.adminPassword && (
					<p className={errorCls}>{errors.adminPassword.message}</p>
				)}
			</div>

			<div>
				<label className={labelCls}>{adm.confirm}</label>
				<input
					type="password"
					{...register("adminPasswordConfirm", {
						required: d.register.errors.required,
						validate: (v) =>
							v === password || d.register.errors.password_mismatch,
					})}
					className={inputCls}
				/>
				{errors.adminPasswordConfirm && (
					<p className={errorCls}>{errors.adminPasswordConfirm.message}</p>
				)}
			</div>

			<div className="mt-1 flex gap-3">
				<button
					type="button"
					onClick={onBack}
					className="tk-btn-outline flex-1 justify-center"
				>
					{d.register.back}
				</button>
				<button
					type="submit"
					className="tk-btn-primary flex-[2] justify-center"
				>
					{d.register.next}
				</button>
			</div>
		</form>
	);
}

// ─── Step 4 — Review ──────────────────────────────────────────────────────────

const TYPE_KEYS: Record<
	string,
	keyof Dict["register"]["institution"]["types"]
> = {
	university: "university",
	school: "school",
	institute: "institute",
	secondary: "secondary",
	other: "other",
};

function Step4({
	dict: d,
	step1,
	step2,
	seedFiles,
	onBack,
	onSubmit,
	loading,
	error,
}: {
	dict: Dict;
	step1: Step1Data;
	step2: Step2Data;
	seedFiles: FileData[];
	onBack: () => void;
	onSubmit: () => void;
	loading: boolean;
	error?: string;
}) {
	const rv = d.register.review;
	const typeKey = TYPE_KEYS[step1.institutionType] ?? "other";
	const rows = [
		[rv.institution, step1.orgName],
		[rv.type, d.register.institution.types[typeKey]],
		[rv.country, step1.country],
		[rv.instance, `https://${step1.subdomain}.${BASE_DOMAIN}`],
		[rv.admin, step2.adminName],
		[rv.email, step2.adminEmail],
		[
			rv.seed,
			seedFiles.length > 0
				? seedFiles
						.map((f) => d.register.seed.templates[f.type].title)
						.join(", ")
				: rv.seed_none,
		],
	];

	return (
		<div className="flex flex-col gap-6">
			<div className="divide-y divide-tk-border overflow-hidden rounded-[0.875rem] border border-tk-border bg-tk-bg">
				{rows.map(([key, val]) => (
					<div
						key={key}
						className="flex items-center justify-between gap-4 px-5 py-3"
					>
						<span className="flex-shrink-0 font-code text-[0.75rem] text-tk-muted uppercase tracking-[0.07em]">
							{key}
						</span>
						<span className="truncate text-right font-body font-medium text-[0.875rem] text-tk-ink">
							{val}
						</span>
					</div>
				))}
			</div>

			<p className="text-center font-body text-[0.8125rem] text-tk-muted leading-relaxed">
				{rv.terms_1}{" "}
				<Link href="/legal/terms" className="text-tk-primary no-underline">
					{rv.terms_link}
				</Link>
				{rv.terms_2}
			</p>

			{error && (
				<div className="rounded-[0.625rem] border border-[oklch(0.65_0.2_25/0.25)] bg-[oklch(0.65_0.2_25/0.06)] px-4 py-3 font-body text-[oklch(0.5_0.18_25)] text-sm">
					{error}
				</div>
			)}

			<div className="flex gap-3">
				<button
					type="button"
					onClick={onBack}
					disabled={loading}
					className="tk-btn-outline flex-1 justify-center"
				>
					{d.register.back}
				</button>
				<button
					type="button"
					onClick={onSubmit}
					disabled={loading}
					className={`tk-btn-primary flex-[2] justify-center ${loading ? "cursor-wait opacity-70" : ""}`}
				>
					{loading ? rv.submitting : rv.submit}
				</button>
			</div>
		</div>
	);
}

// ─── Step 5 — Progress ────────────────────────────────────────────────────────

type ProvisionStatus = "provisioning" | "ready" | "failed";

function Step5({
	dict: d,
	requestId,
	subdomain,
}: {
	dict: Dict;
	requestId: string;
	subdomain: string;
}) {
	const pg = d.register.progress;
	const [status, setStatus] = useState<ProvisionStatus>("provisioning");
	const [step, setStep] = useState(0);
	const [instanceUrl, setInstanceUrl] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		let delay = 2000;

		async function poll() {
			if (cancelled) return;
			try {
				const res = await fetch(`/api/provision/${requestId}`);
				if (res.ok) {
					const data = await res.json();
					if (!cancelled) {
						setStep(data.progressStep ?? 0);
						setStatus(data.status);
						setInstanceUrl(data.instanceUrl ?? null);
						setErrorMessage(data.errorMessage ?? null);
						if (data.status === "provisioning" || data.status === "pending") {
							delay = Math.min(delay * 1.35, 8000);
							setTimeout(poll, delay);
						}
					}
				}
			} catch {
				if (!cancelled) setTimeout(poll, delay);
			}
		}

		void poll();
		return () => {
			cancelled = true;
		};
	}, [requestId]);

	if (status === "ready" && instanceUrl) {
		return (
			<div className="flex flex-col items-center gap-6 py-4 text-center">
				<div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border-2 border-tk-accent-emerald bg-[oklch(0.58_0.17_149/0.1)]">
					<svg
						width="28"
						height="28"
						viewBox="0 0 28 28"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.5"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="text-tk-accent-emerald"
					>
						<path d="M4 14l7 7 13-13" />
					</svg>
				</div>
				<div>
					<h3 className="mb-2 font-bold font-display text-[1.1875rem] text-tk-ink tracking-[-0.02em]">
						{pg.ready_title}
					</h3>
					<p className="font-body text-[0.9375rem] text-tk-muted">
						{pg.ready_sub}
					</p>
				</div>
				<a
					href={instanceUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="tk-btn-primary justify-center"
					style={{ fontSize: "1rem", padding: "0.875rem 2rem" }}
				>
					{pg.open_instance} {subdomain}.{BASE_DOMAIN} →
				</a>
			</div>
		);
	}

	if (status === "failed") {
		return (
			<div className="flex flex-col items-center gap-6 py-4 text-center">
				<div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border-2 border-[oklch(0.65_0.2_25/0.4)] bg-[oklch(0.65_0.2_25/0.08)]">
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.5"
						strokeLinecap="round"
						className="text-[oklch(0.55_0.2_25)]"
					>
						<path d="M5 5l14 14M19 5L5 19" />
					</svg>
				</div>
				<div>
					<h3 className="mb-2 font-bold font-display text-[1.1875rem] text-tk-ink">
						{pg.failed_title}
					</h3>
					<p className="max-w-xs font-body text-sm text-tk-muted">
						{errorMessage ?? pg.failed_default}
					</p>
				</div>
				<p className="font-body text-sm text-tk-muted">
					{pg.failed_contact}{" "}
					<a
						href="mailto:contact@tkams.com"
						className="text-tk-primary no-underline"
					>
						contact@tkams.com
					</a>
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-3 py-2">
			<p className="mb-1 text-center font-body text-[0.875rem] text-tk-ink-soft">
				{pg.in_progress}
			</p>
			{pg.steps.map((label, i) => {
				const done = i < step;
				const active = i === step;
				return (
					<div
						key={i}
						className={`flex items-center gap-4 rounded-[0.75rem] border px-5 py-3.5 transition-all duration-300 ${
							done
								? "border-[oklch(0.58_0.17_149/0.25)] bg-[oklch(0.58_0.17_149/0.04)]"
								: active
									? "border-tk-primary/30 bg-tk-primary/4"
									: "border-tk-border bg-tk-bg"
						}`}
					>
						<div
							className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
								done
									? "bg-tk-accent-emerald"
									: active
										? "border-2 border-tk-primary bg-transparent"
										: "border border-tk-border bg-tk-bg-deep"
							}`}
						>
							{done ? (
								<svg width="11" height="11" viewBox="0 0 11 11" fill="none">
									<path
										d="M1.5 5.5l3 3 5-5"
										stroke="white"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
							) : active ? (
								<div className="h-2 w-2 animate-pulse rounded-full bg-tk-primary" />
							) : null}
						</div>
						<span
							className={`font-body text-[0.875rem] ${
								done
									? "text-tk-ink"
									: active
										? "font-medium text-tk-ink"
										: "text-tk-muted"
							}`}
						>
							{label}
						</span>
					</div>
				);
			})}
		</div>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function RegisterPage({ dict: d }: { dict: Dict }) {
	const [currentStep, setCurrentStep] = useState(0);
	const [step1, setStep1] = useState<Step1Data | null>(null);
	const [step2, setStep2] = useState<Step2Data | null>(null);
	const [seedFiles, setSeedFiles] = useState<FileData[]>([]);
	const [submitting, setSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string>();
	const [requestId, setRequestId] = useState<string | null>(null);

	const handleSubmit = useCallback(async () => {
		if (!step1 || !step2) return;
		setSubmitting(true);
		setSubmitError(undefined);
		try {
			const res = await fetch("/api/provision", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					orgName: step1.orgName,
					subdomain: step1.subdomain,
					institutionType: step1.institutionType,
					country: step1.country,
					adminName: step2.adminName,
					adminEmail: step2.adminEmail,
					adminPassword: step2.adminPassword,
					seedFiles,
				}),
			});
			const data = await res.json();
			if (!res.ok) {
				setSubmitError(data.error ?? d.register.errors.server);
				return;
			}
			setRequestId(data.id);
			setCurrentStep(4);
		} catch {
			setSubmitError(d.register.errors.server);
		} finally {
			setSubmitting(false);
		}
	}, [step1, step2, seedFiles, d]);

	const TOTAL_STEPS = 3; // step indicator shows steps 0–2 (institution, admin, seed)

	return (
		<main className="min-h-screen bg-tk-bg pt-[68px]">
			{/* Dark header */}
			<section className="relative overflow-hidden bg-tk-dark px-6 py-16 pb-14">
				<div className="tk-grid-pattern absolute inset-0 z-0" />
				<div
					className="-translate-x-1/2 pointer-events-none absolute top-0 left-1/2 z-[1] h-[260px] w-[600px]"
					style={{
						background:
							"radial-gradient(ellipse at center, oklch(0.48 0.2 277 / 0.15) 0%, transparent 70%)",
					}}
				/>
				<div className="relative z-[2] mx-auto max-w-lg text-center">
					<p className="mb-4 inline-block rounded-full bg-tk-primary/15 px-3 py-1 font-bold font-code text-[0.75rem] text-tk-primary-bright tracking-[0.06em]">
						{d.register.badge}
					</p>
					<h1 className="mb-3 font-display font-extrabold text-[clamp(1.75rem,4vw,2.5rem)] text-tk-on-dark tracking-[-0.04em]">
						{d.register.title}
					</h1>
					<p className="font-body text-[1rem] text-tk-on-dark-soft leading-[1.7]">
						{d.register.sub}
					</p>
				</div>
			</section>

			{/* Form card */}
			<section className="px-6 py-16">
				<div className="mx-auto max-w-lg">
					<div className="rounded-[1.5rem] border border-tk-border bg-tk-surface p-8 shadow-[0_8px_40px_oklch(0_0_0/0.05)] md:p-10">
						{currentStep < 4 && (
							<>
								<StepDots current={currentStep} total={TOTAL_STEPS} />
								<h2 className="mb-6 text-center font-bold font-display text-[1.125rem] text-tk-ink tracking-[-0.02em]">
									{d.register.steps[currentStep]}
								</h2>
							</>
						)}

						{currentStep === 0 && (
							<Step1
								dict={d}
								onNext={(v) => {
									setStep1(v);
									setCurrentStep(1);
								}}
							/>
						)}
						{currentStep === 1 && (
							<Step2
								dict={d}
								onNext={(v) => {
									setStep2(v);
									setCurrentStep(2);
								}}
								onBack={() => setCurrentStep(0)}
							/>
						)}
						{currentStep === 2 && (
							<SeedUploadStep
								dict={d}
								onNext={(files) => {
									setSeedFiles(files);
									setCurrentStep(3);
								}}
								onSkip={() => {
									setSeedFiles([]);
									setCurrentStep(3);
								}}
								onBack={() => setCurrentStep(1)}
							/>
						)}
						{currentStep === 3 && step1 && step2 && (
							<>
								<h2 className="mb-6 text-center font-bold font-display text-[1.125rem] text-tk-ink tracking-[-0.02em]">
									{d.register.steps[3]}
								</h2>
								<Step4
									dict={d}
									step1={step1}
									step2={step2}
									seedFiles={seedFiles}
									onBack={() => setCurrentStep(2)}
									onSubmit={handleSubmit}
									loading={submitting}
									error={submitError}
								/>
							</>
						)}
						{currentStep === 4 && requestId && step1 && (
							<>
								<h2 className="mb-8 text-center font-bold font-display text-[1.125rem] text-tk-ink tracking-[-0.02em]">
									{d.register.steps[4]}
								</h2>
								<Step5
									dict={d}
									requestId={requestId}
									subdomain={step1.subdomain}
								/>
							</>
						)}
					</div>

					{currentStep < 4 && (
						<p className="mt-6 text-center font-body text-[0.8125rem] text-tk-muted">
							{d.register.already_client}{" "}
							<a
								href="mailto:contact@tkams.com"
								className="font-medium text-tk-primary no-underline"
							>
								{d.register.contact_support}
							</a>
						</p>
					)}
				</div>
			</section>
		</main>
	);
}
