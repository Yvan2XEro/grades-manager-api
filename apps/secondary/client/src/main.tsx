import { QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router";
import { Toaster } from "sonner";
import { Confirm } from "./components/callable/confirm";
import "./i18n/index";
import "./index.css";
import { AppRoutes } from "./routes";
import { queryClient, trpc, trpcClient } from "./utils/trpc";

const root = document.getElementById("root")!;

createRoot(root).render(
	<StrictMode>
		<trpc.Provider client={trpcClient} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>
				<HashRouter>
					<NuqsAdapter>
						<AppRoutes />
					</NuqsAdapter>
				</HashRouter>
				<Confirm />
				<Toaster richColors closeButton duration={5000} />
			</QueryClientProvider>
		</trpc.Provider>
	</StrictMode>,
);
