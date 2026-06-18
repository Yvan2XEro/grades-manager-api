import Link from "next/link";
import { CMSLink } from "@/components/Link";
import { Logo } from "@/components/Logo/Logo";
import { ThemeSelector } from "@/providers/Theme/ThemeSelector";
import { getCachedGlobal } from "@/utilities/getGlobals";

export async function Footer() {
	const footerData = await getCachedGlobal("footer", 1)();

	const navItems = footerData?.navItems || [];

	return (
		<footer className="mt-auto border-border border-t bg-black text-white dark:bg-card">
			<div className="container flex flex-col gap-8 py-8 md:flex-row md:justify-between">
				<Link className="flex items-center" href="/">
					<Logo />
				</Link>

				<div className="flex flex-col-reverse items-start gap-4 md:flex-row md:items-center">
					<ThemeSelector />
					<nav className="flex flex-col gap-4 md:flex-row">
						{navItems.map(({ link }, i) => {
							return <CMSLink className="text-white" key={i} {...link} />;
						})}
					</nav>
				</div>
			</div>
		</footer>
	);
}
