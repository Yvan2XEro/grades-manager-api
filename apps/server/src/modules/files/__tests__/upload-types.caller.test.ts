import { describe, expect, it } from "bun:test";
import { asAdmin } from "@/lib/test-utils";
import { appRouter } from "@/routers";

const base64 = Buffer.from("<script>alert(1)</script>").toString("base64");

describe("uploads only accept documents and images", () => {
	it("refuses HTML and scripts, accepts a PDF", async () => {
		const api = appRouter.createCaller(asAdmin());
		for (const filename of ["page.html", "x.js", "a.htm", "noext"]) {
			await expect(
				api.files.upload({ filename, mimeType: "text/html", base64 }),
			).rejects.toHaveProperty("code", "BAD_REQUEST");
		}
		const pdf = await api.files.upload({
			filename: "justificatif.pdf",
			mimeType: "application/pdf",
			base64: Buffer.from("%PDF-1.4").toString("base64"),
		});
		expect(pdf.key).toMatch(/\.pdf$/);
		await api.files.delete({ key: pdf.key });
		await expect(
			api.files.uploadAvatar({
				filename: "avatar.svg.html",
				mimeType: "image/svg+xml",
				base64,
			}),
		).rejects.toHaveProperty("code", "BAD_REQUEST");
	});
});
