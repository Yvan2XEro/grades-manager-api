import { Route } from "react-router";
import ForgotPassword from "./ForgotPassword";
import Login from "./Login";
import Register from "./Register";
import ResetPassword from "./ResetPassword";

/** Rendered inside AuthLayout. */
export const authRoutes = (
	<>
		<Route path="/auth/login" element={<Login />} />
		<Route path="/auth/register" element={<Register />} />
		<Route path="/auth/forgot" element={<ForgotPassword />} />
		<Route path="/auth/reset" element={<ResetPassword />} />
	</>
);
