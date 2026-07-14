import type { Dict } from "@/i18n";

/**
 * Shown only when Payload is unavailable and no form record can be fetched.
 * The form-builder plugin (ContactFormDynamic) is the primary path.
 */
export function StaticContactForm({ dict: d }: { dict: Dict }) {
	return (
		<div className="flex flex-col items-center gap-4 rounded-[0.625rem] border border-tk-border bg-tk-surface px-8 py-10 text-center">
			<p className="font-body text-[0.9375rem] text-tk-ink-soft">
				{d.contact.info.email_label}{" "}
				<a
					href="mailto:contact@tkams.com"
					className="font-semibold text-tk-primary no-underline"
				>
					contact@tkams.com
				</a>
			</p>
		</div>
	);
}
