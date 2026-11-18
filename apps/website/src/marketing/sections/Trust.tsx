import type { Dict, Locale } from "@/i18n";
import { AnimateIn } from "../AnimateIn";
import { BrochureDownload } from "../BrochureDownload";
import { EditorialSection } from "../Editorial";
import { TrustBadges } from "../TrustBadges";

interface TrustProps {
	dict: Dict;
	locale: Locale;
}

export function Trust({ dict: d, locale }: TrustProps) {
	return (
		<EditorialSection
			level="supporting"
			id="ressources"
			number="08"
			label={d.trust.label}
			heading={d.trust.title}
			lede={
				<p className="max-w-[42ch] font-body text-[length:var(--tk-text-lead)] text-tk-ink-2 leading-[1.7]">
					{d.trust.sub}
				</p>
			}
			aside={
				<span className="inline-flex items-center gap-2 rounded-full border border-tk-primary/30 bg-tk-primary-soft px-3.5 py-1.5 font-code font-semibold text-[0.75rem] text-tk-primary tracking-[0.04em]">
					<span className="h-1.5 w-1.5 rounded-full bg-tk-primary" />
					{d.trust.pioneer_tag}
				</span>
			}
		>
			<div className="flex flex-col gap-10">
				<AnimateIn>
					<div>
						<p className="mb-4 font-code text-[length:var(--tk-text-xs)] text-tk-muted uppercase tracking-[0.14em]">
							{d.trust.badges_title}
						</p>
						<TrustBadges items={d.trust.labels.map((name) => ({ name }))} />
					</div>
				</AnimateIn>

				<AnimateIn delay={120}>
					<BrochureDownload brochure={d.brochure} locale={locale} />
				</AnimateIn>
			</div>
		</EditorialSection>
	);
}
