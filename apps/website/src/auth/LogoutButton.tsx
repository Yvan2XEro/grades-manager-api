"use client";

import { useRouter } from "next/navigation";
import type { Dict } from "@/i18n";

export function LogoutButton({
	dict: d,
	compact = false,
}: {
	dict: Dict;
	compact?: boolean;
}) {
	const router = useRouter();

	const handleLogout = async () => {
		try {
			await fetch("/api/users/logout", {
				method: "POST",
				credentials: "include",
			});
		} finally {
			router.push("/login");
			router.refresh();
		}
	};

	if (compact) {
		return (
			<button
				type="button"
				onClick={handleLogout}
				title={d.dashboard.sidebar.logout}
				className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[0.375rem] text-white/35 transition-all duration-150 hover:bg-white/8 hover:text-white/80"
			>
				<svg
					width="15"
					height="15"
					viewBox="0 0 15 15"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M5.5 2.5H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2.5" />
					<path d="M10 10l3-2.5L10 5" />
					<path d="M13 7.5H6" />
				</svg>
			</button>
		);
	}

	return (
		<button
			type="button"
			onClick={handleLogout}
			className="flex items-center gap-1.5 rounded-[0.5rem] px-3 py-1.5 font-body text-[0.8125rem] text-tk-muted transition-colors duration-150 hover:bg-tk-bg-deep hover:text-tk-ink"
		>
			<svg
				width="14"
				height="14"
				viewBox="0 0 14 14"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<path d="M5 2H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3" />
				<path d="M9 10l3-3-3-3" />
				<path d="M12 7H5" />
			</svg>
			{d.dashboard.sidebar.logout}
		</button>
	);
}
