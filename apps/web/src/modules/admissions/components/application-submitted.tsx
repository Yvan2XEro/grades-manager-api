import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";

/** Success screen shown with the reference code once the application is sent. */
export function ApplicationSubmitted({
	referenceCode: submittedReference,
}: {
	referenceCode: string;
}) {
	const { t } = useTranslation();
	return (
		<div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-primary/5 to-background px-4 py-10">
			<div className="mx-auto w-full max-w-lg space-y-6 text-center">
				<div className="mx-auto flex size-20 items-center justify-center rounded-full bg-emerald-500/15">
					<CheckCircle2 className="size-10 text-emerald-500" />
				</div>
				<div className="space-y-2">
					<h1 className="font-bold text-3xl">
						{t("admissions.public.successTitle")}
					</h1>
					<p className="text-muted-foreground">
						{t("admissions.public.successDescription")}
					</p>
				</div>
				<div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-6">
					<p className="mb-1 text-muted-foreground text-sm">
						{t("admissions.public.referenceLabel")}
					</p>
					<p className="font-bold font-mono text-3xl text-primary tracking-widest">
						{submittedReference}
					</p>
				</div>
				<Button asChild size="lg" className="w-full">
					<Link to={`/admissions/status?ref=${submittedReference}`}>
						{t("admissions.public.trackApplication")}
					</Link>
				</Button>
			</div>
		</div>
	);
}
