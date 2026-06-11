"use client";
import { Search as SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import { useDebounce } from "@/utilities/useDebounce";

export const Search: React.FC<{ placeholder?: string }> = ({
	placeholder = "Search",
}) => {
	const [value, setValue] = useState("");
	const router = useRouter();

	const debouncedValue = useDebounce(value);

	useEffect(() => {
		router.push(`/search${debouncedValue ? `?q=${debouncedValue}` : ""}`);
	}, [debouncedValue, router]);

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
			}}
			className="relative"
		>
			<label htmlFor="search" className="sr-only">
				{placeholder}
			</label>
			<SearchIcon
				size={18}
				className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-4 text-tk-muted"
			/>
			<input
				id="search"
				value={value}
				onChange={(event) => setValue(event.target.value)}
				placeholder={placeholder}
				className="w-full rounded-xl border border-tk-border bg-tk-surface py-3.5 pr-4 pl-11 font-body text-[0.95rem] text-tk-ink outline-none transition-colors duration-150 placeholder:text-tk-muted focus:border-tk-primary focus:ring-2 focus:ring-tk-primary/15"
			/>
			<button type="submit" className="sr-only">
				submit
			</button>
		</form>
	);
};
