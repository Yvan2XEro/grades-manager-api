import type {
	CreatePaymentParams,
	CreatePaymentResult,
	PaymentStatus,
} from "./types";

export class NotchPayProvider {
	constructor(
		private readonly publicKey: string,
		private readonly baseUrl = "https://api.notchpay.co",
	) {}

	async createPayment(
		params: CreatePaymentParams,
	): Promise<CreatePaymentResult> {
		const res = await fetch(`${this.baseUrl}/payments`, {
			method: "POST",
			headers: {
				Authorization: this.publicKey,
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({
				reference: params.reference,
				amount: params.amount,
				currency: params.currency,
				description: params.description,
				callback: params.callbackUrl,
				customer: params.customer,
			}),
		});

		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			throw new Error(
				`NotchPay (${res.status}): ${(err as Record<string, string>).message ?? res.statusText}`,
			);
		}

		const data = (await res.json()) as Record<string, unknown>;
		const transaction = data.transaction as Record<string, unknown> | undefined;

		const checkoutUrl =
			(transaction?.authorization_url as string | undefined) ??
			(data.authorization_url as string | undefined);

		const providerReference =
			(transaction?.reference as string | undefined) ??
			(data.reference as string | undefined) ??
			params.reference;

		if (!checkoutUrl) {
			throw new Error("NotchPay: no checkout URL in response");
		}

		return { checkoutUrl, providerReference };
	}

	async verifyPayment(reference: string): Promise<PaymentStatus> {
		const res = await fetch(`${this.baseUrl}/payments/${reference}`, {
			headers: {
				Authorization: this.publicKey,
				Accept: "application/json",
			},
		});

		if (!res.ok) {
			throw new Error(`NotchPay verify (${res.status}): ${res.statusText}`);
		}

		const data = (await res.json()) as Record<string, unknown>;
		const transaction = data.transaction as Record<string, unknown> | undefined;
		const status = String(
			(transaction?.status as string | undefined) ??
				(data.status as string | undefined) ??
				"",
		);

		return this.mapStatus(status);
	}

	private mapStatus(s: string): PaymentStatus {
		const lower = s.toLowerCase();
		if (["complete", "completed", "approved", "success"].includes(lower))
			return "completed";
		if (["failed", "expired", "error"].includes(lower)) return "failed";
		if (["cancelled", "canceled"].includes(lower)) return "cancelled";
		return "pending";
	}
}

export function getNotchPayProvider(): NotchPayProvider {
	const publicKey = process.env.NOTCHPAY_PUBLIC_KEY;
	if (!publicKey) {
		throw new Error("NotchPay not configured: set NOTCHPAY_PUBLIC_KEY");
	}
	return new NotchPayProvider(
		publicKey,
		process.env.NOTCHPAY_BASE_URL ?? "https://api.notchpay.co",
	);
}
