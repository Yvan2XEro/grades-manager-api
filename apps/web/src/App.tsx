import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import { useStore } from "./store";
import AuthLayout from "./components/layouts/AuthLayout";
import DashboardLayout from "./components/layouts/DashboardLayout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AdminDashboard from "./pages/admin/Dashboard";
import FacultyManagement from "./pages/admin/FacultyManagement";
import ProgramManagement from "./pages/admin/ProgramManagement";
import CourseManagement from "./pages/admin/CourseManagement";
import AcademicYearManagement from "./pages/admin/AcademicYearManagement";
import ClassManagement from "./pages/admin/ClassManagement";
import ClassCourseManagement from "./pages/admin/ClassCourseManagement";
import StudentManagement from "./pages/admin/StudentManagement";
import StudentPromotion from "./pages/admin/StudentPromotion";
import ExamManagement from "./pages/admin/ExamManagement";
import GradeExport from "./pages/admin/GradeExport";
import TeacherDashboard from "./pages/teacher/Dashboard";
import CourseList from "./pages/teacher/CourseList";
import GradeEntry from "./pages/teacher/GradeEntry";
import LoadingScreen from "./components/ui/LoadingScreen";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "./utils/trpc";

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const { user, setUser, clearUser } = useStore();
  const healthCheck = useQuery(trpc.healthCheck.queryOptions());

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          try {
            const { data: profile, error } = await supabase
              .from("profiles")
              .select("first_name, last_name, email, role")
              .eq("id", session.user.id)
              .single();

            if (error) throw error;

            if (profile) {
              setUser({
                id: session.user.id,
                email: profile.email,
                role: profile.role,
                firstName: profile.first_name,
                lastName: profile.last_name,
              });
            }
          } catch (error) {
            console.error("Error fetching profile:", error);
            clearUser();
          }
        } else if (event === "SIGNED_OUT") {
          clearUser();
        }
        setIsLoading(false);
      },
    );

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase
          .from("profiles")
          .select("first_name, last_name, email, role")
          .eq("id", session.user.id)
          .single()
          .then(({ data: profile, error }) => {
            if (!error && profile) {
              setUser({
                id: session.user.id,
                email: profile.email,
                role: profile.role,
                firstName: profile.first_name,
                lastName: profile.last_name,
              });
            }
          })
          .finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [setUser, clearUser]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Admin Routes */}
      {user && user.role === "admin" && (
        <Route path="/admin" element={<DashboardLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="faculties" element={<FacultyManagement />} />
          <Route path="programs" element={<ProgramManagement />} />
          <Route path="courses" element={<CourseManagement />} />
          <Route path="academic-years" element={<AcademicYearManagement />} />
          <Route path="classes" element={<ClassManagement />} />
          <Route path="class-courses" element={<ClassCourseManagement />} />
          <Route path="students" element={<StudentManagement />} />
          <Route path="student-promotion" element={<StudentPromotion />} />
          <Route path="exams" element={<ExamManagement />} />
          <Route path="grade-export" element={<GradeExport />} />
        </Route>
      )}

      {/* Teacher Routes */}
      {user && user.role === "teacher" && (
        <Route path="/teacher" element={<DashboardLayout />}>
          <Route index element={<TeacherDashboard />} />
          <Route path="courses" element={<CourseList />} />
          <Route path="grades/:courseId" element={<GradeEntry />} />
        </Route>
      )}

      {/* Redirect based on authentication and role */}
      <Route
        path="*"
        element={
          user ? (
            user.role === "admin" ? (
              <Navigate to="/admin" replace />
            ) : (
              <Navigate to="/teacher" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

export default App;
