import React from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "../../lib/auth-client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Translation } from "react-i18next";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });

      toast.success("Successfully signed in");
      // Navigation happens automatically through auth state change listener
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    }
  };

  return (
    <Translation>
      {(t) => (
        <div>
          <h2 className="text-xl font-semibold text-center mb-6">Sign In</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register("email")}
                className="input input-bordered w-full"
                placeholder="your@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-error-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("password")}
              </label>
              <input
                id="password"
                type="password"
                {...register("password")}
                className="input input-bordered w-full"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-error-600">
                  {errors.password.message}
                </p>
              )}
              <div className="mt-1 text-right">
                <Link
                  to="/auth/forgot"
                  className="text-sm text-primary-600 hover:text-primary-500"
                >
                  {t("forgot_password")}
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary w-full mt-6"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />{" "}
                  {t("signing_in")}...
                </>
              ) : (
                t("sign_in")
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {t("dont_have_account")}{" "}
              <Link
                to="/auth/register"
                className="text-primary-600 hover:text-primary-500 font-medium"
              >
                {t("sign_up")}
              </Link>
            </p>
          </div>
        </div>
      )}
    </Translation>
  );
};

export default Login;
