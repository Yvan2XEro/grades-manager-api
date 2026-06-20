import configPromise from "@payload-config";
import {
	Document,
	Page,
	renderToBuffer,
	StyleSheet,
	Text,
	View,
} from "@react-pdf/renderer";
import type { NextRequest } from "next/server";
import { getPayload } from "payload";
import { createElement } from "react";
import { getRequestUser } from "@/lib/get-request-user";

const styles = StyleSheet.create({
	page: {
		fontFamily: "Helvetica",
		fontSize: 10,
		color: "#1a1a2e",
		padding: 48,
		backgroundColor: "#ffffff",
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginBottom: 36,
		paddingBottom: 20,
		borderBottomWidth: 1,
		borderBottomColor: "#e5e7eb",
	},
	brandName: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#1a1a2e" },
	brandSub: { fontSize: 8, color: "#6b7280", marginTop: 3 },
	receiptLabel: {
		fontSize: 22,
		fontFamily: "Helvetica-Bold",
		color: "#1a1a2e",
	},
	receiptNumber: {
		fontSize: 9,
		color: "#6b7280",
		marginTop: 4,
		textAlign: "right",
	},
	sectionTitle: {
		fontSize: 8,
		fontFamily: "Helvetica-Bold",
		color: "#6b7280",
		textTransform: "uppercase",
		letterSpacing: 0.8,
		marginBottom: 6,
	},
	section: { marginBottom: 24 },
	mutedText: { color: "#6b7280", marginTop: 2 },
	row: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 5,
	},
	label: { color: "#6b7280", flex: 1 },
	value: { fontFamily: "Helvetica-Bold", flex: 2, textAlign: "right" },
	divider: {
		borderBottomWidth: 1,
		borderBottomColor: "#e5e7eb",
		marginVertical: 16,
	},
	totalRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		backgroundColor: "#f3f4f6",
		borderRadius: 6,
		padding: 14,
		marginTop: 8,
	},
	totalLabel: { fontSize: 11, fontFamily: "Helvetica-Bold" },
	totalValue: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#1a1a2e" },
	badge: {
		alignSelf: "flex-start",
		backgroundColor: "#dcfce7",
		borderRadius: 20,
		paddingHorizontal: 10,
		paddingVertical: 5,
		marginTop: 16,
	},
	badgeText: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#16a34a" },
	footer: {
		position: "absolute",
		bottom: 32,
		left: 48,
		right: 48,
		borderTopWidth: 1,
		borderTopColor: "#e5e7eb",
		paddingTop: 12,
		flexDirection: "row",
		justifyContent: "space-between",
	},
	footerText: { fontSize: 8, color: "#9ca3af" },
});

function fmt(n: number, currency: string) {
	return `${n.toLocaleString("fr-FR")} ${currency}`;
}

function fmtDate(d: string | Date | null | undefined) {
	if (!d) return "—";
	return new Date(d).toLocaleDateString("fr-FR", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});
}

type ReceiptProps = {
	invoiceNumber: string;
	amount: number;
	currency: string;
	period: string | null;
	description: string | null;
	invoiceCreatedAt: string;
	paymentMethod: string;
	paidAt: string | null;
	clientName: string;
	clientEmail: string;
	orgName: string;
};

function ReceiptDocument(p: ReceiptProps) {
	const methodLabel =
		p.paymentMethod === "cash" ? "Cash / transfer" : "NotchPay";

	return createElement(
		Document,
		{ title: `Receipt ${p.invoiceNumber}` },
		createElement(
			Page,
			{ size: "A4", style: styles.page },
			// Header
			createElement(
				View,
				{ style: styles.header },
				createElement(
					View,
					null,
					createElement(Text, { style: styles.brandName }, "TKAMS"),
					createElement(
						Text,
						{ style: styles.brandSub },
						"Academic Grades Management",
					),
				),
				createElement(
					View,
					null,
					createElement(Text, { style: styles.receiptLabel }, "RECEIPT"),
					createElement(Text, { style: styles.receiptNumber }, p.invoiceNumber),
				),
			),
			// Billed to
			createElement(
				View,
				{ style: styles.section },
				createElement(Text, { style: styles.sectionTitle }, "Billed to"),
				createElement(Text, null, p.clientName || p.clientEmail),
				p.clientName
					? createElement(Text, { style: styles.mutedText }, p.clientEmail)
					: null,
				p.orgName
					? createElement(Text, { style: styles.mutedText }, p.orgName)
					: null,
			),
			// Details
			createElement(
				View,
				{ style: styles.section },
				createElement(Text, { style: styles.sectionTitle }, "Invoice details"),
				createElement(
					View,
					{ style: styles.row },
					createElement(Text, { style: styles.label }, "Invoice date"),
					createElement(
						Text,
						{ style: styles.value },
						fmtDate(p.invoiceCreatedAt),
					),
				),
				createElement(
					View,
					{ style: styles.row },
					createElement(Text, { style: styles.label }, "Payment date"),
					createElement(
						Text,
						{ style: styles.value },
						fmtDate(p.paidAt ?? p.invoiceCreatedAt),
					),
				),
				createElement(
					View,
					{ style: styles.row },
					createElement(Text, { style: styles.label }, "Payment method"),
					createElement(Text, { style: styles.value }, methodLabel),
				),
				p.period
					? createElement(
							View,
							{ style: styles.row },
							createElement(Text, { style: styles.label }, "Period"),
							createElement(Text, { style: styles.value }, p.period),
						)
					: null,
				p.description
					? createElement(
							View,
							{ style: styles.row },
							createElement(Text, { style: styles.label }, "Description"),
							createElement(Text, { style: styles.value }, p.description),
						)
					: null,
			),
			createElement(View, { style: styles.divider }),
			// Total
			createElement(
				View,
				{ style: styles.totalRow },
				createElement(Text, { style: styles.totalLabel }, "Total paid"),
				createElement(
					Text,
					{ style: styles.totalValue },
					fmt(p.amount, p.currency),
				),
			),
			createElement(
				View,
				{ style: styles.badge },
				createElement(Text, { style: styles.badgeText }, "PAID"),
			),
			// Footer
			createElement(
				View,
				{ style: styles.footer },
				createElement(Text, { style: styles.footerText }, "TKAMS — tkams.com"),
				createElement(
					Text,
					{ style: styles.footerText },
					`Generated on ${fmtDate(new Date().toISOString())}`,
				),
			),
		),
	);
}

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;

	const user = await getRequestUser(request);
	if (!user) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const payload = await getPayload({ config: configPromise });

	const invoice = await payload
		.findByID({ collection: "invoices", id, depth: 1 })
		.catch(() => null);

	if (!invoice) {
		return Response.json({ error: "Not found" }, { status: 404 });
	}

	const clientId =
		typeof invoice.client === "object"
			? (invoice.client as { id: string }).id
			: invoice.client;

	const isAdmin = (user as { role?: string }).role === "super_admin";
	if (!isAdmin && String(clientId) !== String(user.id)) {
		return Response.json({ error: "Forbidden" }, { status: 403 });
	}

	// Fetch the completed payment for this invoice
	const { docs: payments } = await payload.find({
		collection: "payments",
		where: {
			and: [{ invoice: { equals: id } }, { status: { equals: "completed" } }],
		},
		sort: "-createdAt",
		limit: 1,
	});
	const payment = payments[0] ?? null;

	const clientField = invoice.client as
		| { name?: string; email?: string }
		| string;
	const clientName =
		typeof clientField === "object" ? (clientField.name ?? "") : "";
	const clientEmail =
		typeof clientField === "object" ? (clientField.email ?? "") : "";
	const instanceField = invoice.instance as
		| { orgName?: string }
		| string
		| null;
	const orgName =
		typeof instanceField === "object" ? (instanceField?.orgName ?? "") : "";

	const doc = ReceiptDocument({
		invoiceNumber: String(invoice.invoiceNumber ?? id),
		amount: invoice.amount ?? 0,
		currency: (invoice.currency as string) ?? "XAF",
		period: (invoice.period as string | null) ?? null,
		description: (invoice.description as string | null) ?? null,
		invoiceCreatedAt: invoice.createdAt as string,
		paymentMethod: (payment?.method as string) ?? "notchpay",
		paidAt:
			(payment?.paidAt as string | null) ??
			(payment?.createdAt as string | null) ??
			null,
		clientName,
		clientEmail,
		orgName,
	});

	const buffer = await renderToBuffer(doc);

	return new Response(buffer, {
		headers: {
			"Content-Type": "application/pdf",
			"Content-Disposition": `attachment; filename="receipt-${invoice.invoiceNumber ?? id}.pdf"`,
			"Cache-Control": "private, no-cache",
		},
	});
}
