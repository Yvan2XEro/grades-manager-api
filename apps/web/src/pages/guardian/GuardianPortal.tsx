import { useQuery } from "@tanstack/react-query";
import { BookOpen, ShieldCheck, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { trpc } from "@/utils/trpc";

export default function GuardianPortal() {
	const { t } = useTranslation();
	const initialToken = useMemo(() => {
		if (typeof window === "undefined") return "";
		return new URLSearchParams(window.location.search).get("token") ?? "";
	}, []);
	const [tokenInput, setTokenInput] = useState(initialToken);
	const [accessToken, setAccessToken] = useState(initialToken);

	const portalQuery = useQuery(
		trpc.guardians.portal.queryOptions(
			{ accessToken },
			{ enabled: Boolean(accessToken) },
		),
	);

	return (
		<div className="min-h-dvh bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-4 py-10 text-white">
			<div className="mx-auto max-w-5xl space-y-6">
				<div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
					<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
						<div>
							<div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 font-medium text-emerald-100 text-sm">
								<ShieldCheck className="size-4" />
								{t("guardians.portal.badge")}
							</div>
							<h1 className="font-semibold text-3xl">
								{t("guardians.portal.title")}
							</h1>
							<p className="mt-2 max-w-2xl text-slate-300">
								{t("guardians.portal.subtitle")}
							</p>
						</div>
						<div className="flex w-full gap-2 md:w-[420px]">
							<Input
								value={tokenInput}
								onChange={(event) => setTokenInput(event.target.value)}
								placeholder={t("guardians.portal.tokenPlaceholder")}
								className="border-white/15 bg-white text-slate-950"
							/>
							<Button
								variant="secondary"
								onClick={() => setAccessToken(tokenInput.trim())}
							>
								{t("guardians.portal.open")}
							</Button>
						</div>
					</div>
				</div>

				{portalQuery.isLoading && (
					<div className="flex justify-center rounded-2xl border border-white/10 bg-white/10 p-10">
						<Spinner />
					</div>
				)}

				{portalQuery.error && (
					<Card className="border-red-200 bg-red-50 text-red-950">
						<CardContent className="p-6">
							{t("guardians.portal.invalid")}
						</CardContent>
					</Card>
				)}

				{portalQuery.data && (
					<div className="grid gap-6 lg:grid-cols-[320px_1fr]">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<UserRound className="size-4" />
									{t("guardians.portal.profile")}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="font-semibold text-xl">
									{portalQuery.data.guardian.firstName}{" "}
									{portalQuery.data.guardian.lastName}
								</div>
								<div className="text-muted-foreground">
									{portalQuery.data.guardian.email}
								</div>
								{portalQuery.data.guardian.phone && (
									<div className="mt-1 text-muted-foreground">
										{portalQuery.data.guardian.phone}
									</div>
								)}
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<BookOpen className="size-4" />
									{t("guardians.portal.students")}
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								{portalQuery.data.students.map((student) => (
									<div
										key={student.id}
										className="rounded-xl border bg-card p-4 shadow-sm"
									>
										<div className="flex flex-col justify-between gap-3 md:flex-row">
											<div>
												<div className="font-semibold">
													{student.firstName} {student.lastName}
												</div>
												<div className="text-muted-foreground text-sm">
													{student.registrationNumber ??
														t("guardians.portal.noMatricule")}
												</div>
											</div>
											<div className="flex flex-wrap gap-2">
												<Badge variant="secondary">
													{t(
														`guardians.relationships.${student.relationshipType}`,
													)}
												</Badge>
												{student.isPrimary && (
													<Badge>{t("guardians.fields.isPrimary")}</Badge>
												)}
												{student.isEmergencyContact && (
													<Badge variant="outline">
														{t("guardians.fields.isEmergencyContact")}
													</Badge>
												)}
											</div>
										</div>
									</div>
								))}
								{portalQuery.data.students.length === 0 && (
									<p className="py-8 text-center text-muted-foreground text-sm">
										{t("guardians.portal.empty")}
									</p>
								)}
							</CardContent>
						</Card>
					</div>
				)}
			</div>
		</div>
	);
}
