import { chromium } from 'playwright';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

const BASE_URL = 'http://development030.abilityerp.com.au/webui/';
const USER = 'SuperUser';
const PASS = 'flamingo';
const OUT_DIR = path.resolve('discovery');

async function save(page, name) {
  await mkdir(OUT_DIR, { recursive: true });
  await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`), fullPage: true });
  const text = await page.locator('body').innerText().catch(() => '');
  await writeFile(path.join(OUT_DIR, `${name}.txt`), text, 'utf8');
  console.log(`Saved ${name} | URL: ${page.url()}`);
}

async function login(page) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(5000);

  const userField = page.locator('input[type="text"], input:not([type])').first();
  const passField = page.locator('input[type="password"]').first();
  await userField.waitFor({ state: 'visible', timeout: 60000 });
  await userField.fill(USER);
  await passField.fill(PASS);

  const loginBtn = page.getByRole('button', { name: /^ok$/i }).first();
  await loginBtn.click();
  await page.waitForTimeout(5000);

  const roleDialog = page.getByText('Select Role');
  if (await roleDialog.count()) {
    const okBtn = page.getByRole('button', { name: /^ok$/i }).last();
    await okBtn.click();
    await page.waitForTimeout(6000);
  }
}

async function openEnquiries(page) {
  const dashboardLink = page.getByText(/Enquiries - New:/i).first();
  if (await dashboardLink.count()) {
    await dashboardLink.click();
    await page.waitForTimeout(6000);
    return 'dashboard-link';
  }

  const search = page.locator('input.z-bandbox-input, input[placeholder*="Search" i]').first();
  await search.click();
  await search.fill('Enquiry');
  await page.waitForTimeout(1500);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(6000);
  return 'menu-search';
}

async function main() {
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

  try {
    await login(page);
    await save(page, '10-home');

    const method = await openEnquiries(page);
    await save(page, `11-enquiries-${method}`);

    const newBtn = page.getByRole('button', { name: /^new$/i }).first();
    if (await newBtn.count()) {
      await newBtn.click();
      await page.waitForTimeout(5000);
      await save(page, '12-enquiry-new-form');
    }

    const firstRow = page.locator('table tr').nth(1);
    if (await firstRow.count()) {
      await firstRow.dblclick().catch(() => firstRow.click());
      await page.waitForTimeout(5000);
      await save(page, '13-enquiry-record');
    }

    console.log('Done. Browser stays open 90s...');
    await page.waitForTimeout(90000);
  } catch (err) {
    console.error(err);
    await save(page, '11-error').catch(() => {});
    await page.waitForTimeout(30000);
  } finally {
    await browser.close();
  }
}

main();
