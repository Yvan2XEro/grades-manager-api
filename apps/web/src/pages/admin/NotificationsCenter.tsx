import { Bell, CheckCircle2, Inbox } from "lucide-react";
import { useTranslation } from "react-i18next";

const NotificationsCenter = () => {
        const { t } = useTranslation();

        const notifications = [
                {
                        title: t("admin.notifications.gradeValidated"),
                        description: t("admin.notifications.gradeValidatedDesc"),
                        tone: "success" as const,
                },
                {
                        title: t("admin.notifications.windowOpened"),
                        description: t("admin.notifications.windowOpenedDesc"),
                        tone: "info" as const,
                },
        ];

        return (
                <div className="space-y-6">
                        <div className="flex items-center space-x-3">
                                <Bell className="h-6 w-6 text-primary-700" />
                                <div>
                                        <h1 className="font-semibold text-2xl text-gray-900">
                                                {t("admin.notifications.title")}
                                        </h1>
                                        <p className="text-gray-600">{t("admin.notifications.subtitle")}</p>
                                </div>
                        </div>

                        <div className="rounded-xl border bg-white p-6 shadow-sm">
                                {notifications.map((item) => (
                                        <div
                                                key={item.title}
                                                className="flex items-start justify-between border-b border-gray-100 py-4 last:border-0"
                                        >
                                                <div className="flex items-start space-x-3">
                                                        <div
                                                                className={`rounded-full p-2 ${
                                                                        item.tone === "success"
                                                                                ? "bg-emerald-100 text-emerald-700"
                                                                                : "bg-blue-100 text-blue-700"
                                                                }`}
                                                        >
                                                                {item.tone === "success" ? (
                                                                        <CheckCircle2 className="h-5 w-5" />
                                                                ) : (
                                                                        <Inbox className="h-5 w-5" />
                                                                )}
                                                        </div>
                                                        <div>
                                                                <p className="font-medium text-gray-900">{item.title}</p>
                                                                <p className="text-gray-600 text-sm">{item.description}</p>
                                                        </div>
                                                </div>
                                                <span className="text-gray-400 text-xs">{t("admin.notifications.justNow")}</span>
                                        </div>
                                ))}
                        </div>
                </div>
        );
};

export default NotificationsCenter;
