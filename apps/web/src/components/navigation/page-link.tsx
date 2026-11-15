import type { ParseKeys } from "i18next";
import type React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { PageDialog } from "@/components/callable/page-dialog";
import { cn } from "@/lib/utils";
import { ExternalLinkIcon } from "./external-link-icon";
import { findHostablePage } from "./hostable-pages";

/** Opens a hostable page in a dialog; returns false when the target must be navigated to. */
export function useOpenPage() {
	const { t } = useTranslation();
	return (to: string) => {
		const entry = findHostablePage(to);
		if (!entry) return false;
		const Page = entry.page;
		PageDialog.call({
			title: t(`navigation.pages.${entry.key}` as ParseKeys),
			content: <Page />,
			showTitle: entry.untitled,
		});
		return true;
	};
}

/**
 * Link of an action in page content. When the target can be hosted, it opens
 * in a dialog and the user stays where they are; otherwise it navigates and
 * shows an external-link icon, so leaving the context is never a surprise.
 */
export function PageLink({
	to,
	className,
	children,
	hideIcon,
	onClick,
}: {
	to: string;
	className?: string;
	children: React.ReactNode;
	/** Leave out the external-link icon (e.g. the link already shows one). */
	hideIcon?: boolean;
	onClick?: () => void;
}) {
	const openPage = useOpenPage();
	if (findHostablePage(to))
		return (
			<button
				type="button"
				className={cn("text-left", className)}
				onClick={(event) => {
					event.preventDefault();
					onClick?.();
					openPage(to);
				}}
			>
				{children}
			</button>
		);
	return (
		<Link to={to} className={className} onClick={onClick}>
			{children}
			{!hideIcon && <ExternalLinkIcon />}
		</Link>
	);
}
