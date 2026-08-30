import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router";
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
					<AppRoutes />
				</HashRouter>
			</QueryClientProvider>
		</trpc.Provider>
	</StrictMode>,
);
