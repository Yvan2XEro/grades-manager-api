"use client";

import { CreditCard, Loader2 } from "lucide-react";
import { useState } from "react";

type Props = {
	invoiceId: string;
	label: string;
	errorLabel: string;
};

export function PayButton({ invoiceId, label, errorLabel }: Props) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handlePay = async () => {
		setLoading(true);
		setError("");
		try {
			const res = await fetch("/api/payments/initiate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ invoiceId }),
			});

			const data = (await res.json()) as {
				checkoutUrl?: string;
				error?: string;
			};

			if (!res.ok || !data.checkoutUrl) {
				setError(data.error ?? errorLabel);
				setLoading(false);
				return;
			}

			window.location.href = data.checkoutUrl;
		} catch {
			setError(errorLabel);
			setLoading(false);
		}
	};

	return (
		<div className="flex flex-col items-end gap-1">
			<button
				type="button"
				onClick={handlePay}
				disabled={loading}
				className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-[0.625rem] bg-tk-primary px-3.5 py-2 font-body font-semibold text-[0.8125rem] text-white shadow-sm transition-all duration-150 hover:bg-tk-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
			>
				{loading ? (
					<Loader2 size={13} strokeWidth={1.75} className="animate-spin" />
				) : (
					<CreditCard size={13} strokeWidth={1.75} />
				)}
				{label}
			</button>
			{error && (
				<p className="font-body text-[0.75rem] text-[oklch(0.5_0.18_25)]">
					{error}
				</p>
			)}
		</div>
	);
}
