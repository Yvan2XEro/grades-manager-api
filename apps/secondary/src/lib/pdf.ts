import puppeteer from "puppeteer";

/** Launch Puppeteer, render the given HTML, and return a PDF Buffer. */
export async function htmlToPdf(html: string): Promise<Buffer> {
	const browser = await puppeteer.launch({
		headless: true,
		args: [
			"--no-sandbox",
			"--disable-setuid-sandbox",
			"--disable-dev-shm-usage",
		],
		executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
	});
	try {
		const page = await browser.newPage();
		await page.setContent(html, {
			waitUntil: "domcontentloaded",
			timeout: 30_000,
		});
		const pdf = await page.pdf({
			format: "A4",
			printBackground: true,
			margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
		});
		return Buffer.from(pdf);
	} finally {
		await browser.close();
	}
}

export function pdfToBase64(buf: Buffer): string {
	return buf.toString("base64");
}
