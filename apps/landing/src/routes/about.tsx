import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
	beforeLoad: () => {
		throw redirect({ to: "/", hash: "about" });
	},
	component: () => null,
});
