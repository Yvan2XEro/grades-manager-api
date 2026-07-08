import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Copy,
	Link2,
	ShieldCheck,
	UserRoundPlus,
	UsersRound,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";

const relationshipTypes = [
	"mother",
	"father",
	"guardian",
	"uncle",
	"aunt",
	"other",
] as const;

const defaultPreferences = {
	resultsPublished: true,
	attendanceThreshold: true,
	feeClearance: true,
	documentsAvailable: true,
};

export default function GuardiansManagement() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [selectedStudentId, setSelectedStudentId] = useState("");
	const [form, setForm] = useState({
		firstName: "",
		lastName: "",
		email: "",
		phone: "",
		relationshipType: "guardian",
		isPrimary: false,
		isEmergencyContact: false,
	});

	const studentsQuery = useQuery(
		trpc.students.list.queryOptions({ limit: 100 }),
	);
	const guardiansQuery = useQuery(
		trpc.guardians.listByStudent.queryOptions(
			{ studentId: selectedStudentId },
			{ enabled: Boolean(selectedStudentId) },
		),
	);

	const invalidateGuardianLinks = () => {
		if (selectedStudentId) {
			queryClient.invalidateQueries(
				trpc.guardians.listByStudent.queryKey({ studentId: selectedStudentId }),
			);
		}
	};

	const createMutation = useMutation({
		mutationFn: () =>
			trpcClient.guardians.create.mutate({
				studentId: selectedStudentId,
				firstName: form.firstName.trim(),
				lastName: form.lastName.trim(),
				email: form.email.trim(),
				phone: form.phone.trim() || undefined,
				relationshipType:
					form.relationshipType as (typeof relationshipTypes)[number],
				isPrimary: form.isPrimary,
				isEmergencyContact: form.isEmergencyContact,
				preferences: defaultPreferences,
			}),
		onSuccess: () => {
			toast.success(t("guardians.admin.toasts.saved"));
			setForm({
				firstName: "",
				lastName: "",
				email: "",
				phone: "",
				relationshipType: "guardian",
				isPrimary: false,
				isEmergencyContact: false,
			});
			invalidateGuardianLinks();
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const updatePreferencesMutation = useMutation({
		mutationFn: (input: {
			guardianId: string;
			preferences: typeof defaultPreferences;
		}) => trpcClient.guardians.updatePreferences.mutate(input),
		onSuccess: () => {
			toast.success(t("guardians.admin.toasts.preferencesSaved"));
			invalidateGuardianLinks();
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const students = studentsQuery.data?.items ?? [];
	const selectedStudent = students.find(
		(student) => student.id === selectedStudentId,
	);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-semibold text-2xl">{t("guardians.admin.title")}</h1>
				<p className="text-muted-foreground">{t("guardians.admin.subtitle")}</p>
			</div>

			<div className="grid gap-6 xl:grid-cols-[380px_1fr]">
				<Card className="xl:sticky xl:top-6 xl:max-h-[calc(100dvh-8rem)] xl:overflow-y-auto">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<UsersRound className="size-4" />
							{t("guardians.admin.students")}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						{studentsQuery.isLoading && <Spinner />}
						{students.map((student) => (
							<button
								type="button"
								key={student.id}
								onClick={() => setSelectedStudentId(student.id)}
								className={`w-full rounded-xl border p-3 text-left transition hover:border-primary ${
									selectedStudentId === student.id
										? "border-primary bg-primary/5"
										: "border-border"
								}`}
							>
								<div className="font-medium">
									{student.firstName} {student.lastName}
								</div>
								<div className="text-muted-foreground text-xs">
									{student.registrationNumber ??
										t("guardians.admin.noMatricule")}
								</div>
							</button>
						))}
					</CardContent>
				</Card>

				{selectedStudent ? (
					<div className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle>{t("guardians.admin.createTitle")}</CardTitle>
							</CardHeader>
							<CardContent className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label>{t("guardians.fields.firstName")}</Label>
									<Input
										value={form.firstName}
										onChange={(event) =>
											setForm((current) => ({
												...current,
												firstName: event.target.value,
											}))
										}
									/>
								</div>
								<div className="space-y-2">
									<Label>{t("guardians.fields.lastName")}</Label>
									<Input
										value={form.lastName}
										onChange={(event) =>
											setForm((current) => ({
												...current,
												lastName: event.target.value,
											}))
										}
									/>
								</div>
								<div className="space-y-2">
									<Label>{t("guardians.fields.email")}</Label>
									<Input
										type="email"
										value={form.email}
										onChange={(event) =>
											setForm((current) => ({
												...current,
												email: event.target.value,
											}))
										}
									/>
								</div>
								<div className="space-y-2">
									<Label>{t("guardians.fields.phone")}</Label>
									<Input
										value={form.phone}
										onChange={(event) =>
											setForm((current) => ({
												...current,
												phone: event.target.value,
											}))
										}
									/>
								</div>
								<div className="space-y-2">
									<Label>{t("guardians.fields.relationshipType")}</Label>
									<Select
										value={form.relationshipType}
										onValueChange={(relationshipType) =>
											setForm((current) => ({ ...current, relationshipType }))
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{relationshipTypes.map((type) => (
												<SelectItem key={type} value={type}>
													{t(`guardians.relationships.${type}`)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="flex flex-col justify-end gap-3">
									<label className="flex items-center gap-2 text-sm">
										<Checkbox
											checked={form.isPrimary}
											onCheckedChange={(checked) =>
												setForm((current) => ({
													...current,
													isPrimary: checked === true,
												}))
											}
										/>
										{t("guardians.fields.isPrimary")}
									</label>
									<label className="flex items-center gap-2 text-sm">
										<Checkbox
											checked={form.isEmergencyContact}
											onCheckedChange={(checked) =>
												setForm((current) => ({
													...current,
													isEmergencyContact: checked === true,
												}))
											}
										/>
										{t("guardians.fields.isEmergencyContact")}
									</label>
								</div>
								<div className="md:col-span-2">
									<Button
										disabled={
											!selectedStudentId ||
											!form.firstName ||
											!form.lastName ||
											!form.email ||
											createMutation.isPending
										}
										onClick={() => createMutation.mutate()}
									>
										<UserRoundPlus className="mr-2 size-4" />
										{t("guardians.admin.save")}
									</Button>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Link2 className="size-4" />
									{t("guardians.admin.linkedTitle", {
										name: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
									})}
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								{guardiansQuery.isLoading && <Spinner />}
								{(guardiansQuery.data ?? []).map((link) => (
									<div
										key={link.id}
										className="rounded-xl border bg-card p-4 shadow-sm"
									>
										<div className="flex flex-col justify-between gap-3 md:flex-row">
											<div>
												<div className="font-medium">
													{link.guardian.firstName} {link.guardian.lastName}
												</div>
												<div className="text-muted-foreground text-sm">
													{link.guardian.email}
												</div>
												<div className="mt-2 flex flex-wrap gap-2">
													<Badge variant="secondary">
														{t(
															`guardians.relationships.${link.relationshipType}`,
														)}
													</Badge>
													{link.isPrimary && (
														<Badge>{t("guardians.fields.isPrimary")}</Badge>
													)}
													{link.isEmergencyContact && (
														<Badge variant="outline">
															{t("guardians.fields.isEmergencyContact")}
														</Badge>
													)}
												</div>
											</div>
											<Button
												variant="outline"
												onClick={() => {
													void navigator.clipboard.writeText(
														`${window.location.origin}/guardian/portal?token=${link.guardian.accessToken}`,
													);
													toast.success(t("guardians.admin.toasts.linkCopied"));
												}}
											>
												<Copy className="mr-2 size-4" />
												{t("guardians.admin.copyPortalLink")}
											</Button>
										</div>
										<div className="mt-4 grid gap-2 md:grid-cols-2">
											{Object.entries(defaultPreferences).map(([key]) => {
												const preferences =
													(link.guardian
														.preferences as typeof defaultPreferences) ??
													defaultPreferences;
												const checked =
													preferences[key as keyof typeof preferences] !==
													false;
												return (
													<label
														key={key}
														className="flex items-center gap-2 rounded-lg bg-muted/50 p-2 text-sm"
													>
														<Checkbox
															checked={checked}
															onCheckedChange={(value) =>
																updatePreferencesMutation.mutate({
																	guardianId: link.guardian.id,
																	preferences: {
																		...defaultPreferences,
																		...preferences,
																		[key]: value === true,
																	},
																})
															}
														/>
														{t(`guardians.preferences.${key}`)}
													</label>
												);
											})}
										</div>
									</div>
								))}
								{!guardiansQuery.isLoading &&
									(guardiansQuery.data ?? []).length === 0 && (
										<p className="py-8 text-center text-muted-foreground text-sm">
											{t("guardians.admin.empty")}
										</p>
									)}
							</CardContent>
						</Card>
					</div>
				) : (
					<Card>
						<CardContent className="flex min-h-80 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
							<ShieldCheck className="size-10" />
							<p>{t("guardians.admin.selectStudent")}</p>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
