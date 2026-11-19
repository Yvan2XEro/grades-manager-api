import { TRPCError } from "@trpc/server";
import puppeteer, { type LaunchOptions } from "puppeteer";

/**
 * Message of the error thrown when a PDF cannot be produced (headless
 * browser missing or crashing). The web shows a translated message for it;
 * the technical cause only goes to the server log.
 */
export const PDF_RENDER_FAILED = "DOCUMENT_RENDER_FAILED";

/** Logs the technical cause and returns the user-facing PDF error. */
export function pdfRenderError(context: string, err: unknown) {
	if (err instanceof TRPCError && err.message === PDF_RENDER_FAILED) return err;
	console.error(
		`[pdf] ${context} failed:`,
		err instanceof Error ? err.message : err,
	);
	return new TRPCError({
		code: "INTERNAL_SERVER_ERROR",
		message: PDF_RENDER_FAILED,
	});
}

/** Launches the headless browser used to print PDFs. */
export async function launchPdfBrowser(options: LaunchOptions = {}) {
	try {
		return await puppeteer.launch({
			headless: true,
			args: ["--no-sandbox", "--disable-setuid-sandbox"],
			executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
			...options,
		});
	} catch (err) {
		throw pdfRenderError("browser launch", err);
	}
}
