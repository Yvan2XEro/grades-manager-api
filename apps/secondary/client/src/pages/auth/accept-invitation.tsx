import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { authClient } from "@/lib/auth-client";

type Status = "loading" | "success" | "error";

export function AcceptInvitation() {
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [status, setStatus] = useState<Status>("loading");
	const [errorMsg, setErrorMsg] = useState<string>("");

	useEffect(() => {
		if (!id) {
			setStatus("error");
			setErrorMsg(t("invite.invalid_link", "Invalid invitation link."));
			return;
		}
		authClient.organization
			.acceptInvitation({ invitationId: id })
			.then((result) => {
				if (result.error) {
					setStatus("error");
					setErrorMsg(
						result.error.message ??
							t("invite.expired", "This invitation has expired or is invalid."),
					);
				} else {
					setStatus("success");
					setTimeout(() => navigate("/login"), 3000);
				}
			})
			.catch(() => {
				setStatus("error");
				setErrorMsg(
					t("invite.expired", "This invitation has expired or is invalid."),
				);
			});
	}, [id]);

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<div className="w-full max-w-sm space-y-4 text-center">
				{status === "loading" && (
					<>
						<div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
						<p className="text-muted-foreground text-sm">
							{t("invite.processing", "Activating your account…")}
						</p>
					</>
				)}

				{status === "success" && (
					<>
						<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
							<svg
								className="h-6 w-6 text-green-600 dark:text-green-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</div>
						<h1 className="font-semibold text-foreground text-xl">
							{t("invite.success_title", "Account activated")}
						</h1>
						<p className="text-muted-foreground text-sm">
							{t(
								"invite.success_hint",
								"Your account is ready. Redirecting to login…",
							)}
						</p>
					</>
				)}

				{status === "error" && (
					<>
						<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
							<svg
								className="h-6 w-6 text-red-600 dark:text-red-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</div>
						<h1 className="font-semibold text-foreground text-xl">
							{t("invite.error_title", "Invitation error")}
						</h1>
						<p className="text-muted-foreground text-sm">{errorMsg}</p>
						<button
							type="button"
							onClick={() => navigate("/login")}
							className="text-primary text-sm underline underline-offset-4"
						>
							{t("invite.go_to_login", "Go to login")}
						</button>
					</>
				)}
			</div>
		</div>
	);
}
