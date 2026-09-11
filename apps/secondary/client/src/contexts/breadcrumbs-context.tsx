import { createContext, useContext, useEffect, useState } from "react";

export interface Crumb {
	label: string;
	href?: string;
}

interface BreadcrumbsContextValue {
	crumbs: Crumb[];
	setCrumbs: (crumbs: Crumb[]) => void;
}

export const BreadcrumbsContext = createContext<BreadcrumbsContextValue>({
	crumbs: [],
	setCrumbs: () => {},
});

export function BreadcrumbsProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [crumbs, setCrumbs] = useState<Crumb[]>([]);
	return (
		<BreadcrumbsContext.Provider value={{ crumbs, setCrumbs }}>
			{children}
		</BreadcrumbsContext.Provider>
	);
}

export function useBreadcrumbs(crumbs: Crumb[]) {
	const { setCrumbs } = useContext(BreadcrumbsContext);
	useEffect(() => {
		setCrumbs(crumbs);
		return () => setCrumbs([]);
	}, [JSON.stringify(crumbs), setCrumbs]);
}
