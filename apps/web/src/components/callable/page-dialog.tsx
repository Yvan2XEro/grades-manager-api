import { X } from "lucide-react";
import type React from "react";
import { Suspense, useEffect, useRef } from "react";
import { createCallable } from "react-call";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { sounds } from "@/lib/sounds";
import { DIALOG_EXIT_MS } from "./callable-dialog";

interface PageDialogProps {
	/** Accessible title; the hosted page shows its own header. */
	title: string;
	/** An existing page component, rendered as is (lists, forms, hubs without tabs). */
	content: React.ReactNode;
	/** Shows the title above the page, for tab pages whose header lives in their hub. */
	showTitle?: boolean;
}

/**
 * Large modal hosting an existing page, so an action can open it without the
 * user leaving what they are doing. Closes by itself when the hosted page
 * navigates (e.g. a row opening a detail page): the user then lands there.
 *
 * Pages relying on route params or nested routes (`useParams`, `<Outlet />`)
 * cannot be hosted.
 */
export const PageDialog = createCallable<PageDialogProps, void>(
	({ call, title, content, showTitle }) => {
		const { t } = useTranslation();
		const location = useLocation();
		const openedAt = useRef(location.pathname);
		const wasOpen = useRef(false);

		useEffect(() => {
			if (!call.ended && !wasOpen.current) sounds.open();
			else if (call.ended && wasOpen.current) sounds.close();
			wasOpen.current = !call.ended;
		}, [call.ended]);

		// End once: `call` changes identity after ending, which would re-run this
		useEffect(() => {
			if (!call.ended && location.pathname !== openedAt.current) call.end();
		}, [location.pathname, call]);

		return (
			<Dialog open={!call.ended} onOpenChange={(open) => !open && call.end()}>
				<DialogContent
					showCloseButton={false}
					className="flex h-[90vh] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-6xl"
				>
					<DialogTitle className="sr-only">{title}</DialogTitle>
					<DialogDescription className="sr-only">{title}</DialogDescription>
					<button
						type="button"
						onClick={() => call.end()}
						aria-label={t("common.actions.close", { defaultValue: "Close" })}
						className="absolute top-3 right-3 z-10 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					>
						<X className="h-4 w-4" />
					</button>
					{/* Same frame as the dashboard content: list pages scroll their rows, others scroll here */}
					<div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
						<div className="flex min-h-full min-w-0 flex-col gap-4 p-6 *:w-full *:shrink-0 md:h-full">
							{showTitle && (
								<h2 className="pr-8 font-semibold text-xl">{title}</h2>
							)}
							<Suspense fallback={<Skeleton className="h-96 w-full" />}>
								{content}
							</Suspense>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		);
	},
	DIALOG_EXIT_MS,
);
