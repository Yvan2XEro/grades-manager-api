export interface CreatePaymentParams {
	reference: string;
	amount: number;
	currency: string;
	description: string;
	callbackUrl: string;
	customer: {
		email: string;
		name?: string;
		phone?: string;
	};
}

export interface CreatePaymentResult {
	checkoutUrl: string;
	providerReference: string;
}

export type PaymentStatus = "completed" | "failed" | "cancelled" | "pending";
