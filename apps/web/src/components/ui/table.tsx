import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuTrigger,
} from "./context-menu";

function Table({ className, ...props }: React.ComponentProps<"table">) {
	const containerRef = React.useRef<HTMLDivElement>(null);
	const tableRef = React.useRef<HTMLTableElement>(null);
	const [canScrollLeft, setCanScrollLeft] = React.useState(false);
	const [canScrollRight, setCanScrollRight] = React.useState(false);
	const [isDragging, setIsDragging] = React.useState(false);
	const dragStart = React.useRef<{ x: number; scrollLeft: number } | null>(null);
	const [arrowY, setArrowY] = React.useState<number | null>(null);
	const outerRef = React.useRef<HTMLDivElement>(null);

	const checkScroll = React.useCallback(() => {
		const el = containerRef.current;
		if (!el) return;
		setCanScrollLeft(el.scrollLeft > 0);
		setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
	}, []);

	React.useLayoutEffect(() => {
		checkScroll();
	});

	React.useEffect(() => {
		const el = containerRef.current;
		const table = tableRef.current;
		if (!el) return;
		el.addEventListener("scroll", checkScroll);
		const ro = new ResizeObserver(checkScroll);
		ro.observe(el);
		if (table) ro.observe(table);
		return () => {
			el.removeEventListener("scroll", checkScroll);
			ro.disconnect();
		};
	}, [checkScroll]);

	const scroll = (dir: "left" | "right") => {
		containerRef.current?.scrollBy({
			left: dir === "left" ? -240 : 240,
			behavior: "smooth",
		});
	};

	const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
		const el = containerRef.current;
		if (!el) return;
		dragStart.current = { x: e.clientX, scrollLeft: el.scrollLeft };
		setIsDragging(true);
	};

	React.useEffect(() => {
		const onMouseMove = (e: MouseEvent) => {
			if (!dragStart.current || !containerRef.current) return;
			const dx = e.clientX - dragStart.current.x;
			containerRef.current.scrollLeft = dragStart.current.scrollLeft - dx;
		};
		const onMouseUp = () => {
			dragStart.current = null;
			setIsDragging(false);
		};
		window.addEventListener("mousemove", onMouseMove);
		window.addEventListener("mouseup", onMouseUp);
		return () => {
			window.removeEventListener("mousemove", onMouseMove);
			window.removeEventListener("mouseup", onMouseUp);
		};
	}, []);

	const onMouseMove = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
		const el = outerRef.current;
		if (!el) return;
		const rect = el.getBoundingClientRect();
		const y = e.clientY - rect.top;
		const clamped = Math.max(16, Math.min(y, rect.height - 16));
		setArrowY(clamped);
	}, []);

	const arrowStyle = arrowY !== null
		? { top: arrowY, transform: "translateY(-50%)" }
		: undefined;

	return (
		<div
			ref={outerRef}
			className="relative w-full"
			onMouseMove={onMouseMove}
			onMouseLeave={() => setArrowY(null)}
		>
			<div
				data-slot="table-container"
				ref={containerRef}
				onMouseDown={onMouseDown}
				className={cn(
					"table-scroll w-full overflow-x-auto",
					canScrollLeft || canScrollRight
						? isDragging
							? "cursor-grabbing select-none"
							: "cursor-grab"
						: "",
				)}
			>
				<table
					ref={tableRef}
					data-slot="table"
					className={cn("w-full caption-bottom text-sm", className)}
					{...props}
				/>
			</div>
			{canScrollLeft && (
				<button
					type="button"
					onClick={() => scroll("left")}
					style={arrowStyle}
					className="absolute left-0 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-md backdrop-blur-sm transition-[background-color] hover:bg-muted"
				>
					<ChevronLeft className="h-4 w-4" />
				</button>
			)}
			{canScrollRight && (
				<button
					type="button"
					onClick={() => scroll("right")}
					style={arrowStyle}
					className="absolute right-0 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-md backdrop-blur-sm transition-[background-color] hover:bg-muted"
				>
					<ChevronRight className="h-4 w-4" />
				</button>
			)}
		</div>
	);
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
	return (
		<thead
			data-slot="table-header"
			className={cn("border-b border-border bg-muted/40", className)}
			{...props}
		/>
	);
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
	return (
		<tbody
			data-slot="table-body"
			className={cn("[&_tr:last-child]:border-0", className)}
			{...props}
		/>
	);
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
	return (
		<tfoot
			data-slot="table-footer"
			className={cn(
				"border-t border-border bg-muted/40 font-medium [&>tr]:last:border-b-0",
				className,
			)}
			{...props}
		/>
	);
}

type TableRowProps = React.ComponentProps<"tr"> & {
	/** Content rendered inside a right-click context menu for this row. */
	actions?: React.ReactNode;
};

function TableRow({ className, actions, ...props }: TableRowProps) {
	const rowClass = cn(
		"group border-b border-border/50 transition-all duration-150 hover:bg-muted/50 data-[state=selected]:bg-primary/5 data-[state=selected]:shadow-[inset_3px_0_0_0_var(--primary)] hover:shadow-[inset_3px_0_0_0_hsl(var(--primary)/0.4)]",
		actions && "cursor-context-menu",
		className,
	);

	if (!actions) {
		return <tr data-slot="table-row" className={rowClass} {...props} />;
	}

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>
				<tr data-slot="table-row" className={rowClass} {...props} />
			</ContextMenuTrigger>
			<ContextMenuContent>{actions}</ContextMenuContent>
		</ContextMenu>
	);
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
	return (
		<th
			data-slot="table-head"
			className={cn(
				"h-9 px-4 py-2.5 text-left align-middle font-medium text-[11px] text-muted-foreground uppercase tracking-wider [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
				className,
			)}
			{...props}
		/>
	);
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
	return (
		<td
			data-slot="table-cell"
			className={cn(
				"px-4 py-3 align-middle text-sm [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
				className,
			)}
			{...props}
		/>
	);
}

function TableCaption({
	className,
	...props
}: React.ComponentProps<"caption">) {
	return (
		<caption
			data-slot="table-caption"
			className={cn("mt-4 text-muted-foreground text-xs", className)}
			{...props}
		/>
	);
}

export {
	Table,
	TableHeader,
	TableBody,
	TableFooter,
	TableRow,
	TableHead,
	TableCell,
	TableCaption,
};
