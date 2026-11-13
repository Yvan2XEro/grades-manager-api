import { Navigate, Route } from "react-router";
import EnrollmentManagement from "@/modules/enrollments/EnrollmentManagement";
import ClassCoursesPage from "./pages/class-courses-page";
import ClassDetailCourses from "./pages/class-detail/class-detail-courses";
import ClassDetailDetails from "./pages/class-detail/class-detail-details";
import ClassDetailLayout from "./pages/class-detail/class-detail-layout";
import ClassDetailStudents from "./pages/class-detail/class-detail-students";
import ClassesLayout from "./pages/classes-layout";
import ClassesPage from "./pages/classes-page";

export const classesRoutes = (
	<Route path="classes">
		<Route element={<ClassesLayout />}>
			<Route index element={<Navigate to="classes" replace />} />
			<Route path="classes" element={<ClassesPage />} />
			<Route path="assignments" element={<ClassCoursesPage />} />
			<Route path="enrollments" element={<EnrollmentManagement />} />
		</Route>
		<Route path=":classId" element={<ClassDetailLayout />}>
			<Route index element={<Navigate to="details" replace />} />
			<Route path="details" element={<ClassDetailDetails />} />
			<Route path="students" element={<ClassDetailStudents />} />
			<Route path="courses" element={<ClassDetailCourses />} />
		</Route>
	</Route>
);
