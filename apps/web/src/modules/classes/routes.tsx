import { Navigate, Route } from "react-router";
import EnrollmentManagement from "@/modules/enrollments/EnrollmentManagement";
import ClassCourseManagement from "./ClassCourseManagement";
import ClassCoursesTab from "./ClassCoursesTab";
import ClassDetail from "./ClassDetail";
import ClassDetailsTab from "./ClassDetailsTab";
import ClassesHub from "./ClassesHub";
import ClassManagement from "./ClassManagement";
import ClassStudentsTab from "./ClassStudentsTab";

export const classesRoutes = (
	<Route path="classes">
		<Route element={<ClassesHub />}>
			<Route index element={<Navigate to="classes" replace />} />
			<Route path="classes" element={<ClassManagement />} />
			<Route path="assignments" element={<ClassCourseManagement />} />
			<Route path="enrollments" element={<EnrollmentManagement />} />
		</Route>
		<Route path=":classId" element={<ClassDetail />}>
			<Route index element={<Navigate to="details" replace />} />
			<Route path="details" element={<ClassDetailsTab />} />
			<Route path="students" element={<ClassStudentsTab />} />
			<Route path="courses" element={<ClassCoursesTab />} />
		</Route>
	</Route>
);
