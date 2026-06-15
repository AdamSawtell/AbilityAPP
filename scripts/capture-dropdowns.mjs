import { chromium } from 'playwright';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

const BASE_URL = 'http://development030.abilityerp.com.au/webui/';
const USER = 'SuperUser';
const PASS = 'flamingo';
const OUT = path.resolve('discovery/enquiry-capture.json');

async function login(page) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(5000);
  await page.locator('input[type="text"], input:not([type])').first().fill(USER);
  await page.locator('input[type="password"]').first().fill(PASS);
  await page.locator('.z-button').filter({ hasText: 'OK' }).first().click();
  await page.waitForTimeout(5000);
  if (await page.locator('text=Select Role').count()) {
    await page.locator('.z-button').filter({ hasText: 'OK' }).last().click();
    await page.waitForTimeout(7000);
  }
}

async function openEnquiryRecord(page) {
  await page.getByText(/Enquiries - New:/i).first().click();
  await page.waitForTimeout(8000);
  await page.evaluate(() => {
    const row = document.querySelector('.z-listbox-body .z-listitem');
    row?.scrollIntoView({ block: 'center' });
    row?.click();
  });
  await page.waitForTimeout(2000);
  await page.evaluate(() => {
    const bar = [...document.querySelectorAll('*')].find((el) => el.textContent?.trim() === 'Detail record');
    bar?.click();
  });
  await page.waitForTimeout(3000);
}

async function captureDropdownByLabel(page, label) {
  const labelEl = page.locator('.z-label').filter({ hasText: new RegExp(`^${label}$`) }).first();
  if (!(await labelEl.count())) return { label, options: [] };

  const row = labelEl.locator('xpath=ancestor::tr[1]');
  const combo = row.locator('.z-combobox').first();
  if (!(await combo.count())) return { label, options: [] };

  try {
    await combo.locator('.z-combobox-button').click({ timeout: 3000 });
    await page.waitForTimeout(700);
    const texts = await page.locator('.z-combobox-popup:visible .z-comboitem').allInnerTexts();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    return { label, options: [...new Set(texts.map((t) => t.replace(/\s+/g, ' ').trim()).filter(Boolean))] };
  } catch {
    return { label, options: [] };
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1680, height: 1200 } });
  await login(page);
  await openEnquiryRecord(page);

  const labels = [
    'Is Enquiry For Self',
    '3rd Party Consent',
    'Preferred Communication Method',
    'Gender',
    'Funding Body',
    'Disability',
    'Enquiry Source',
    'Status',
    'Relationship Type',
  ];

  const dropdowns = [];
  for (const label of labels) {
    const result = await captureDropdownByLabel(page, label);
    if (result.options.length) dropdowns.push(result);
    console.log(label, '=>', result.options.length, 'options');
  }

  const existing = JSON.parse(await readFile(OUT, 'utf8'));
  existing.dropdownOptions = dropdowns;
  await writeFile(OUT, JSON.stringify(existing, null, 2));
  await browser.close();
}

main();
