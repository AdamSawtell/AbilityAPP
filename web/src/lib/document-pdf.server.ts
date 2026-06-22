import "server-only";

export type HtmlToPdfOptions = {
  format?: "A4" | "Letter";
};

/** Sparticuz pack for @sparticuz/chromium-min v147 (x64 Lambda / Amplify compute). */
const DEFAULT_CHROMIUM_PACK_URL =
  "https://github.com/Sparticuz/chromium/releases/download/v147.0.0/chromium-v147.0.0-pack.x64.tar";

/** Render print-quality HTML to PDF bytes (server-side). */
export async function htmlToPdfBuffer(html: string, options?: HtmlToPdfOptions): Promise<Buffer> {
  const chromium = (await import("@sparticuz/chromium-min")).default;
  const puppeteer = await import("puppeteer-core");

  const executablePath = await resolveChromiumExecutable(chromium);
  const browser = await puppeteer.default.launch({
    args: puppeteerArgs(chromium),
    defaultViewport: { width: 794, height: 1123 },
    executablePath,
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load", timeout: 25_000 });
    const pdf = await page.pdf({
      format: options?.format ?? "A4",
      printBackground: true,
      margin: { top: "12mm", right: "12mm", bottom: "14mm", left: "12mm" },
      timeout: 25_000,
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

function puppeteerArgs(chromium: typeof import("@sparticuz/chromium-min").default): string[] {
  const base = [...chromium.args];
  const lambdaExtras = ["--disable-dev-shm-usage", "--no-zygote", "--single-process"];
  for (const flag of lambdaExtras) {
    if (!base.includes(flag)) base.push(flag);
  }
  return base;
}

async function resolveChromiumExecutable(
  chromium: typeof import("@sparticuz/chromium-min").default
): Promise<string> {
  const override = process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
  if (override) return override;

  const packUrl = process.env.CHROMIUM_PACK_URL?.trim() || DEFAULT_CHROMIUM_PACK_URL;

  // chromium-min has no bundled binary — production must fetch/decompress the Sparticuz pack.
  if (process.env.NODE_ENV === "production" || packUrl) {
    return chromium.executablePath(packUrl);
  }

  try {
    return await chromium.executablePath();
  } catch {
    return chromium.executablePath(packUrl);
  }
}
