import { CropIcon, ZoomIn, ZoomOut } from "lucide-react";
import { useRef, useState } from "react";
import { createCallable } from "react-call";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { DIALOG_EXIT_MS } from "@/components/callable/callable-dialog";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/lib/toast";
import { centerAspectCrop, cropToBlob } from "../services/avatar-crop";

/** Crops an image to a square avatar; resolves with the JPEG blob, or `undefined`. */
export const AvatarCropModal = createCallable<
	{ src: string },
	Blob | undefined
>(({ call, src }) => {
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
			call.end(await cropToBlob(imgRef.current, completedCrop));
		} catch {
			toast.error("Erreur lors du recadrage");
		}
	};

	return (
		<Dialog open={!call.ended} onOpenChange={(v) => !v && call.end(undefined)}>
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
					<Button variant="outline" onClick={() => call.end(undefined)}>
						Annuler
					</Button>
					<Button onClick={handleConfirm} disabled={!completedCrop}>
						Appliquer
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}, DIALOG_EXIT_MS);
