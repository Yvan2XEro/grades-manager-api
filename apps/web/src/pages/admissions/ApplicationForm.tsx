import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, FileText } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";

const OPTIONAL_CLASS = "__optional_class__";

export default function ApplicationForm() {
	const { t } = useTranslation();
	const optionsQuery = useQuery(trpc.admissions.publicOptions.queryOptions());
	const [submittedReference, setSubmittedReference] = useState<string | null>(
		null,
	);
	const [form, setForm] = useState({
		firstName: "",
		lastName: "",
		email: "",
		phone: "",
		dateOfBirth: "",
		nationality: "",
		previousDiploma: "",
		previousInstitution: "",
		programId: "",
		academicYearId: "",
		classId: OPTIONAL_CLASS,
		personalStatement: "",
	});

	const classes = useMemo(() => {
		return (optionsQuery.data?.classes ?? []).filter((klass) => {
			if (form.programId && klass.program !== form.programId) return false;
			if (form.academicYearId && klass.academicYear !== form.academicYearId) {
				return false;
			}
			return true;
		});
	}, [optionsQuery.data?.classes, form.programId, form.academicYearId]);

	const submitMutation = useMutation({
		mutationFn: () =>
			trpcClient.admissions.submit.mutate({
				applicant: {
					firstName: form.firstName.trim(),
					lastName: form.lastName.trim(),
					email: form.email.trim(),
					phone: form.phone.trim() || undefined,
					dateOfBirth: form.dateOfBirth || undefined,
					nationality: form.nationality.trim() || undefined,
					previousDiploma: form.previousDiploma.trim() || undefined,
					previousInstitution: form.previousInstitution.trim() || undefined,
				},
				programId: form.programId,
				academicYearId: form.academicYearId,
				classId:
					form.classId === OPTIONAL_CLASS || !form.classId
						? undefined
						: form.classId,
				personalStatement: form.personalStatement.trim() || undefined,
			}),
		onSuccess: (result) => {
			setSubmittedReference(result.referenceCode);
			toast.success(t("admissions.public.submitSuccess"));
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const update = (key: keyof typeof form, value: string) => {
		setForm((prev) => ({ ...prev, [key]: value }));
	};

	if (submittedReference) {
		return (
			<div className="mx-auto flex min-h-dvh max-w-2xl items-center px-4 py-10">
				<Card className="w-full">
					<CardHeader>
						<div className="mb-3 flex size-12 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-600">
							<CheckCircle2 className="size-6" />
						</div>
						<CardTitle>{t("admissions.public.successTitle")}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<p className="text-muted-foreground">
							{t("admissions.public.successDescription")}
						</p>
						<div className="rounded-lg border bg-muted/40 p-4">
							<p className="text-muted-foreground text-sm">
								{t("admissions.public.referenceLabel")}
							</p>
							<p className="font-semibold text-2xl tracking-wide">
								{submittedReference}
							</p>
						</div>
						<Button asChild>
							<Link to={`/admissions/status?ref=${submittedReference}`}>
								{t("admissions.public.trackApplication")}
							</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-dvh bg-dot-pattern px-4 py-10">
			<div className="mx-auto max-w-4xl space-y-6">
				<div className="space-y-2">
					<div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
						<FileText className="size-5" />
					</div>
					<h1 className="font-semibold text-3xl">
						{t("admissions.public.title")}
					</h1>
					<p className="max-w-2xl text-muted-foreground">
						{t("admissions.public.subtitle")}
					</p>
				</div>

				<Card>
					<CardContent className="grid gap-5 pt-6 md:grid-cols-2">
						<Field
							label={t("admissions.fields.firstName")}
							value={form.firstName}
							onChange={(value) => update("firstName", value)}
							required
						/>
						<Field
							label={t("admissions.fields.lastName")}
							value={form.lastName}
							onChange={(value) => update("lastName", value)}
							required
						/>
						<Field
							label={t("admissions.fields.email")}
							type="email"
							value={form.email}
							onChange={(value) => update("email", value)}
							required
						/>
						<Field
							label={t("admissions.fields.phone")}
							value={form.phone}
							onChange={(value) => update("phone", value)}
						/>
						<Field
							label={t("admissions.fields.dateOfBirth")}
							type="date"
							value={form.dateOfBirth}
							onChange={(value) => update("dateOfBirth", value)}
						/>
						<Field
							label={t("admissions.fields.nationality")}
							value={form.nationality}
							onChange={(value) => update("nationality", value)}
						/>
						<Field
							label={t("admissions.fields.previousDiploma")}
							value={form.previousDiploma}
							onChange={(value) => update("previousDiploma", value)}
						/>
						<Field
							label={t("admissions.fields.previousInstitution")}
							value={form.previousInstitution}
							onChange={(value) => update("previousInstitution", value)}
						/>

						<div className="space-y-2">
							<Label>{t("admissions.fields.program")} *</Label>
							<Select
								value={form.programId}
								onValueChange={(value) => update("programId", value)}
							>
								<SelectTrigger>
									<SelectValue
										placeholder={t("admissions.public.selectProgram")}
									/>
								</SelectTrigger>
								<SelectContent>
									{(optionsQuery.data?.programs ?? []).map((program) => (
										<SelectItem key={program.id} value={program.id}>
											{program.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>{t("admissions.fields.academicYear")} *</Label>
							<Select
								value={form.academicYearId}
								onValueChange={(value) => update("academicYearId", value)}
							>
								<SelectTrigger>
									<SelectValue
										placeholder={t("admissions.public.selectYear")}
									/>
								</SelectTrigger>
								<SelectContent>
									{(optionsQuery.data?.academicYears ?? []).map((year) => (
										<SelectItem key={year.id} value={year.id}>
											{year.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2 md:col-span-2">
							<Label>{t("admissions.fields.class")}</Label>
							<Select
								value={form.classId}
								onValueChange={(value) => update("classId", value)}
							>
								<SelectTrigger>
									<SelectValue
										placeholder={t("admissions.public.selectClass")}
									/>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={OPTIONAL_CLASS}>
										{t("admissions.public.noClass")}
									</SelectItem>
									{classes.map((klass) => (
										<SelectItem key={klass.id} value={klass.id}>
											{klass.name} ({klass.code})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2 md:col-span-2">
							<Label>{t("admissions.fields.personalStatement")}</Label>
							<Textarea
								value={form.personalStatement}
								onChange={(event) =>
									update("personalStatement", event.target.value)
								}
								rows={5}
							/>
						</div>
						<div className="md:col-span-2">
							<Button
								onClick={() => submitMutation.mutate()}
								disabled={
									submitMutation.isPending ||
									!form.firstName ||
									!form.lastName ||
									!form.email ||
									!form.programId ||
									!form.academicYearId
								}
							>
								{submitMutation.isPending
									? t("admissions.public.submitting")
									: t("admissions.public.submit")}
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function Field({
	label,
	value,
	onChange,
	type = "text",
	required,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	type?: string;
	required?: boolean;
}) {
	return (
		<div className="space-y-2">
			<Label>
				{label}
				{required ? " *" : ""}
			</Label>
			<Input
				type={type}
				value={value}
				onChange={(event) => onChange(event.target.value)}
				required={required}
			/>
		</div>
	);
}
