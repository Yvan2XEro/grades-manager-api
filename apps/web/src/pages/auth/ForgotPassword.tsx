import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "../../lib/auth-client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

const buildSchema = (t: TFunction) =>
  z.object({
    email: z.string().email(t("auth.validation.email")),
  });

type FormData = z.infer<ReturnType<typeof buildSchema>>;

const ForgotPassword: React.FC = () => {
  const { t } = useTranslation();
  const schema = React.useMemo(() => buildSchema(t), [t]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await authClient.requestPasswordReset({
        email: data.email,
        redirectTo: `${window.location.origin}/auth/reset`,
      });
      toast.success(t("auth.forgot.success"));
    } catch (error: any) {
      toast.error(error.message || t("auth.forgot.error"));
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-center mb-6">
        {t("auth.forgot.title")}
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
            placeholder={t("auth.forgot.emailPlaceholder")}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-error-600">
              {errors.email.message}
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
              {t("auth.forgot.submitting")}
            </>
          ) : (
            t("auth.forgot.submit")
          )}
        </button>
        <div className="mt-1 text-right">
          <Link
            to="/auth/login"
            className="text-sm text-primary-600 hover:text-primary-500"
          >
            {t("auth.forgot.backToLogin")}
          </Link>
        </div>
      </form>
    </div>
  );
};

export default ForgotPassword;
