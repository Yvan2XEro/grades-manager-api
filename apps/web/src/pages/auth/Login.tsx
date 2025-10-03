import React from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "../../lib/auth-client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

const buildLoginSchema = (t: TFunction) =>
  z.object({
    email: z
      .string()
      .email(t("auth.validation.email")),
    password: z
      .string()
      .min(6, t("auth.validation.passwordMin", { count: 6 })),
  });

type LoginFormData = z.infer<ReturnType<typeof buildLoginSchema>>;

const Login: React.FC = () => {
  const { t } = useTranslation();
  const loginSchema = React.useMemo(() => buildLoginSchema(t), [t]);

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

      toast.success(t("auth.login.success"));
      // Navigation happens automatically through auth state change listener
    } catch (error: any) {
      toast.error(error.message || t("auth.login.error"));
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-center mb-6">
        {t("auth.login.title")}
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t("common.fields.email")}
          </label>
          <input
            id="email"
            type="email"
            {...register("email")}
            className="input input-bordered w-full"
            placeholder={t("auth.login.emailPlaceholder")}
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
            {t("common.fields.password")}
          </label>
          <input
            id="password"
            type="password"
            {...register("password")}
            className="input input-bordered w-full"
            placeholder={t("auth.login.passwordPlaceholder")}
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
              {t("auth.login.forgotPassword")}
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
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t("auth.login.submitting")}
            </>
          ) : (
            t("auth.login.submit")
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          {t("auth.login.noAccount")}{" "}
          <Link
            to="/auth/register"
            className="text-primary-600 hover:text-primary-500 font-medium"
          >
            {t("auth.login.registerLink")}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
