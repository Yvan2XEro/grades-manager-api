interface PromotionConfirmDescriptionProps {
	studentCount: number;
	sourceClassName?: string;
	targetClassName?: string;
	useBatch: boolean;
	batchThreshold: number;
}

/** Body of the confirmation shown before a promotion is applied. */
export function PromotionConfirmDescription({
	studentCount,
	sourceClassName,
	targetClassName,
	useBatch,
	batchThreshold,
}: PromotionConfirmDescriptionProps) {
	return (
		<>
			{" "}
			You are about to promote <strong>{studentCount}</strong> student(s) from{" "}
			<strong>{sourceClassName}</strong> to <strong>{targetClassName}</strong>.
			<br />
			<br />
			This action will:
			<ul className="mt-2 list-inside list-disc space-y-1">
				<li>Close current enrollments as "completed"</li>
				<li>Create new enrollments in the target class</li>
				<li>Update student class references</li>
				<li>Record this action in the execution history</li>
			</ul>
			<br />
			{useBatch && (
				<>
					<br />
					This will run as a <strong>background batch job</strong> since there
					are more than {batchThreshold} students.
				</>
			)}
			<br />
			This operation cannot be easily undone. Are you sure?
		</>
	);
}
