import Link from "next/link";
import { getDict, getLocale } from "@/i18n";

export default async function NotFound() {
	const locale = await getLocale();
	const d = getDict(locale);

	return (
		<main className="bg-tk-bg pt-[68px]">
			<div className="mx-auto flex min-h-[72vh] max-w-[86rem] flex-col justify-center px-6 py-20 lg:px-10">
				<p className="font-display font-extrabold text-[clamp(4rem,16vw,11rem)] text-tk-ink leading-none tracking-[-0.05em]">
					{d.notFound.code}
				</p>
				<div className="mt-6 h-px w-full bg-tk-border-strong" />
				<div className="mt-8 grid grid-cols-1 gap-x-12 gap-y-8 lg:grid-cols-12">
					<h1 className="font-display font-extrabold text-[clamp(1.5rem,3vw,2.25rem)] text-tk-ink tracking-[-0.03em] lg:col-span-7">
						{d.notFound.title}
					</h1>
					<div className="flex flex-col gap-6 lg:col-span-5">
						<p className="max-w-[42ch] font-body text-[1.0625rem] text-tk-ink-2 leading-[1.7]">
							{d.notFound.sub}
						</p>
						<div className="flex flex-wrap gap-3.5">
							<Link href="/" className="tk-btn-primary">
								{d.notFound.home}
							</Link>
							<Link href="/contact" className="tk-btn-outline">
								{d.notFound.contact}
							</Link>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
