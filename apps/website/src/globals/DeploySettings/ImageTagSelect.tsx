"use client";

import { useField } from "@payloadcms/ui";
import { useEffect, useState } from "react";

const CUSTOM = "__custom__";

export function ImageTagSelect({ path }: { path: string }) {
	const { value, setValue } = useField<string>({ path });
	const [tags, setTags] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);
	const [custom, setCustom] = useState("");
	const [showCustom, setShowCustom] = useState(false);

	useEffect(() => {
		fetch("/api/admin/versions")
			.then((r) => r.json())
			.then((data: { tags?: string[] }) => {
				const fetched = data.tags?.length ? data.tags : ["latest"];
				setTags(fetched);
				// If current value is not in the list, show custom input
				if (value && !fetched.includes(value)) {
					setCustom(value);
					setShowCustom(true);
				} else if (!value) {
					setValue(fetched[0]);
				}
			})
			.catch(() => setTags(["latest"]))
			.finally(() => setLoading(false));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleSelectChange = (v: string) => {
		if (v === CUSTOM) {
			setShowCustom(true);
			setValue(custom || "");
		} else {
			setShowCustom(false);
			setValue(v);
		}
	};

	const selectValue = showCustom ? CUSTOM : (value ?? tags[0] ?? "latest");

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
			<label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
				Default Image Tag
			</label>

			<select
				value={selectValue}
				onChange={(e) => handleSelectChange(e.target.value)}
				disabled={loading}
				style={{
					padding: "6px 10px",
					border: "1px solid #d1d5db",
					borderRadius: 6,
					fontSize: 14,
					background: "#fff",
					color: "#111827",
					cursor: loading ? "wait" : "default",
				}}
			>
				{loading ? (
					<option>Loading…</option>
				) : (
					<>
						{tags.map((t) => (
							<option key={t} value={t}>
								{t}
							</option>
						))}
						<option value={CUSTOM}>Custom version…</option>
					</>
				)}
			</select>

			{showCustom && (
				<input
					type="text"
					value={custom}
					onChange={(e) => {
						setCustom(e.target.value);
						setValue(e.target.value);
					}}
					placeholder="e.g. 1.2.3 or dev-abc1234"
					style={{
						padding: "6px 10px",
						border: "1px solid #d1d5db",
						borderRadius: 6,
						fontSize: 14,
					}}
				/>
			)}

			<p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
				{tags.length <= 1
					? 'No published versions found on GHCR — enter a custom tag or keep "latest".'
					: `${tags.length - 1} published version(s) available. New instances will use this tag.`}
			</p>
		</div>
	);
}
