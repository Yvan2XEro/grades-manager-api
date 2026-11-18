import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { AttendanceClassCourse } from "../types";

interface AttendanceClassCourseSelectProps {
	classCourses: AttendanceClassCourse[];
	value: string | null;
	onChange: (id: string | null) => void;
	placeholder: string;
	triggerClassName?: string;
	/** Classes of the muted class name shown after the course. */
	classNameClassName?: string;
}

/** Class course picker labelled "course — class". */
export function AttendanceClassCourseSelect({
	classCourses,
	value,
	onChange,
	placeholder,
	triggerClassName,
	classNameClassName,
}: AttendanceClassCourseSelectProps) {
	return (
		<Select value={value ?? ""} onValueChange={(v) => onChange(v || null)}>
			<SelectTrigger className={triggerClassName}>
				<SelectValue placeholder={placeholder} />
			</SelectTrigger>
			<SelectContent>
				{classCourses.map((cc) => (
					<SelectItem key={cc.id} value={cc.id}>
						{cc.courseRef?.name ?? cc.code}
						{cc.classRef && (
							<span
								className={cn("ml-1 text-muted-foreground", classNameClassName)}
							>
								— {cc.classRef.name}
							</span>
						)}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
