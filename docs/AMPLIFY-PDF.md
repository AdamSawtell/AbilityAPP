# Amplify — server PDF (Chromium)

Server PDF uses `POST /api/documents/render-pdf` with `@sparticuz/chromium-min` + `puppeteer-core`.

**Live app:** `https://main.d3vim3geq5td01.amplifyapp.com`  
**App id:** `d3vim3geq5td01` · **Branch:** `main`

## Amplify compute limits

| Limit | Value | Implication |
|-------|--------|-------------|
| SSR/API timeout | **30 seconds** (hard) | PDF must finish within ~25s; `maxDuration = 120` only applies on Vercel-style hosts |
| Compute Lambda memory | **~1024 MB** (managed) | Not configurable in `amplify.yml`; AWS sets this for WEB_COMPUTE |
| Response body | **5.72 MB** max | Large batch PDFs use per-file download or ZIP client-side |
| Compute bundle | **220 MB** uncompressed | `amplify.yml` strips unused `@swc` binaries after build |

## Tune runtime memory

**Repo default (shipped):** `web/package.json` `start` runs Node with `--max-old-space-size=768`. `amplify.yml` also writes `NODE_OPTIONS` into `.env.production` when the console variable is unset.

Amplify does **not** expose Lambda memory size in the repo. You **can** override the Node.js heap so Chromium + Node share the 1024 MB budget more predictably:

1. Amplify console → **AbilityAPP** → **Hosting** → **Environment variables**
2. Add or update:

   | Key | Value |
   |-----|--------|
   | `NODE_OPTIONS` | `--max-old-space-size=768` |

3. **Save** → **Redeploy** `main`

Leave ~256 MB headroom for Chromium’s native memory outside the V8 heap.

`@sparticuz/chromium-min` downloads the Sparticuz pack (~65 MB) to `/tmp` on first PDF request. Default pack URL is set in code; override with `CHROMIUM_PACK_URL` if needed. First request after a cold start may take 15–25 seconds — stay within Amplify’s **30s** API timeout.

Production builds use `next build --webpack` (not Turbopack) so Chromium externals resolve on Amplify compute — see `web/package.json`.

## Tune via AWS CLI (when credentials configured)

```powershell
aws amplify update-branch `
  --app-id d3vim3geq5td01 `
  --branch-name main `
  --region ap-southeast-2 `
  --environment-variables "NODE_OPTIONS=--max-old-space-size=768"
```

Then trigger a redeploy from the console or push a commit.

## Smoke test (after deploy)

1. Login: **SuperUser** / `flamingo` (or staff `welcome` with print permission).
2. **Invoice PDF:** `/invoices/inv-jun26-bulk01` → **Download PDF** → PDF opens or downloads; no amber error banner.
3. **Extended surface:** `/enquiries` → open any enquiry → **Download PDF** (acknowledgement).
4. **Registry:** System → Document registry → new rows with `application/pdf`.

### API check (browser devtools)

`POST /api/documents/render-pdf` should return **200** with `pdfBase64` or `record` + `downloadUrl`.  
**503** with Chromium message → memory/timeout; confirm `NODE_OPTIONS` and retry after cold start.

## Fallback

If server PDF fails on Amplify, use **Print** / **Download HTML** — same templates, browser Save as PDF.
