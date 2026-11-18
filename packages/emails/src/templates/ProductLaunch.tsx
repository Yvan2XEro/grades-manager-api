import { WEBSITE_URL } from "../components/brand";
import { ProductLaunchEmail } from "../components/ProductLaunchEmail";
import type { Locale } from "../i18n";
import { t } from "../i18n";

interface ProductLaunchProps {
	firstName?: string;
	ctaUrl?: string;
	unsubscribeUrl?: string;
	locale?: Locale;
}

export default function ProductLaunch({
	firstName = "there",
	ctaUrl = WEBSITE_URL,
	unsubscribeUrl,
	locale = "fr",
}: ProductLaunchProps = {}) {
	const copy = t(locale).productLaunch;
	return (
		<ProductLaunchEmail
			copy={{ ...copy, greeting: copy.greeting(firstName) }}
			ctaUrl={ctaUrl}
			locale={locale}
			secondary={false}
			unsubscribeUrl={unsubscribeUrl}
		/>
	);
}
