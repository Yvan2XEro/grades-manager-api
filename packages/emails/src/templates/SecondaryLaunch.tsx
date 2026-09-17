import { WEBSITE_URL } from "../components/brand";
import { ProductLaunchEmail } from "../components/ProductLaunchEmail";
import type { Locale } from "../i18n";
import { t } from "../i18n";

interface SecondaryLaunchProps {
	firstName?: string;
	ctaUrl?: string;
	unsubscribeUrl?: string;
	locale?: Locale;
}

export default function SecondaryLaunch({
	firstName = "there",
	ctaUrl = WEBSITE_URL,
	unsubscribeUrl,
	locale = "fr",
}: SecondaryLaunchProps = {}) {
	const copy = t(locale).secondaryLaunch;
	return (
		<ProductLaunchEmail
			copy={{ ...copy, greeting: copy.greeting(firstName) }}
			ctaUrl={ctaUrl}
			locale={locale}
			secondary
			unsubscribeUrl={unsubscribeUrl}
		/>
	);
}
