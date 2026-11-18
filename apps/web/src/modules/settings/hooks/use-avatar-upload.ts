import { useState } from "react";
import { useTranslation } from "react-i18next";
import { authClient } from "@/lib/auth-client";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
import { AvatarCropModal } from "../components/avatar-crop-modal";
import { blobToBase64 } from "../services/avatar-crop";

/** Crops a picked image, uploads it and sets it as the account avatar. */
export function useAvatarUpload() {
	const { t } = useTranslation();
	const { refetch: refetchSession } = authClient.useSession();
	const [uploading, setUploading] = useState(false);

	const uploadCroppedBlob = async (blob: Blob) => {
		setUploading(true);
		try {
			const base64 = await blobToBase64(blob);
			const stored = await trpcClient.files.uploadAvatar.mutate({
				filename: "avatar.jpg",
				mimeType: "image/jpeg",
				base64,
			});
			await authClient.updateUser({ image: stored.url });
			await refetchSession();
			toast.success(t("settings.account.avatar.success"));
		} catch {
			toast.error(t("settings.account.avatar.error"));
		} finally {
			setUploading(false);
		}
	};

	const cropAndUpload = async (file: File) => {
		const src = URL.createObjectURL(file);
		try {
			const blob = await AvatarCropModal.call({ src });
			if (blob) await uploadCroppedBlob(blob);
		} finally {
			URL.revokeObjectURL(src);
		}
	};

	return { uploading, cropAndUpload };
}
