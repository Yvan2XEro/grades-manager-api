"use client";

import { Check, Download, FileText } from "lucide-react";
import { useRef, useState } from "react";
import type { Dict } from "@/i18n";
import { type GhostApi, GhostCursor, useGhostCursor } from "./ghost";

type T = Dict["demos"]["docexport"];
type Kind = "releve" | "attestation" | "pv";

export function DocExportDemo({ t }: { t: T }) {
	const [kind, setKind] = useState<Kind>("releve");
	const [generated, setGenerated] = useState(false);

	const pick = (k: Kind) => {
		setKind(k);
		setGenerated(false);
	};

	const tabs: { k: Kind; label: string }[] = [
		{ k: "releve", label: t.releve },
		{ k: "attestation", label: t.attestation },
		{ k: "pv", label: t.pv },
	];
	const title =
		kind === "releve"
			? t.releve
			: kind === "attestation"
				? t.attestation
				: t.pv;

	const containerRef = useRef<HTMLDivElement>(null);
	const { pos, clicking } = useGhostCursor(
		containerRef,
		async (api: GhostApi) => {
			await api.moveTo('[data-cursor="tab-attestation"]');
			await api.click();
			if (api.cancelled()) return;
			pick("attestation");
			await api.sleep(500);
			await api.moveTo('[data-cursor="gen"]');
			await api.click();
			if (api.cancelled()) return;
			setGenerated(true);
		},
	);

	return (
		<div ref={containerRef} className="relative p-4 sm:p-5">
			<GhostCursor pos={pos} clicking={clicking} />
			<div className="mb-4 flex flex-wrap items-center justify-between gap-2">
				<div>
					<p className="font-body font-semibold text-[0.875rem] text-tk-ink">
						{t.title}
					</p>
					<p className="font-code text-[0.75rem] text-tk-muted">{t.subtitle}</p>
				</div>
			</div>

			{/* Tabs */}
			<div className="flex gap-1.5">
				{tabs.map((tab) => (
					<button
						key={tab.k}
						type="button"
						data-cursor={`tab-${tab.k}`}
						onClick={() => pick(tab.k)}
						className={`rounded-lg px-3.5 py-1.5 font-body font-medium text-[0.8125rem] transition-colors duration-150 ${
							kind === tab.k
								? "bg-tk-primary text-white"
								: "border border-tk-border text-tk-ink-soft hover:border-tk-primary"
						}`}
					>
						{tab.label}
					</button>
				))}
			</div>

			{/* Preview */}
			<div className="mt-4 grid grid-cols-[auto_1fr] gap-4">
				<div className="flex w-[120px] flex-col rounded-lg border border-tk-border-strong bg-white p-3 shadow-[0_10px_24px_-16px_oklch(0.13_0.03_264/0.4)]">
					<div className="border-tk-ink border-b pb-1.5 text-center">
						<p className="font-display font-extrabold text-[7px] text-tk-primary uppercase">
							{title}
						</p>
					</div>
					<div className="mt-2 flex flex-col gap-1">
						<span className="h-[3px] w-[85%] rounded-full bg-tk-bg-deep" />
						<span className="h-[3px] w-[70%] rounded-full bg-tk-bg-deep" />
						<span className="h-[3px] w-[78%] rounded-full bg-tk-bg-deep" />
					</div>
					<div className="mt-auto flex items-end justify-between pt-3">
						<span className="flex h-6 w-6 items-center justify-center rounded-full border border-tk-primary text-[3.5px] text-tk-primary">
							SCEAU
						</span>
						<span
							className="h-6 w-6 rounded-[2px]"
							style={{
								background:
									"repeating-conic-gradient(var(--tk-ink) 0% 25%, #fff 0% 50%) 0 0 / 6px 6px",
							}}
						/>
					</div>
				</div>

				<div className="flex flex-col justify-center">
					<p className="font-body font-semibold text-[0.875rem] text-tk-ink">
						{title}
					</p>
					<p className="mt-0.5 font-code text-[0.72rem] text-tk-muted">
						{t.student}
					</p>
					<p className="mt-2 font-code text-[0.72rem] text-tk-ink-2">
						{generated ? t.ready : t.hint}
					</p>
					<div className="mt-4 flex flex-wrap gap-2">
						<button
							type="button"
							data-cursor="gen"
							onClick={() => setGenerated(true)}
							className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 font-body font-semibold text-[0.8125rem] transition-all duration-150 ${
								generated
									? "border border-tk-border text-tk-muted"
									: "bg-tk-primary text-white hover:bg-tk-primary-deep"
							}`}
						>
							{generated ? <Check size={15} /> : <FileText size={15} />}
							{generated ? t.generated : t.generate}
						</button>
						{generated && (
							<button
								type="button"
								className="inline-flex items-center gap-2 rounded-lg border border-tk-border px-4 py-2 font-body font-medium text-[0.8125rem] text-tk-ink-soft transition-colors duration-150 hover:border-tk-primary hover:text-tk-primary"
							>
								<Download size={15} /> {t.download}
							</button>
						)}
					</div>
					{generated && (
						<p className="mt-2 font-code text-[0.68rem] text-tk-accent-emerald">
							{t.verified}
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
