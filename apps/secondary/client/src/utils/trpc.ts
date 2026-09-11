import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink, TRPCClientError } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../src/routers/index";

export type RouterOutputs = inferRouterOutputs<AppRouter>;

export const trpc = createTRPCReact<AppRouter>();

let _suspendedCallback: (() => void) | null = null;

export function onSuspended(cb: () => void) {
	_suspendedCallback = cb;
}

function checkSuspension(error: unknown) {
	if (
		error instanceof TRPCClientError &&
		error.message === "ACCOUNT_SUSPENDED"
	) {
		_suspendedCallback?.();
	}
}

export const queryClient = new QueryClient({
	queryCache: new QueryCache({ onError: checkSuspension }),
	mutationCache: new MutationCache({ onError: checkSuspension }),
	defaultOptions: {
		queries: {
			staleTime: 30_000,
			retry: (failureCount, error) => {
				if (
					error instanceof TRPCClientError &&
					error.message === "ACCOUNT_SUSPENDED"
				) {
					return false;
				}
				return failureCount < 1;
			},
		},
	},
});

export const trpcClient = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: "/trpc",
		}),
	],
});
