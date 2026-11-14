import { Route } from "react-router";
import ForgotPassword from "./pages/forgot-password-page";
import Login from "./pages/login-page";
import Register from "./pages/register-page";
import ResetPassword from "./pages/reset-password-page";

/** Rendered inside AuthLayout. */
export const authRoutes = (
	<>
		<Route path="/auth/login" element={<Login />} />
		<Route path="/auth/register" element={<Register />} />
		<Route path="/auth/forgot" element={<ForgotPassword />} />
		<Route path="/auth/reset" element={<ResetPassword />} />
	</>
);
