import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
	BadgeCheck,
	Camera,
	Check,
	ChevronsUpDown,
	CropIcon,
	KeyRound,
	Languages,
	Loader2,
	Lock,
	Mail,
	Monitor,
	Settings as SettingsIcon,
	ShieldCheck,
	UserCircle,
	ZoomIn,
	ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import ReactCrop, {
	centerCrop,
	makeAspectCrop,
	type Crop,
	type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { toast } from "sonner";
import { z } from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "../components/ui/command";
import { DatePicker } from "../components/ui/date-picker";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../components/ui/form";
import { Input } from "../components/ui/input";
import { PasswordInput } from "../components/ui/password-input";
import { PhoneInput } from "../components/ui/phone-input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "../components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../components/ui/select";
import { Separator } from "../components/ui/separator";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "../components/ui/tabs";
import { authClient } from "../lib/auth-client";
import { COUNTRIES } from "../lib/countries";
import { cn } from "../lib/utils";
import { useStore } from "../store";
import type { RouterOutputs } from "../utils/trpc";
import { trpcClient } from "../utils/trpc";

type DomainProfile = RouterOutputs["users"]["getMyProfile"];

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

const buildProfileSchema = (
	t: (key: string, opts?: Record<string, unknown>) => string,
) =>
	z.object({
		firstName: z.string().min(1, t("settings.profile.validation.firstName")),
		lastName: z.string().min(1, t("settings.profile.validation.lastName")),
		phone: z.string().optional(),
		dateOfBirth: z.string().optional(),
		placeOfBirth: z.string().optional(),
		gender: z.enum(["male", "female", "other", ""]).optional(),
		nationality: z.string().optional(),
	});

type ProfileFormValues = z.infer<ReturnType<typeof buildProfileSchema>>;

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

const normalizeDate = (value?: string | null) => {
	if (!value) return "";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	return date.toISOString().split("T")[0];
};

const getBrowserLabel = (userAgent?: string | null) => {
	if (!userAgent) return "Unknown";
	const normalized = userAgent.toLowerCase();
	if (normalized.includes("edg")) return "Edge";
	if (normalized.includes("chrome")) return "Chrome";
	if (normalized.includes("firefox")) return "Firefox";
	if (normalized.includes("safari")) return "Safari";
	if (normalized.includes("opera") || normalized.includes("opr"))
		return "Opera";
	return "Browser";
};

const resolveToken = (session: Record<string, unknown> | null | undefined) =>
	(session?.["token"] as string | undefined) ??
	(session?.["sessionToken"] as string | undefined) ??
	(session?.["id"] as string | undefined);

const resolveSessionToken = (session: SessionInfo) =>
	resolveToken(session as Record<string, unknown>);

/* ─── Crop helper ─────────────────────────────────────── */

function centerAspectCrop(w: number, h: number) {
	return centerCrop(
		makeAspectCrop({ unit: "%", width: 80 }, 1, w, h),
		w,
		h,
	);
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

/* ─── Crop modal ──────────────────────────────────────── */

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

				{/* Crop area */}
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
							style={{ transform: `scale(${scale})`, transformOrigin: "center" }}
							onLoad={onImageLoad}
							className="max-h-[480px] max-w-full object-contain"
						/>
					</ReactCrop>
				</div>

				{/* Zoom slider */}
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

				<DialogFooter className="px-6 pb-5 pt-2">
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

/* ─── Main component ──────────────────────────────────── */

export default function AccountSettings() {
	const queryClient = useQueryClient();
	const { t, i18n } = useTranslation();
	const { user, setUser } = useStore();
	const { data: session, refetch: refetchSession } = authClient.useSession();
	const [sessions, setSessions] = useState<SessionInfo[]>([]);

	const profileSchema = useMemo(() => buildProfileSchema(t), [t]);
	const accountSchema = useMemo(() => buildAccountSchema(t), [t]);
	const passwordSchema = useMemo(() => buildPasswordSchema(t), [t]);

	const profileForm = useForm<ProfileFormValues>({
		resolver: zodResolver(profileSchema),
		defaultValues: {
			firstName: "",
			lastName: "",
			phone: "",
			dateOfBirth: "",
			placeOfBirth: "",
			gender: "",
			nationality: "",
		},
	});

	const accountForm = useForm<AccountFormValues>({
		resolver: zodResolver(accountSchema),
		defaultValues: {
			name: "",
		},
	});

	const avatarInputRef = useRef<HTMLInputElement>(null);
	const [avatarUploading, setAvatarUploading] = useState(false);
	const [cropSrc, setCropSrc] = useState<string | null>(null);
	const [cropModalOpen, setCropModalOpen] = useState(false);
	const [newEmail, setNewEmail] = useState("");
	const [emailChanging, setEmailChanging] = useState(false);

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
	const profile = profileQuery.data as DomainProfile | null | undefined;

	useEffect(() => {
		if (!profile) return;
		profileForm.reset({
			firstName: profile.firstName ?? "",
			lastName: profile.lastName ?? "",
			phone: profile.phone ?? "",
			dateOfBirth: normalizeDate(profile.dateOfBirth),
			placeOfBirth: profile.placeOfBirth ?? "",
			gender: profile.gender || "",
			nationality: profile.nationality ?? "",
		});
	}, [profileForm, profile]);

	useEffect(() => {
		if (!session?.user) return;
		accountForm.reset({
			name: session.user.name ?? "",
		});
	}, [accountForm, session?.user]);

	const updateAccountMutation = useMutation({
		mutationFn: async (values: AccountFormValues) =>
			authClient.updateUser({
				name: values.name.trim(),
			}),
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

	const updateProfileMutation = useMutation({
		mutationFn: async (values: ProfileFormValues) =>
			trpcClient.users.updateMyProfile.mutate({
				firstName: values.firstName.trim(),
				lastName: values.lastName.trim(),
				phone: values.phone?.trim() || null,
				dateOfBirth: values.dateOfBirth ? new Date(values.dateOfBirth) : null,
				placeOfBirth: values.placeOfBirth?.trim() || null,
				gender: values.gender || undefined,
				nationality: values.nationality?.trim() || null,
			}),
		onSuccess: (updated) => {
			queryClient.invalidateQueries({ queryKey: ["myProfile"] });
			if (updated && user) {
				setUser({
					...user,
					firstName: updated.firstName ?? user.firstName,
					lastName: updated.lastName ?? user.lastName,
				});
			}
			toast.success(t("settings.profile.toast.success"));
		},
		onError: () => toast.error(t("settings.profile.toast.error")),
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

	const languageOptions = [
		{ value: "en", label: t("settings.preferences.languages.en") },
		{ value: "fr", label: t("settings.preferences.languages.fr") },
	];

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
			<div className="flex flex-col gap-2">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
						<SettingsIcon className="h-5 w-5" />
					</div>
					<div>
						<h1 className="font-semibold text-2xl">{t("settings.title")}</h1>
						<p className="text-muted-foreground">{t("settings.subtitle")}</p>
					</div>
				</div>
			</div>

			<Tabs defaultValue="account" className="space-y-6">
				<TabsList className="w-full justify-start">
					<TabsTrigger value="account">
						{t("settings.tabs.account")}
					</TabsTrigger>
					<TabsTrigger value="profile">
						{t("settings.tabs.profile")}
					</TabsTrigger>
					<TabsTrigger value="preferences">
						{t("settings.tabs.preferences")}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="account" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<UserCircle className="h-4 w-4 text-primary" />
								{t("settings.account.title")}
							</CardTitle>
							<CardDescription>
								{t("settings.account.description")}
							</CardDescription>
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
													<FormLabel>
														{t("settings.account.fields.name")}
													</FormLabel>
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
												toast.success(
													t("settings.account.email.verificationSent"),
												);
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
													<FormLabel>
														{t("settings.password.fields.new")}
													</FormLabel>
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
										? formatDistanceToNow(createdAt, {
												addSuffix: true,
											})
										: t("settings.sessions.unknownTime");
									const browser = getBrowserLabel(entry.userAgent);
									return (
										<div
											key={
												resolveToken(entry as Record<string, unknown>) ??
												browser
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
				</TabsContent>

				<TabsContent value="profile" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<BadgeCheck className="h-4 w-4 text-primary" />
								{t("settings.profile.title")}
							</CardTitle>
							<CardDescription>
								{t("settings.profile.description")}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Form {...profileForm}>
								<form
									onSubmit={profileForm.handleSubmit((values) =>
										updateProfileMutation.mutate(values),
									)}
									className="space-y-6"
								>
									<div className="flex items-center gap-4 rounded-xl border border-muted-foreground/40 border-dashed bg-muted/40 p-4">
										<Avatar className="h-12 w-12">
											<AvatarFallback className="bg-primary/10 font-semibold text-primary">
												{initials}
											</AvatarFallback>
										</Avatar>
										<div>
											<p className="font-medium">
												{profile?.firstName} {profile?.lastName}
											</p>
											<p className="text-muted-foreground text-xs">
												{session?.user?.email ?? user?.email}
											</p>
										</div>
									</div>
									<div className="grid gap-4 md:grid-cols-2">
										<FormField
											control={profileForm.control}
											name="firstName"
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														{t("settings.profile.fields.firstName")}
													</FormLabel>
													<FormControl>
														<Input {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={profileForm.control}
											name="lastName"
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														{t("settings.profile.fields.lastName")}
													</FormLabel>
													<FormControl>
														<Input {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
									<div className="grid gap-4 md:grid-cols-2">
										<div className="space-y-2">
											<label
												className="font-medium text-sm"
												htmlFor="settings-email"
											>
												{t("settings.profile.fields.email")}
											</label>
											<Input
												id="settings-email"
												value={session?.user?.email ?? user?.email ?? ""}
												disabled
											/>
										</div>
										<FormField
											control={profileForm.control}
											name="phone"
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														{t("settings.profile.fields.phone")}
													</FormLabel>
													<FormControl>
														<PhoneInput
															value={field.value}
															onChange={field.onChange}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
									<div className="grid gap-4 md:grid-cols-2">
										<FormField
											control={profileForm.control}
											name="dateOfBirth"
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														{t("settings.profile.fields.dateOfBirth")}
													</FormLabel>
													<FormControl>
														<DatePicker
															value={field.value ?? ""}
															onChange={field.onChange}
															placeholder={t(
																"settings.profile.fields.dateOfBirthPlaceholder",
															)}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={profileForm.control}
											name="placeOfBirth"
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														{t("settings.profile.fields.placeOfBirth")}
													</FormLabel>
													<FormControl>
														<Input {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
									<div className="grid gap-4 md:grid-cols-2">
										<FormField
											control={profileForm.control}
											name="gender"
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														{t("settings.profile.fields.gender")}
													</FormLabel>
													<Select
														value={field.value}
														onValueChange={field.onChange}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue
																	placeholder={t(
																		"settings.profile.fields.genderPlaceholder",
																	)}
																/>
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectItem value="male">
																{t("settings.profile.gender.male")}
															</SelectItem>
															<SelectItem value="female">
																{t("settings.profile.gender.female")}
															</SelectItem>
															<SelectItem value="other">
																{t("settings.profile.gender.other")}
															</SelectItem>
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={profileForm.control}
											name="nationality"
											render={({ field }) => {
												const isFr = i18n.language.startsWith("fr");
												const selectedCountry = COUNTRIES.find(
													(c) =>
														c.code === field.value ||
														c.nameEn === field.value ||
														c.nameFr === field.value,
												);
												const displayName = selectedCountry
													? isFr
														? selectedCountry.nameFr
														: selectedCountry.nameEn
													: field.value;
												return (
													<FormItem className="flex flex-col">
														<FormLabel>
															{t("settings.profile.fields.nationality")}
														</FormLabel>
														<Popover>
															<PopoverTrigger asChild>
																<FormControl>
																	<Button
																		variant="outline"
																		className={cn(
																			"w-full justify-between font-normal",
																			!field.value && "text-muted-foreground",
																		)}
																	>
																		{displayName ||
																			t(
																				"settings.profile.fields.nationalityPlaceholder",
																			)}
																		<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
																	</Button>
																</FormControl>
															</PopoverTrigger>
															<PopoverContent
																className="w-[--radix-popover-trigger-width] p-0"
																align="start"
															>
																<Command>
																	<CommandInput
																		placeholder={t(
																			"settings.profile.fields.nationalitySearch",
																		)}
																	/>
																	<CommandList>
																		<CommandEmpty>
																			{t("common.noResults")}
																		</CommandEmpty>
																		<CommandGroup>
																			{COUNTRIES.map((country) => (
																				<CommandItem
																					key={country.code}
																					value={
																						country.nameEn +
																						" " +
																						country.nameFr
																					}
																					onSelect={() =>
																						field.onChange(country.code)
																					}
																				>
																					<Check
																						className={cn(
																							"mr-2 h-4 w-4",
																							field.value === country.code
																								? "opacity-100"
																								: "opacity-0",
																						)}
																					/>
																					{isFr
																						? country.nameFr
																						: country.nameEn}
																				</CommandItem>
																			))}
																		</CommandGroup>
																	</CommandList>
																</Command>
															</PopoverContent>
														</Popover>
														<FormMessage />
													</FormItem>
												);
											}}
										/>
									</div>
								</form>
							</Form>
						</CardContent>
						<CardFooter className="justify-end">
							<Button
								type="submit"
								onClick={profileForm.handleSubmit((values) =>
									updateProfileMutation.mutate(values),
								)}
								disabled={updateProfileMutation.isPending}
							>
								{t("settings.profile.save")}
							</Button>
						</CardFooter>
					</Card>
				</TabsContent>

				<TabsContent value="preferences" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Languages className="h-4 w-4 text-primary" />
								{t("settings.preferences.title")}
							</CardTitle>
							<CardDescription>
								{t("settings.preferences.description")}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid gap-4 md:max-w-sm">
								<div className="space-y-2">
									<label className="font-medium text-sm">
										{t("settings.preferences.languageLabel")}
									</label>
									<Select
										value={i18n.language}
										onValueChange={(value) => {
											i18n.changeLanguage(value);
											localStorage.setItem("lng", value);
										}}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{languageOptions.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<Separator />
								<div className="flex items-start gap-3 rounded-lg border border-dashed p-4 text-muted-foreground text-sm">
									<KeyRound className="mt-0.5 h-4 w-4" />
									{t("settings.preferences.languageHint")}
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
