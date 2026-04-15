import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { inferRouterOutputs } from "@trpc/server";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { detectOrganizationSlug } from "@/lib/organization";
import { getServerUrl } from "@/lib/runtime-config";
import { toast } from "@/lib/toast";
import type { AppRouter } from "../../../server/src/routers";

export const queryClient = new QueryClient({
	queryCache: new QueryCache({
		onError: (error) => {
			toast.error(error.message, {
				action: {
					label: "retry",
					onClick: () => {
						queryClient.invalidateQueries();
					},
				},
			});
		},
	}),
});

export const trpcClient = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: `${getServerUrl()}/trpc`,
			fetch(url, options) {
				let orgSlug: string | undefined;
				try {
					orgSlug = detectOrganizationSlug();
				} catch {
					// no-op: env var not set, header won't be sent
				}
				return fetch(url, {
					...options,
					credentials: "include",
					headers: {
						...(options?.headers as Record<string, string> | undefined),
						...(orgSlug ? { "X-Organization-Slug": orgSlug } : {}),
					},
				});
			},
		}),
	],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
	client: trpcClient,
	queryClient,
});

export type RouterOutputs = inferRouterOutputs<AppRouter>;
