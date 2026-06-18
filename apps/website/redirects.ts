import type { NextConfig } from "next";

export const redirects: NextConfig["redirects"] = async () => {
	const internetExplorerRedirect = {
		destination: "/ie-incompatible.html",
		has: [
			{
				type: "header" as const,
				key: "user-agent",
				value: "(.*Trident.*)", // all ie browsers
			},
		],
		permanent: false,
		source: "/:path((?!ie-incompatible.html$).*)", // all pages except the incompatibility page
	};

	const wwwRedirect = {
		source: "/:path*",
		has: [{ type: "host" as const, value: "www.tkams.com" }],
		destination: "https://tkams.com/:path*",
		permanent: true,
	};

	return [internetExplorerRedirect, wwwRedirect];
};
