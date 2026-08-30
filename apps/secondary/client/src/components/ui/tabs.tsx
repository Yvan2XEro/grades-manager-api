import * as TabsPrimitive from "@radix-ui/react-tabs";
import type * as React from "react";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

function TabsList({
	className,
	...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
	return (
		<TabsPrimitive.List
			className={cn("flex border-border border-b", className)}
			{...props}
		/>
	);
}

function TabsTrigger({
	className,
	...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) {
	return (
		<TabsPrimitive.Trigger
			className={cn(
				"inline-flex items-center justify-center whitespace-nowrap px-4 py-2 font-medium text-sm transition-colors",
				"-mb-px border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
				"border-transparent text-muted-foreground hover:text-foreground",
				"data-[state=active]:border-primary data-[state=active]:text-foreground",
				"disabled:pointer-events-none disabled:opacity-50",
				className,
			)}
			{...props}
		/>
	);
}

function TabsContent({
	className,
	...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) {
	return (
		<TabsPrimitive.Content
			className={cn(
				"mt-4 ring-offset-background focus-visible:outline-none",
				className,
			)}
			{...props}
		/>
	);
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
