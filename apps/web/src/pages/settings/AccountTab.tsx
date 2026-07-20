import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
	Camera,
	CropIcon,
	Loader2,
	Lock,
	Mail,
	Monitor,
	ShieldCheck,
	UserCircle,
	ZoomIn,
	ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import ReactCrop, {
	type Crop,
	centerCrop,
	makeAspectCrop,
	type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { z } from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/lib/toast";
import { authClient } from "../../lib/auth-client";
import { useStore } from "../../store";
import { trpcClient } from "../../utils/trpc";

/* ─── Types ─────────────────────────────────── */

type SessionInfo = {
	token?: string | null;
	createdAt?: string | Date | null;
	userAgent?: string | null;
	ipAddress?: string | null;
	current?: boolean;
	[key: string]: unknown;
};

type SessionResponse =
	| SessionInfo[]
	| {
			sessions?: SessionInfo[];
			currentSessionToken?: string | null;
	  };

/* ─── Crop helpers ───────────────────────────── */

function centerAspectCrop(w: number, h: number) {
	return centerCrop(makeAspectCrop({ unit: "%", width: 80 }, 1, w, h), w, h);
}

async function cropToBlob(
	image: HTMLImageElement,
	crop: PixelCrop,
	size = 256,
): Promise<Blob> {
	const canvas = document.createElement("canvas");
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("No 2d context");
	const scaleX = image.naturalWidth / image.width;
	const scaleY = image.naturalHeight / image.height;
	ctx.drawImage(
		image,
		crop.x * scaleX,
		crop.y * scaleY,
		crop.width * scaleX,
		crop.height * scaleY,
		0,
		0,
		size,
		size,
	);
	return new Promise((resolve, reject) =>
		canvas.toBlob(
			(b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
			"image/jpeg",
			0.9,
		),
	);
}

function getBrowserLabel(userAgent?: string | null) {
	if (!userAgent) return "Unknown";
	const normalized = userAgent.toLowerCase();
	if (normalized.includes("edg")) return "Edge";
	if (normalized.includes("chrome")) return "Chrome";
	if (normalized.includes("firefox")) return "Firefox";
	if (normalized.includes("safari")) return "Safari";
	if (normalized.includes("opera") || normalized.includes("opr"))
		return "Opera";
	return "Browser";
}

const resolveToken = (session: Record<string, unknown> | null | undefined) =>
	(session?.token as string | undefined) ??
	(session?.sessionToken as string | undefined) ??
	(session?.id as string | undefined);

const resolveSessionToken = (session: SessionInfo) =>
	resolveToken(session as Record<string, unknown>);

/* ─── Crop modal ─────────────────────────────── */

type CropModalProps = {
	src: string;
	open: boolean;
	onClose: () => void;
	onConfirm: (blob: Blob) => void;
};

function AvatarCropModal({ src, open, onClose, onConfirm }: CropModalProps) {
	const imgRef = useRef<HTMLImageElement>(null);
	const [crop, setCrop] = useState<Crop>();
	const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
	const [scale, setScale] = useState(1);

	const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
		const { width, height } = e.currentTarget;
		setCrop(centerAspectCrop(width, height));
	};

	const handleConfirm = async () => {
		if (!imgRef.current || !completedCrop) return;
		try {
			const blob = await cropToBlob(imgRef.current, completedCrop);
			onConfirm(blob);
		} catch {
			toast.error("Erreur lors du recadrage");
		}
	};

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="max-w-xl gap-0 p-0">
				<DialogHeader className="px-6 pt-5 pb-4">
					<DialogTitle className="flex items-center gap-2 text-base">
						<CropIcon className="h-4 w-4 text-primary" />
						Recadrer la photo de profil
					</DialogTitle>
				</DialogHeader>
				<div className="flex items-center justify-center bg-muted/40 px-6 py-4">
					<ReactCrop
						crop={crop}
						onChange={(c) => setCrop(c)}
						onComplete={(c) => setCompletedCrop(c)}
						aspect={1}
						circularCrop
						className="max-h-[480px] max-w-full overflow-hidden rounded-lg"
					>
						<img
							ref={imgRef}
							src={src}
							alt="Aperçu"
							style={{
								transform: `scale(${scale})`,
								transformOrigin: "center",
							}}
							onLoad={onImageLoad}
							className="max-h-[480px] max-w-full object-contain"
						/>
					</ReactCrop>
				</div>
				<div className="flex items-center gap-3 border-t px-6 py-3">
					<ZoomOut className="h-4 w-4 shrink-0 text-muted-foreground" />
					<input
						type="range"
						min={1}
						max={2}
						step={0.05}
						value={scale}
						onChange={(e) => setScale(Number(e.target.value))}
						className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary"
					/>
					<ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" />
				</div>
				<DialogFooter className="px-6 pt-2 pb-5">
					<Button variant="outline" onClick={onClose}>
						Annuler
					</Button>
					<Button onClick={handleConfirm} disabled={!completedCrop}>
						Appliquer
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

/* ─── Schemas ────────────────────────────────── */

const buildAccountSchema = (
	t: (key: string, opts?: Record<string, unknown>) => string,
) =>
	z.object({
		name: z.string().min(1, t("settings.account.validation.name")),
	});

type AccountFormValues = z.infer<ReturnType<typeof buildAccountSchema>>;

const buildPasswordSchema = (
	t: (key: string, opts?: Record<string, unknown>) => string,
) =>
	z
		.object({
			currentPassword: z
				.string()
				.min(1, t("settings.password.validation.current")),
			newPassword: z.string().min(8, t("settings.password.validation.new")),
			confirmPassword: z
				.string()
				.min(1, t("settings.password.validation.confirm")),
			revokeOtherSessions: z.boolean().optional(),
		})
		.refine((value) => value.newPassword === value.confirmPassword, {
			message: t("settings.password.validation.match"),
			path: ["confirmPassword"],
		});

type PasswordFormValues = z.infer<ReturnType<typeof buildPasswordSchema>>;

/* ─── Main component ─────────────────────────── */

export default function AccountTab() {
	const { t } = useTranslation();
	const { user, setUser } = useStore();
	const { data: session, refetch: refetchSession } = authClient.useSession();
	const [sessions, setSessions] = useState<SessionInfo[]>([]);

	const accountSchema = useMemo(() => buildAccountSchema(t), [t]);
	const passwordSchema = useMemo(() => buildPasswordSchema(t), [t]);

	const avatarInputRef = useRef<HTMLInputElement>(null);
	const [avatarUploading, setAvatarUploading] = useState(false);
	const [cropSrc, setCropSrc] = useState<string | null>(null);
	const [cropModalOpen, setCropModalOpen] = useState(false);
	const [newEmail, setNewEmail] = useState("");
	const [emailChanging, setEmailChanging] = useState(false);

	const accountForm = useForm<AccountFormValues>({
		resolver: zodResolver(accountSchema),
		defaultValues: { name: "" },
	});

	const passwordForm = useForm<PasswordFormValues>({
		resolver: zodResolver(passwordSchema),
		defaultValues: {
			currentPassword: "",
			newPassword: "",
			confirmPassword: "",
			revokeOtherSessions: false,
		},
	});

	const profileQuery = useQuery({
		queryKey: ["myProfile"],
		queryFn: () => trpcClient.users.getMyProfile.query(),
	});
	const profile = profileQuery.data;

	useEffect(() => {
		if (!session?.user) return;
		accountForm.reset({ name: session.user.name ?? "" });
	}, [accountForm, session?.user]);

	const updateAccountMutation = useMutation({
		mutationFn: async (values: AccountFormValues) =>
			authClient.updateUser({ name: values.name.trim() }),
		onSuccess: async (updated) => {
			const name = updated?.user?.name ?? accountForm.getValues("name");
			if (user && name) {
				const [firstName, ...rest] = name.split(" ");
				setUser({
					...user,
					firstName: firstName || user.firstName,
					lastName: rest.join(" ") || user.lastName,
				});
			}
			await refetchSession();
			toast.success(t("settings.account.toast.success"));
		},
		onError: () => toast.error(t("settings.account.toast.error")),
	});

	const passwordMutation = useMutation({
		mutationFn: async (values: PasswordFormValues) => {
			const response = await authClient.changePassword({
				currentPassword: values.currentPassword,
				newPassword: values.newPassword,
				revokeOtherSessions: values.revokeOtherSessions ?? false,
			});
			if (
				response &&
				typeof response === "object" &&
				"error" in response &&
				(response as { error?: { message?: string } | null }).error
			) {
				const error = (response as { error?: { message?: string } | null })
					.error;
				throw new Error(error?.message ?? "Password update failed");
			}
			return response;
		},
		onSuccess: () => {
			passwordForm.reset();
			toast.success(t("settings.password.toast.success"));
		},
		onError: (error) => {
			const message =
				error instanceof Error
					? error.message
					: t("settings.password.toast.error");
			toast.error(message);
		},
	});

	const loadSessions = useCallback(async () => {
		try {
			const response = await authClient.listSessions();
			const rawSessions = Array.isArray(response)
				? response
				: ((response as SessionResponse)?.sessions ?? []);
			const currentToken = resolveToken(
				session?.session as Record<string, unknown>,
			);
			const normalized = rawSessions.map((entry) => {
				const token = resolveSessionToken(entry);
				return {
					...entry,
					token: token ?? entry.token ?? null,
					current: currentToken !== undefined && currentToken === token,
				};
			});
			setSessions(normalized);
		} catch (error) {
			console.error("Failed to load sessions", error);
			toast.error(t("settings.sessions.toast.error"));
		}
	}, [session?.session, t]);

	useEffect(() => {
		void loadSessions();
	}, [loadSessions]);

	const revokeSessionMutation = useMutation({
		mutationFn: async (token: string) => authClient.revokeSession({ token }),
		onSuccess: () => {
			toast.success(t("settings.sessions.toast.revoked"));
			void loadSessions();
		},
		onError: () => toast.error(t("settings.sessions.toast.error")),
	});

	const revokeOthersMutation = useMutation({
		mutationFn: async () => authClient.revokeSessions(),
		onSuccess: () => {
			toast.success(t("settings.sessions.toast.revokedAll"));
			void loadSessions();
		},
		onError: () => toast.error(t("settings.sessions.toast.error")),
	});

	const initials =
		`${profile?.firstName?.[0] ?? ""}${profile?.lastName?.[0] ?? ""}`.trim() ||
		"?";

	const uploadCroppedBlob = async (blob: Blob) => {
		setCropModalOpen(false);
		setAvatarUploading(true);
		try {
			const base64 = await new Promise<string>((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = () => resolve((reader.result as string).split(",")[1]);
				reader.onerror = reject;
				reader.readAsDataURL(blob);
			});
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
			setAvatarUploading(false);
			if (cropSrc) {
				URL.revokeObjectURL(cropSrc);
				setCropSrc(null);
			}
		}
	};

	return (
		<div className="space-y-6">
			{cropSrc && (
				<AvatarCropModal
					src={cropSrc}
					open={cropModalOpen}
					onClose={() => {
						setCropModalOpen(false);
						URL.revokeObjectURL(cropSrc);
						setCropSrc(null);
					}}
					onConfirm={uploadCroppedBlob}
				/>
			)}

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<UserCircle className="h-4 w-4 text-primary" />
						{t("settings.account.title")}
					</CardTitle>
					<CardDescription>{t("settings.account.description")}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Avatar upload */}
					<div className="flex items-center gap-4">
						<button
							type="button"
							className="group relative cursor-pointer"
							onClick={() => avatarInputRef.current?.click()}
							disabled={avatarUploading}
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
								{avatarUploading ? (
									<Loader2 className="h-5 w-5 animate-spin text-white" />
								) : (
									<Camera className="h-5 w-5 text-white" />
								)}
							</div>
						</button>
						<input
							ref={avatarInputRef}
							type="file"
							accept="image/*"
							className="hidden"
							onChange={(e) => {
								const file = e.target.files?.[0];
								if (!file) return;
								const url = URL.createObjectURL(file);
								setCropSrc(url);
								setCropModalOpen(true);
								e.target.value = "";
							}}
						/>
						<div>
							<p className="font-medium text-sm">
								{t("settings.account.avatar.change")}
							</p>
							<p className="text-muted-foreground text-xs">
								{avatarUploading
									? t("settings.account.avatar.uploading")
									: "JPG, PNG, GIF"}
							</p>
						</div>
					</div>

					<Separator />

					{/* Account form (name) */}
					<Form {...accountForm}>
						<form
							onSubmit={accountForm.handleSubmit((values) =>
								updateAccountMutation.mutate(values),
							)}
							className="space-y-4"
						>
							<div className="grid gap-4 md:grid-cols-2">
								<FormField
									control={accountForm.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t("settings.account.fields.name")}</FormLabel>
											<FormControl>
												<Input {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</form>
					</Form>

					<Separator />

					{/* Email change */}
					<div className="space-y-3">
						<label className="font-medium text-sm">
							{t("settings.account.fields.email")}
						</label>
						<p className="text-muted-foreground text-xs">
							{session?.user?.email ?? user?.email}
						</p>
						<div className="flex items-end gap-2">
							<div className="max-w-sm flex-1">
								<label
									className="font-medium text-sm"
									htmlFor="new-email-input"
								>
									{t("settings.account.email.newLabel")}
								</label>
								<Input
									id="new-email-input"
									type="email"
									placeholder="new@example.com"
									value={newEmail}
									onChange={(e) => setNewEmail(e.target.value)}
								/>
							</div>
							<Button
								variant="outline"
								disabled={
									!newEmail.trim() ||
									emailChanging ||
									newEmail.trim() === (session?.user?.email ?? user?.email)
								}
								onClick={async () => {
									setEmailChanging(true);
									try {
										await authClient.changeEmail({
											newEmail: newEmail.trim(),
											callbackURL: "/settings",
										});
										toast.success(t("settings.account.email.verificationSent"));
										setNewEmail("");
									} catch {
										toast.error(t("settings.account.email.error"));
									} finally {
										setEmailChanging(false);
									}
								}}
							>
								{emailChanging ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<Mail className="mr-2 h-4 w-4" />
								)}
								{t("settings.account.email.change")}
							</Button>
						</div>
					</div>
				</CardContent>
				<CardFooter className="justify-end">
					<Button
						type="submit"
						onClick={accountForm.handleSubmit((values) =>
							updateAccountMutation.mutate(values),
						)}
						disabled={updateAccountMutation.isPending}
					>
						{t("settings.account.save")}
					</Button>
				</CardFooter>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Lock className="h-4 w-4 text-primary" />
						{t("settings.password.title")}
					</CardTitle>
					<CardDescription>
						{t("settings.password.description")}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...passwordForm}>
						<form
							onSubmit={passwordForm.handleSubmit((values) =>
								passwordMutation.mutate(values),
							)}
							className="space-y-4"
						>
							<FormField
								control={passwordForm.control}
								name="currentPassword"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("settings.password.fields.current")}
										</FormLabel>
										<FormControl>
											<PasswordInput {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<div className="grid gap-4 md:grid-cols-2">
								<FormField
									control={passwordForm.control}
									name="newPassword"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t("settings.password.fields.new")}</FormLabel>
											<FormControl>
												<PasswordInput {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={passwordForm.control}
									name="confirmPassword"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{t("settings.password.fields.confirm")}
											</FormLabel>
											<FormControl>
												<PasswordInput {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<FormField
								control={passwordForm.control}
								name="revokeOtherSessions"
								render={({ field }) => (
									<FormItem className="flex items-center gap-3 space-y-0">
										<FormControl>
											<Checkbox
												checked={field.value}
												onCheckedChange={(value) =>
													field.onChange(Boolean(value))
												}
											/>
										</FormControl>
										<FormLabel className="text-sm">
											{t("settings.password.fields.revokeOthers")}
										</FormLabel>
									</FormItem>
								)}
							/>
						</form>
					</Form>
				</CardContent>
				<CardFooter className="justify-end">
					<Button
						type="submit"
						onClick={passwordForm.handleSubmit((values) =>
							passwordMutation.mutate(values),
						)}
						disabled={passwordMutation.isPending}
					>
						{t("settings.password.save")}
					</Button>
				</CardFooter>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Monitor className="h-4 w-4 text-primary" />
						{t("settings.sessions.title")}
					</CardTitle>
					<CardDescription>
						{t("settings.sessions.description")}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{sessions.length === 0 ? (
						<p className="text-muted-foreground text-xs">
							{t("settings.sessions.empty")}
						</p>
					) : (
						sessions.map((entry) => {
							const createdAt = entry.createdAt
								? new Date(entry.createdAt)
								: null;
							const relative = createdAt
								? formatDistanceToNow(createdAt, { addSuffix: true })
								: t("settings.sessions.unknownTime");
							const browser = getBrowserLabel(entry.userAgent);
							return (
								<div
									key={
										resolveToken(entry as Record<string, unknown>) ?? browser
									}
									className="flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:justify-between"
								>
									<div className="space-y-1">
										<div className="flex items-center gap-2">
											<span className="font-medium">{browser}</span>
											{entry.current && (
												<Badge variant="secondary">
													{t("settings.sessions.current")}
												</Badge>
											)}
										</div>
										<p className="text-muted-foreground text-xs">
											{entry.ipAddress ?? t("settings.sessions.unknownIp")}
											{" · "}
											{relative}
										</p>
									</div>
									{!entry.current && entry.token && (
										<Button
											variant="outline"
											onClick={() =>
												revokeSessionMutation.mutate(entry.token ?? "")
											}
											disabled={revokeSessionMutation.isPending}
											className="w-full md:w-auto"
										>
											{t("settings.sessions.revoke")}
										</Button>
									)}
								</div>
							);
						})
					)}
				</CardContent>
				<CardFooter className="justify-between">
					<div className="flex items-center gap-2 text-muted-foreground text-sm">
						<ShieldCheck className="h-4 w-4" />
						{t("settings.sessions.securityNote")}
					</div>
					<Button
						variant="outline"
						onClick={() => revokeOthersMutation.mutate()}
						disabled={revokeOthersMutation.isPending}
					>
						{t("settings.sessions.revokeAll")}
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
