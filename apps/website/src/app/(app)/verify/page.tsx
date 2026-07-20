import configPromise from "@payload-config";
import type { Metadata } from "next";
import Link from "next/link";
import { getPayload } from "payload";
import { getDict, getLocale } from "@/i18n";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Vérification email — TKAMS" };

export default async function VerifyPage({
	searchParams,
}: {
	searchParams: Promise<{ token?: string }>;
}) {
	const { token } = await searchParams;
	const locale = await getLocale();
	const d = getDict(locale);
	const v = d.auth.verify;

	if (!token) {
		return (
			<VerifyShell title={v.missing_title} body={v.missing_body} isError />
		);
	}

	try {
		const payload = await getPayload({ config: configPromise });
		await payload.verifyEmail({ collection: "users", token });
		return (
			<VerifyShell title={v.success_title} body={v.success_body}>
				<Link
					href="/login"
					className="mt-6 inline-flex items-center justify-center rounded-lg bg-[#4f6ef7] px-6 py-3 font-semibold text-sm text-white transition-colors hover:bg-[#3d5ce5]"
				>
					{v.login_cta}
				</Link>
			</VerifyShell>
		);
	} catch {
		return (
			<VerifyShell title={v.error_title} body={v.error_body} isError>
				<Link
					href="/signup"
					className="mt-6 inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 text-sm transition-colors hover:bg-gray-50"
				>
					{v.retry_cta}
				</Link>
			</VerifyShell>
		);
	}
}

function VerifyShell({
	title,
	body,
	isError = false,
	children,
}: {
	title: string;
	body: string;
	isError?: boolean;
	children?: React.ReactNode;
}) {
	return (
		<div className="flex min-h-screen items-center justify-center bg-[#f4f6fb] px-4">
			<div className="w-full max-w-md rounded-2xl bg-white p-10 text-center shadow-sm">
				<div
					className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full text-3xl ${
						isError ? "bg-red-50" : "bg-green-50"
					}`}
				>
					{isError ? "✗" : "✓"}
				</div>
				<h1 className="mb-2 font-bold text-2xl text-gray-900 tracking-tight">
					{title}
				</h1>
				<p className="text-[15px] text-gray-500 leading-relaxed">{body}</p>
				{children}
			</div>
		</div>
	);
}
