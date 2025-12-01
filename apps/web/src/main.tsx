import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { NuqsAdapter } from "nuqs/adapters/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { Toaster } from "sonner";
import App from "./App";
import "./i18n";
import "./index.css";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: true,
		},
	},
});

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<NuqsAdapter>
			<QueryClientProvider client={queryClient}>
				<BrowserRouter>
					<App />
					<Toaster position="top-right" richColors closeButton />
				</BrowserRouter>
				<ReactQueryDevtools initialIsOpen={false} />
			</QueryClientProvider>
		</NuqsAdapter>
	</StrictMode>,
);
