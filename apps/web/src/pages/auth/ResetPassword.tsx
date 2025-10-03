import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "../../lib/auth-client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

const buildSchema = (t: TFunction) =>
  z
    .object({
      password: z
        .string()
        .min(6, t("auth.validation.passwordMin", { count: 6 })),
      confirmPassword: z
        .string()
        .min(6, t("auth.validation.confirmPassword")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("auth.validation.passwordsMismatch"),
      path: ["confirmPassword"],
    });

type FormData = z.infer<ReturnType<typeof buildSchema>>;

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";
  const { t } = useTranslation();
  const schema = React.useMemo(() => buildSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await authClient.resetPassword({
        token,
        newPassword: data.password,
      });
      toast.success(t("auth.reset.success"));
      navigate("/auth/login");
    } catch (error: any) {
      toast.error(error.message || t("auth.reset.error"));
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-center mb-6">
        {t("auth.reset.title")}
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t("auth.reset.newPassword")}
          </label>
          <input
            id="password"
            type="password"
            {...register("password")}
            className="input input-bordered w-full"
            placeholder={t("auth.reset.passwordPlaceholder")}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-error-600">
              {errors.password.message}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t("common.fields.confirmPassword")}
          </label>
          <input
            id="confirmPassword"
            type="password"
            {...register("confirmPassword")}
            className="input input-bordered w-full"
            placeholder={t("auth.reset.confirmPasswordPlaceholder")}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-error-600">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary w-full mt-6"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t("auth.reset.submitting")}
            </>
          ) : (
            t("auth.reset.submit")
          )}
        </button>
        <div className="mt-1 text-right">
          <Link
            to="/auth/login"
            className="text-sm text-primary-600 hover:text-primary-500"
          >
            {t("auth.reset.backToLogin")}
          </Link>
        </div>
      </form>
    </div>
  );
};

export default ResetPassword;
