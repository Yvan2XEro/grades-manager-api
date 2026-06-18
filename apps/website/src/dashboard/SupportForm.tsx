"use client";

import { CheckCircle2, MessageSquare, TicketCheck } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { Dict } from "@/i18n";
import type { User } from "@/payload-types";
import { cn } from "@/utilities/ui";

type FormData = {
	subject: string;
	message: string;
	instanceId?: string;
};

type InstanceOption = {
	id: string;
	subdomain: string | null;
	orgName: string | null;
};

type Ticket = {
	id: string;
	subject: string;
	status: string;
	createdAt: string;
};

const inputCls =
	"w-full rounded-[0.625rem] border border-tk-border bg-tk-bg px-4 py-3 font-body text-[0.9375rem] text-tk-ink outline-none transition-colors focus:border-tk-primary";

const TICKET_STATUS_STYLES: Record<string, string> = {
	open: "bg-tk-primary/8 text-tk-primary border-tk-primary/25",
	in_progress:
		"bg-[oklch(0.72_0.16_86/0.12)] text-[oklch(0.52_0.14_86)] border-[oklch(0.72_0.16_86/0.3)]",
	resolved:
		"bg-[oklch(0.58_0.17_149/0.1)] text-[oklch(0.42_0.14_149)] border-[oklch(0.58_0.17_149/0.3)]",
};

export function SupportForm({
	user: _user,
	dict: d,
	instances,
	tickets,
}: {
	user: User;
	dict: Dict;
	instances: InstanceOption[];
	tickets: Ticket[];
}) {
	const s = d.dashboard.support;
	const [sent, setSent] = useState(false);
	const [serverError, setServerError] = useState("");

	const {
		register,
		handleSubmit,
		control,
		reset,
		formState: { isSubmitting, errors },
	} = useForm<FormData>();

	const onSubmit = async (data: FormData) => {
		setServerError("");
		const res = await fetch("/api/support", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({
				subject: data.subject,
				message: data.message,
				instanceId:
					data.instanceId && data.instanceId !== "__none__"
						? data.instanceId
						: undefined,
			}),
		});
		if (res.ok) {
			setSent(true);
			reset();
		} else {
			setServerError("An error occurred. Please try again.");
		}
	};

	return (
		<div className="flex flex-col gap-8">
			{/* ── Form ── */}
			{sent ? (
				<div className="flex flex-col items-center gap-3 rounded-[1rem] border border-tk-border bg-tk-surface p-8 text-center">
					<div className="flex h-12 w-12 items-center justify-center rounded-full border border-tk-accent-emerald/40 bg-[oklch(0.58_0.17_149/0.08)]">
						<CheckCircle2
							size={22}
							strokeWidth={1.75}
							className="text-tk-accent-emerald"
						/>
					</div>
					<div>
						<p className="font-display font-semibold text-[1rem] text-tk-ink">
							{s.success}
						</p>
					</div>
					<button
						type="button"
						onClick={() => setSent(false)}
						className="font-body text-[0.875rem] text-tk-primary hover:underline"
					>
						{s.form_title}
					</button>
				</div>
			) : (
				<form
					onSubmit={handleSubmit(onSubmit)}
					className="flex flex-col gap-5 rounded-[1rem] border border-tk-border bg-tk-surface p-6"
				>
					<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
						<div className="sm:col-span-2">
							<Label className="mb-1.5 block font-body font-medium text-[0.875rem] text-tk-ink-soft">
								{s.subject}
							</Label>
							<input
								type="text"
								{...register("subject", {
									required: d.register.errors.required,
									minLength: { value: 2, message: "Minimum 2 characters" },
								})}
								className={cn(
									inputCls,
									errors.subject && "border-[oklch(0.65_0.2_25/0.5)]",
								)}
							/>
							{errors.subject && (
								<p className="mt-1 font-body text-[0.8125rem] text-[oklch(0.55_0.2_25)]">
									{errors.subject.message}
								</p>
							)}
						</div>

						{instances.length > 0 && (
							<div className="sm:col-span-2">
								<Label className="mb-1.5 block font-body font-medium text-[0.875rem] text-tk-ink-soft">
									{s.instance_label}
								</Label>
								<Controller
									name="instanceId"
									control={control}
									render={({ field }) => (
										<Select
											onValueChange={field.onChange}
											value={field.value ?? "__none__"}
										>
											<SelectTrigger className="h-auto rounded-[0.625rem] border-tk-border bg-tk-bg px-4 py-3 font-body text-[0.9375rem] text-tk-ink focus:ring-tk-primary/20">
												<SelectValue placeholder={s.instance_placeholder} />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="__none__">
													{s.instance_placeholder}
												</SelectItem>
												{instances.map((inst) => (
													<SelectItem key={inst.id} value={inst.id}>
														{inst.subdomain} — {inst.orgName}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									)}
								/>
							</div>
						)}
					</div>

					<div>
						<Label className="mb-1.5 block font-body font-medium text-[0.875rem] text-tk-ink-soft">
							{s.message}
						</Label>
						<textarea
							rows={5}
							{...register("message", {
								required: d.register.errors.required,
								minLength: { value: 10, message: "Minimum 10 characters" },
							})}
							placeholder={s.message_placeholder}
							className={cn(
								inputCls,
								"resize-none",
								errors.message && "border-[oklch(0.65_0.2_25/0.5)]",
							)}
						/>
						{errors.message && (
							<p className="mt-1 font-body text-[0.8125rem] text-[oklch(0.55_0.2_25)]">
								{errors.message.message}
							</p>
						)}
					</div>

					{serverError && (
						<p className="font-body text-[0.875rem] text-[oklch(0.55_0.2_25)]">
							{serverError}
						</p>
					)}

					<button
						type="submit"
						disabled={isSubmitting}
						className={`tk-btn-primary justify-center ${isSubmitting ? "cursor-wait opacity-70" : ""}`}
					>
						{isSubmitting ? s.submitting : s.submit}
					</button>
				</form>
			)}

			{/* ── Ticket history ── */}
			<div>
				<h2 className="mb-4 flex items-center gap-2 font-display font-semibold text-[1rem] text-tk-ink">
					<TicketCheck size={16} strokeWidth={1.75} className="text-tk-muted" />
					{s.tickets_title}
				</h2>

				{tickets.length === 0 ? (
					<div className="flex items-center gap-3 rounded-[0.875rem] border border-tk-border border-dashed px-5 py-4">
						<MessageSquare
							size={16}
							strokeWidth={1.5}
							className="text-tk-muted"
						/>
						<p className="font-body text-[0.875rem] text-tk-muted">
							{s.tickets_empty}
						</p>
					</div>
				) : (
					<div className="flex flex-col divide-y divide-tk-border overflow-hidden rounded-[1rem] border border-tk-border bg-tk-surface">
						{tickets.map((ticket) => {
							const statusStyle =
								TICKET_STATUS_STYLES[ticket.status] ??
								TICKET_STATUS_STYLES.open;
							const statusLabel =
								s.ticket_status[
									ticket.status as keyof typeof s.ticket_status
								] ?? ticket.status;
							return (
								<div
									key={ticket.id}
									className="flex items-center justify-between gap-4 px-5 py-4"
								>
									<div className="min-w-0 flex-1">
										<p className="truncate font-body font-medium text-[0.9375rem] text-tk-ink">
											{ticket.subject}
										</p>
										<p className="mt-0.5 font-code text-[0.75rem] text-tk-muted">
											{new Date(ticket.createdAt).toLocaleDateString("fr-FR", {
												day: "numeric",
												month: "short",
												year: "numeric",
											})}
										</p>
									</div>
									<span
										className={`inline-flex flex-shrink-0 items-center rounded-full border px-2.5 py-1 font-code font-semibold text-[0.75rem] ${statusStyle}`}
									>
										{statusLabel}
									</span>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
