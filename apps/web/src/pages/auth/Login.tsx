import { zodResolver } from "@hookform/resolvers/zod";
import type { TFunction } from "i18next";
import { Loader2 } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { authClient } from "../../lib/auth-client";
import { useQueryState } from "nuqs";

const buildLoginSchema = (t: TFunction) =>
  z.object({
    email: z.string().email(t("auth.validation.email")),
    password: z.string().min(6, t("auth.validation.passwordMin", { count: 6 })),
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
  const [callbackURL] = useQueryState("return", {});
  const onSubmit = async (data: LoginFormData) => {
    try {
      await authClient.signIn.email({
        email: data.email,
        password: data.password,

        callbackURL: callbackURL || undefined,
      });

      toast.success(t("auth.login.success"));
      // Navigation happens automatically through auth state change listener
    } catch (error: any) {
      toast.error(error.message || t("auth.login.error"));
    }
  };

  return (
    <div>
      <h2 className="mb-6 text-center font-semibold text-xl">
        {t("auth.login.title")}
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="email" className="mb-1 block">
            {t("common.fields.email")}
          </Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            className="w-full"
            placeholder={t("auth.login.emailPlaceholder")}
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
            placeholder={t("auth.login.passwordPlaceholder")}
          />
          {errors.password && (
            <p className="mt-1 text-error-600 text-sm">
              {errors.password.message}
            </p>
          )}
          <div className="mt-1 text-right">
            <Link
              to={`/auth/forgot?return=${callbackURL}`}
              className="text-primary-600 text-sm hover:text-primary-500"
            >
              {t("auth.login.forgotPassword")}
            </Link>
          </div>
        </div>

        <Button type="submit" disabled={isSubmitting} className="mt-6 w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("auth.login.submitting")}
            </>
          ) : (
            t("auth.login.submit")
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600 text-sm">
          {t("auth.login.noAccount")}{" "}
          <Link
            to={`/auth/register?return=${callbackURL}`}
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            {t("auth.login.registerLink")}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
