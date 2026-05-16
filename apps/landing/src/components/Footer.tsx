import { useI18n } from "../i18n/context";

const APP_URL = "https://app.tkams.com";
const OVERBRAND_URL = "https://overbrand.net";

export default function Footer() {
	const { t } = useI18n();
	const year = new Date().getFullYear();

	const sections = [
		{
			title: t("footer.product"),
			links: [
				{ label: t("footer.features"), href: "#features" },
				{ label: t("footer.screenshots"), href: "#screenshots" },
				{ label: t("footer.pricing"), href: "#pricing" },
			],
		},
		{
			title: t("footer.company"),
			links: [
				{ label: t("footer.about"), href: "#about" },
				{ label: t("footer.contact"), href: OVERBRAND_URL, external: true },
			],
		},
		{
			title: t("footer.app"),
			links: [{ label: t("footer.access"), href: APP_URL, external: true }],
		},
	];

	return (
		<footer className="site-footer mt-20 px-4 pt-10 pb-12">
			<div className="page-wrap">
				<div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
					{/* Brand */}
					<div className="lg:col-span-1">
						<a href="/" className="mb-4 inline-flex no-underline">
							<img src="/logo.png" alt="TKAMS" className="h-7 w-auto" />
						</a>
						<p className="m-0 max-w-[18ch] text-[var(--sea-ink-soft)] text-sm leading-6">
							{t("footer.tagline")}
						</p>
					</div>

					{/* Link columns */}
					{sections.map((s) => (
						<div key={s.title}>
							<p className="island-kicker mb-3">{s.title}</p>
							<ul className="m-0 list-none space-y-2.5 p-0">
								{s.links.map((l) => (
									<li key={l.label}>
										<a
											href={l.href}
											{...(l.external
												? { target: "_blank", rel: "noopener noreferrer" }
												: {})}
											className="text-[var(--sea-ink-soft)] text-sm no-underline transition hover:text-[var(--lagoon-deep)]"
										>
											{l.label}
										</a>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>

				<div className="section-divider mt-10 mb-6" />

				<div className="flex flex-col items-center justify-between gap-3 text-center text-[var(--sea-ink-soft)] text-xs sm:flex-row sm:text-left">
					<p className="m-0">
						{t("footer.copyright_prefix")} {year}{" "}
						<strong className="font-semibold text-[var(--sea-ink)]">
							TKAMS
						</strong>
					</p>
					<p className="m-0">
						{t("footer.copyright_suffix")}{" "}
						<a
							href={OVERBRAND_URL}
							target="_blank"
							rel="noopener noreferrer"
							className="font-semibold text-[var(--lagoon-deep)]"
						>
							Overbrand
						</a>
					</p>
				</div>
			</div>
		</footer>
	);
}
