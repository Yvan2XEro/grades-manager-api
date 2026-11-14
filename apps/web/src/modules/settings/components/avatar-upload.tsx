import { Camera, Loader2 } from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authClient } from "@/lib/auth-client";
import { useAvatarUpload } from "../hooks/use-avatar-upload";
import { useMyProfile } from "../hooks/use-my-profile";

/** Clickable avatar: picks an image, crops it, uploads it. */
export function AvatarUpload() {
	const { t } = useTranslation();
	const { data: session } = authClient.useSession();
	const { initials } = useMyProfile();
	const { uploading, cropAndUpload } = useAvatarUpload();
	const inputRef = useRef<HTMLInputElement>(null);

	return (
		<div className="flex items-center gap-4">
			<button
				type="button"
				className="group relative cursor-pointer"
				onClick={() => inputRef.current?.click()}
				disabled={uploading}
				title={t("settings.account.avatar.change")}
			>
				<Avatar className="h-16 w-16">
					{session?.user?.image && (
						<AvatarImage
							src={session.user.image}
							alt={session.user.name ?? ""}
						/>
					)}
					<AvatarFallback className="bg-primary/10 font-semibold text-lg text-primary">
						{initials}
					</AvatarFallback>
				</Avatar>
				<div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
					{uploading ? (
						<Loader2 className="h-5 w-5 animate-spin text-white" />
					) : (
						<Camera className="h-5 w-5 text-white" />
					)}
				</div>
			</button>
			<input
				ref={inputRef}
				type="file"
				accept="image/*"
				className="hidden"
				onChange={(e) => {
					const file = e.target.files?.[0];
					if (!file) return;
					void cropAndUpload(file);
					e.target.value = "";
				}}
			/>
			<div>
				<p className="font-medium text-sm">
					{t("settings.account.avatar.change")}
				</p>
				<p className="text-muted-foreground text-xs">
					{uploading ? t("settings.account.avatar.uploading") : "JPG, PNG, GIF"}
				</p>
			</div>
		</div>
	);
}
