import { zodResolver } from "@hookform/resolvers/zod";
import type { TFunction } from "i18next";
import { Loader2 } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { authClient } from "../../lib/auth-client";
import { useQueryState } from "nuqs";

const buildRegisterSchema = (t: TFunction) =>
  z
    .object({
      firstName: z.string().min(2, t("auth.validation.firstName")),
      lastName: z.string().min(2, t("auth.validation.lastName")),
      email: z.string().email(t("auth.validation.email")),
      password: z
        .string()
        .min(6, t("auth.validation.passwordMin", { count: 6 })),
      confirmPassword: z.string().min(6, t("auth.validation.confirmPassword")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("auth.validation.passwordsMismatch"),
      path: ["confirmPassword"],
    });

type RegisterFormData = z.infer<ReturnType<typeof buildRegisterSchema>>;

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [callbackURL] = useQueryState("return", {});
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
        callbackURL: callbackURL || undefined,
      });

      toast.success(t("auth.register.success"));
      navigate("/teacher");
    } catch (error: any) {
      toast.error(error.message || t("auth.register.error"));
    }
  };

  return (
    <div>
      <h2 className="mb-6 text-center font-semibold text-xl">
        {t("auth.register.title")}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName" className="mb-1 block">
              {t("common.fields.firstName")}
            </Label>
            <Input
              id="firstName"
              type="text"
              {...register("firstName")}
              className="w-full"
              placeholder={t("auth.register.placeholders.firstName")}
            />
            {errors.firstName && (
              <p className="mt-1 text-error-600 text-sm">
                {errors.firstName.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="lastName" className="mb-1 block">
              {t("common.fields.lastName")}
            </Label>
            <Input
              id="lastName"
              type="text"
              {...register("lastName")}
              className="w-full"
              placeholder={t("auth.register.placeholders.lastName")}
            />
            {errors.lastName && (
              <p className="mt-1 text-error-600 text-sm">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="email" className="mb-1 block">
            {t("common.fields.email")}
          </Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            className="w-full"
            placeholder={t("auth.register.placeholders.email")}
          />
          {errors.email && (
            <p className="mt-1 text-error-600 text-sm">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="password" className="mb-1 block">
            {t("common.fields.password")}
          </Label>
          <Input
            id="password"
            type="password"
            {...register("password")}
            className="w-full"
            placeholder={t("auth.register.placeholders.password")}
          />
          {errors.password && (
            <p className="mt-1 text-error-600 text-sm">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="confirmPassword" className="mb-1 block">
            {t("common.fields.confirmPassword")}
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            {...register("confirmPassword")}
            className="w-full"
            placeholder={t("auth.register.placeholders.confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-error-600 text-sm">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button type="submit" disabled={isSubmitting} className="mt-6 w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("auth.register.submitting")}
            </>
          ) : (
            t("auth.register.submit")
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600 text-sm">
          {t("auth.register.haveAccount")}{" "}
          <Link
            to={`/auth/login?return=${callbackURL}`}
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            {t("auth.register.loginLink")}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
