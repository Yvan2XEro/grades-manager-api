import { centerCrop, makeAspectCrop, type PixelCrop } from "react-image-crop";

export function centerAspectCrop(w: number, h: number) {
	return centerCrop(makeAspectCrop({ unit: "%", width: 80 }, 1, w, h), w, h);
}

/** Draws the cropped area of `image` on a `size`×`size` canvas and returns it as JPEG. */
export async function cropToBlob(
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

/** Base64 payload of a blob, without the `data:` prefix. */
export const blobToBase64 = (blob: Blob) =>
	new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve((reader.result as string).split(",")[1]);
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});
