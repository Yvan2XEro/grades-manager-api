import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProfileContext } from "./ProfileContext";

function InfoRow({ label, value }: { label: string; value?: string | null }) {
	if (!value) return null;
	return (
		<div className="flex flex-col gap-1 py-2">
			<span className="text-muted-foreground text-xs">{label}</span>
			<span className="text-sm">{value}</span>
		</div>
	);
}

export default function ProfileIdentityTab() {
	const { profile } = useProfileContext();
	const { t } = useTranslation();

	const formatDate = (value?: string | null) => {
		if (!value) return null;
		try {
			return new Date(value).toLocaleDateString();
		} catch {
			return value;
		}
	};

	return (
		<div className="grid gap-6 pt-6 md:grid-cols-2">
			<Card>
				<CardHeader>
					<CardTitle className="text-base">
						{t("profileHub.identity.personalInfo")}
					</CardTitle>
				</CardHeader>
				<CardContent className="divide-y">
					<InfoRow
						label={t("profileHub.identity.firstName")}
						value={profile.firstName}
					/>
					<InfoRow
						label={t("profileHub.identity.lastName")}
						value={profile.lastName}
					/>
					<InfoRow
						label={t("profileHub.identity.email")}
						value={profile.primaryEmail}
					/>
					<InfoRow
						label={t("profileHub.identity.phone")}
						value={profile.phone}
					/>
					<InfoRow
						label={t("profileHub.identity.gender")}
						value={profile.gender}
					/>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle className="text-base">
						{t("profileHub.identity.birthInfo")}
					</CardTitle>
				</CardHeader>
				<CardContent className="divide-y">
					<InfoRow
						label={t("profileHub.identity.dateOfBirth")}
						value={formatDate(profile.dateOfBirth)}
					/>
					<InfoRow
						label={t("profileHub.identity.placeOfBirth")}
						value={profile.placeOfBirth}
					/>
					<InfoRow
						label={t("profileHub.identity.nationality")}
						value={profile.nationality}
					/>
				</CardContent>
			</Card>
			{profile.student && (
				<Card>
					<CardHeader>
						<CardTitle className="text-base">
							{t("profileHub.identity.studentInfo")}
						</CardTitle>
					</CardHeader>
					<CardContent className="divide-y">
						<InfoRow
							label={t("profileHub.identity.registrationNumber")}
							value={profile.student.registrationNumber}
						/>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
