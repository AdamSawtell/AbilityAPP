import { chromium } from 'playwright';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

const BASE_URL = 'http://development030.abilityerp.com.au/webui/';
const USER = 'SuperUser';
const PASS = 'flamingo';
const OUT_DIR = path.resolve('discovery');

async function saveJson(name, data) {
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(path.join(OUT_DIR, name), JSON.stringify(data, null, 2));
}

async function login(page) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(4000);
  await page.locator('input[type="text"], input:not([type])').first().fill(USER);
  await page.locator('input[type="password"]').first().fill(PASS);
  await page.locator('.z-button').filter({ hasText: 'OK' }).first().click();
  await page.waitForTimeout(5000);
  if (await page.locator('text=Select Role').count()) {
    await page.locator('.z-button').filter({ hasText: 'OK' }).last().click();
    await page.waitForTimeout(7000);
  }
}

async function openEnquiryInfoWindow(page) {
  const search = page.locator('input.z-bandbox-input').first();
  await search.click();
  await search.fill('');
  await search.type('Enquiry', { delay: 40 });
  await page.waitForTimeout(1500);
  const result = page.locator('.z-bandbox-popup .z-listitem, .z-bandbox-popup .z-listcell').filter({ hasText: /^Enquiry$/i }).first();
  if (await result.count()) {
    await result.click();
  } else {
    await page.keyboard.press('Enter');
  }
  await page.waitForTimeout(8000);
}

async function extractAll(page) {
  return page.evaluate(() => {
    const clean = (s) => (s || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
    const fields = [];
    const seen = new Set();

    for (const row of document.querySelectorAll('tr')) {
      const labelEl = row.querySelector('.z-label');
      if (!labelEl) continue;
      const label = clean(labelEl.textContent);
      if (!label || seen.has(label)) continue;
      const cells = [...row.querySelectorAll('td')];
      const labelCell = labelEl.closest('td');
      const valueCell = cells[cells.indexOf(labelCell) + 1];
      if (!valueCell) continue;

      let type = 'text';
      let value = '';
      if (valueCell.querySelector('.z-combobox')) type = 'dropdown';
      else if (valueCell.querySelector('.z-bandbox')) type = 'lookup';
      else if (valueCell.querySelector('.z-datebox')) type = 'date';
      else if (valueCell.querySelector('textarea')) type = 'textarea';
      else if (valueCell.querySelector('input[type="checkbox"]')) type = 'checkbox';

      const input = valueCell.querySelector('input, textarea');
      value = clean(input?.value || valueCell.textContent);
      seen.add(label);
      fields.push({ label, type, value });
    }

    const listColumns = [...document.querySelectorAll('.z-listhead .z-listheader')].map((h) => clean(h.textContent));
    const listRows = [...document.querySelectorAll('.z-listbox-body .z-listitem')].slice(0, 20).map((row) =>
      [...row.querySelectorAll('.z-listcell')].map((c) => clean(c.textContent))
    );

    return {
      title: clean(document.querySelector('.z-tab-selected')?.textContent || ''),
      fields,
      listColumns,
      listRows,
      bodySnippet: clean(document.body.innerText).slice(0, 15000),
    };
  });
}

async function captureComboboxOptions(page) {
  const dropdowns = [];
  const combos = await page.locator('.z-combobox').all();

  for (let i = 0; i < combos.length; i++) {
    const combo = combos[i];
    if (!(await combo.isVisible())) continue;

    const input = combo.locator('input').first();
    const nearLabel = await page.evaluate((el) => {
      const row = el.closest('tr');
      const label = row?.querySelector('.z-label');
      return label?.textContent?.trim() || '';
    }, await input.elementHandle());

    const fieldName = nearLabel || (await input.getAttribute('title')) || `field-${i}`;

    try {
      await combo.locator('.z-combobox-button').click({ timeout: 2000 });
      await page.waitForTimeout(600);
      const options = await page.locator('.z-combobox-popup:visible .z-comboitem').allInnerTexts();
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
      const cleaned = [...new Set(options.map((o) => o.replace(/\s+/g, ' ').trim()).filter(Boolean))];
      if (cleaned.length) dropdowns.push({ field: fieldName, options: cleaned });
    } catch {
      // ignore
    }
  }
  return dropdowns;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1680, height: 1200 } });
  const report = { capturedAt: new Date().toISOString() };

  try {
    await login(page);
    await openEnquiryInfoWindow(page);
    await page.screenshot({ path: path.join(OUT_DIR, '40-enquiry-info.png'), fullPage: true });
    report.infoWindow = await extractAll(page);
    await saveJson('enquiry-capture.json', report);

    await page.evaluate(() => {
      const row = document.querySelector('.z-listbox-body .z-listitem');
      row?.scrollIntoView({ block: 'center' });
      row?.click();
    });
    await page.waitForTimeout(1500);

    await page.evaluate(() => {
      const bar = [...document.querySelectorAll('*')].find((el) => el.textContent?.trim() === 'Detail record');
      bar?.click();
    });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(OUT_DIR, '41-detail-panel.png'), fullPage: true });
    report.detailPanel = await extractAll(page);
    report.detailPanel.dropdowns = await captureComboboxOptions(page);
    await saveJson('enquiry-capture.json', report);

    await page.evaluate(() => {
      const row = document.querySelector('.z-listbox-body .z-listitem');
      const evt = new MouseEvent('dblclick', { bubbles: true, cancelable: true, view: window });
      row?.dispatchEvent(evt);
    });
    await page.waitForTimeout(6000);
    await page.screenshot({ path: path.join(OUT_DIR, '42-record-window.png'), fullPage: true });
    report.recordWindow = await extractAll(page);
    report.recordWindow.dropdowns = await captureComboboxOptions(page);

    const tabNames = await page.locator('.z-tab').allInnerTexts();
    report.recordTabs = {};
    for (const rawName of tabNames) {
      const name = rawName.replace(/\s+/g, ' ').trim();
      if (!name || name === 'Home' || name.includes('Enquiry:')) continue;
      const tab = page.locator('.z-tab').filter({ hasText: name }).first();
      if (!(await tab.count())) continue;
      await tab.click();
      await page.waitForTimeout(2000);
      const data = await extractAll(page);
      data.dropdowns = await captureComboboxOptions(page);
      report.recordTabs[name] = data;
    }

    await saveJson('enquiry-capture.json', report);
    console.log('Capture OK');
    console.log('List columns:', report.infoWindow?.listColumns);
    console.log('Detail fields:', report.detailPanel?.fields?.length);
    console.log('Record fields:', report.recordWindow?.fields?.length);
    console.log('Dropdown sets:', report.recordWindow?.dropdowns?.length);
  } finally {
    await browser.close();
  }
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
