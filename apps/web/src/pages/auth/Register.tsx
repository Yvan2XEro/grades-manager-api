import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "../../lib/auth-client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

const buildRegisterSchema = (t: TFunction) =>
  z
    .object({
      firstName: z
        .string()
        .min(2, t("auth.validation.firstName")),
      lastName: z
        .string()
        .min(2, t("auth.validation.lastName")),
      email: z
        .string()
        .email(t("auth.validation.email")),
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

type RegisterFormData = z.infer<ReturnType<typeof buildRegisterSchema>>;

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const registerSchema = React.useMemo(() => buildRegisterSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: `${data.firstName} ${data.lastName}`,
      });

      await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });

      toast.success(t("auth.register.success"));
      navigate("/teacher");
    } catch (error: any) {
      toast.error(error.message || t("auth.register.error"));
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-center mb-6">
        {t("auth.register.title")}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("common.fields.firstName")}
            </label>
            <input
              id="firstName"
              type="text"
              {...register("firstName")}
              className="input input-bordered w-full"
              placeholder={t("auth.register.placeholders.firstName")}
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-error-600">
                {errors.firstName.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("common.fields.lastName")}
            </label>
            <input
              id="lastName"
              type="text"
              {...register("lastName")}
              className="input input-bordered w-full"
              placeholder={t("auth.register.placeholders.lastName")}
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-error-600">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

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
            placeholder={t("auth.register.placeholders.email")}
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
            placeholder={t("auth.register.placeholders.password")}
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
            placeholder={t("auth.register.placeholders.confirmPassword")}
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
              {t("auth.register.submitting")}
            </>
          ) : (
            t("auth.register.submit")
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          {t("auth.register.haveAccount")}{" "}
          <Link
            to="/auth/login"
            className="text-primary-600 hover:text-primary-500 font-medium"
          >
            {t("auth.register.loginLink")}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
