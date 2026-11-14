import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
	return (
		<div className="page-enter space-y-8">
			<div className="flex items-center justify-between">
				<div className="space-y-2">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-64" />
				</div>
				<Skeleton className="h-10 w-40 rounded-lg" />
			</div>
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
				{Array.from({ length: 6 }).map((_, i) => (
					<Skeleton key={i} className="h-24 rounded-xl" />
				))}
			</div>
			<div className="grid gap-6 lg:grid-cols-5">
				<Skeleton className="h-80 rounded-xl lg:col-span-3" />
				<Skeleton className="h-80 rounded-xl lg:col-span-2" />
			</div>
			<Skeleton className="h-56 rounded-xl" />
		</div>
	);
}
