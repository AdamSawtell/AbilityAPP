import "server-only";

import chromium from "@sparticuz/chromium-min";
import puppeteer from "puppeteer-core";

export type HtmlToPdfOptions = {
  format?: "A4" | "Letter";
};

/** Render print-quality HTML to PDF bytes (server-side). */
export async function htmlToPdfBuffer(html: string, options?: HtmlToPdfOptions): Promise<Buffer> {
  const executablePath = await resolveChromiumExecutable();
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 794, height: 1123 },
    executablePath,
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: options?.format ?? "A4",
      printBackground: true,
      margin: { top: "12mm", right: "12mm", bottom: "14mm", left: "12mm" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

async function resolveChromiumExecutable(): Promise<string> {
  const override = process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
  if (override) return override;
  return chromium.executablePath();
}
