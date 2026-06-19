"use client";

import { useField } from "@payloadcms/ui";
import { useEffect, useState } from "react";

export function ImageTagSelect({ path }: { path: string }) {
	const { value, setValue } = useField<string>({ path });
	const [tags, setTags] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetch("/api/admin/versions")
			.then((r) => r.json())
			.then((data: { tags?: string[]; error?: string }) => {
				if (data.error) {
					setError(data.error);
				} else {
					setTags(data.tags ?? []);
					if (!value && data.tags?.length) setValue(data.tags[0]);
				}
			})
			.catch(() => setError("Could not reach GHCR"))
			.finally(() => setLoading(false));
	}, []);

	if (loading)
		return (
			<p style={{ fontSize: 13, color: "#888" }}>Loading available versions…</p>
		);
	if (error)
		return (
			<div>
				<p style={{ fontSize: 13, color: "#c00" }}>
					Failed to load versions: {error}
				</p>
				<input
					type="text"
					value={value ?? ""}
					onChange={(e) => setValue(e.target.value)}
					style={{
						width: "100%",
						padding: "6px 8px",
						border: "1px solid #ccc",
					}}
					placeholder="e.g. latest or 1.2.3"
				/>
			</div>
		);

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
			<label htmlFor="imageTagSelect" style={{ fontSize: 13, fontWeight: 600 }}>
				Default Image Tag
			</label>
			<select
				id="imageTagSelect"
				value={value ?? ""}
				onChange={(e) => setValue(e.target.value)}
				style={{
					padding: "6px 8px",
					border: "1px solid #ccc",
					borderRadius: 4,
					fontSize: 14,
					background: "#fff",
				}}
			>
				{tags.map((t) => (
					<option key={t} value={t}>
						{t}
					</option>
				))}
			</select>
			<p style={{ fontSize: 12, color: "#666", margin: 0 }}>
				All new instances provisioned after saving will use this image tag.
			</p>
		</div>
	);
}
