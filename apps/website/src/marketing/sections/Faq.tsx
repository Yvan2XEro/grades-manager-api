"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import type { Dict } from "@/i18n";
import { EditorialSection } from "../Editorial";

interface FaqProps {
	dict: Dict;
}

export function Faq({ dict: d }: FaqProps) {
	const [open, setOpen] = useState<number | null>(0);

	return (
		<EditorialSection
			id="faq"
			number="09"
			label={d.faq.label}
			heading={d.faq.title}
			lede={
				<p className="max-w-[42ch] font-body text-[1.0625rem] text-tk-ink-2 leading-[1.7]">
					{d.faq.sub}
				</p>
			}
			aside={
				<a href="/contact" className="tk-btn-outline">
					{d.nav.contact} →
				</a>
			}
			bg="bg-tk-surface"
		>
			<div>
				{d.faq.items.map((item, i) => {
					const isOpen = open === i;
					return (
						<div
							key={item.q}
							className="border-tk-border border-t last:border-b"
						>
							<button
								type="button"
								onClick={() => setOpen(isOpen ? null : i)}
								aria-expanded={isOpen}
								className="flex w-full items-center justify-between gap-4 py-5 text-left"
							>
								<span className="font-body font-semibold text-[1.0625rem] text-tk-ink">
									{item.q}
								</span>
								<Plus
									size={18}
									className={`shrink-0 text-tk-primary transition-transform duration-300 ${
										isOpen ? "rotate-45" : ""
									}`}
								/>
							</button>
							<div
								className={`grid transition-all duration-300 ease-out ${
									isOpen
										? "grid-rows-[1fr] pb-5 opacity-100"
										: "grid-rows-[0fr] opacity-0"
								}`}
							>
								<div className="overflow-hidden">
									<p className="max-w-[60ch] font-body text-[0.95rem] text-tk-ink-2 leading-[1.7]">
										{item.a}
									</p>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</EditorialSection>
	);
}
