import { chromium } from 'playwright';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

const BASE_URL = 'http://development030.abilityerp.com.au/webui/';
const USER = 'SuperUser';
const PASS = 'flamingo';
const OUT_DIR = path.resolve('discovery');

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

async function extract(page) {
  return page.evaluate(() => {
    const clean = (s) => (s || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
    const activeTab = clean(document.querySelector('.z-tab-selected')?.textContent || '');
    const windowTabs = [...document.querySelectorAll('.z-tabbox .z-tabs .z-tab')].map((t) => clean(t.textContent)).filter(Boolean);
    const innerTabs = [...document.querySelectorAll('.z-tabpanel:not([style*="display: none"]) .z-tab')].map((t) => clean(t.textContent)).filter(Boolean);
    const fields = [];
    const seen = new Set();
    for (const row of document.querySelectorAll('tr')) {
      const labelEl = row.querySelector('.z-label');
      if (!labelEl) continue;
      const label = clean(labelEl.textContent);
      if (!label || label.length > 120 || seen.has(label)) continue;
      const cells = [...row.querySelectorAll('td')];
      const valueCell = cells[cells.indexOf(labelEl.closest('td')) + 1];
      if (!valueCell) continue;
      let type = 'text';
      if (valueCell.querySelector('.z-combobox')) type = 'dropdown';
      else if (valueCell.querySelector('.z-bandbox')) type = 'lookup';
      else if (valueCell.querySelector('.z-datebox')) type = 'date';
      else if (valueCell.querySelector('textarea')) type = 'textarea';
      else if (valueCell.querySelector('input[type="checkbox"]')) type = 'checkbox';
      const input = valueCell.querySelector('input:not([type="hidden"]), textarea');
      const value =
        input?.type === 'checkbox' ? (input.checked ? 'Yes' : 'No') : clean(input?.value || valueCell.textContent);
      seen.add(label);
      fields.push({ label, type, value, tab: activeTab });
    }
    const listColumns = [...document.querySelectorAll('.z-listhead .z-listheader')]
      .map((h) => clean(h.textContent))
      .filter(Boolean);
    const listRows = [...document.querySelectorAll('.z-listbox-body .z-listitem')]
      .slice(0, 25)
      .map((r) => [...r.querySelectorAll('.z-listcell')].map((c) => clean(c.textContent)));
    return {
      activeTab,
      windowTabs,
      innerTabs,
      fields,
      listColumns,
      listRows,
      body: clean(document.body.innerText).slice(0, 40000),
    };
  });
}

async function captureDropdowns(page) {
  const out = [];
  for (const combo of await page.locator('.z-combobox:visible').all()) {
    const input = combo.locator('input').first();
    const h = await input.elementHandle().catch(() => null);
    if (!h) continue;
    const field = await page.evaluate(
      (el) => el.closest('tr')?.querySelector('.z-label')?.textContent?.trim() || '',
      h
    );
    if (!field) continue;
    try {
      await combo.locator('.z-combobox-button').click({ timeout: 2000 });
      await page.waitForTimeout(500);
      const options = [
        ...new Set(
          (await page.locator('.z-combobox-popup:visible .z-comboitem').allInnerTexts())
            .map((o) => o.replace(/\u00a0/g, ' ').trim())
            .filter(Boolean)
        ),
      ];
      await page.keyboard.press('Escape');
      await page.waitForTimeout(150);
      if (options.length) out.push({ field, options });
    } catch {
      /* skip */
    }
  }
  return out;
}

async function openContractWindow(page) {
  const search = page.locator('input.z-bandbox-input').first();
  await search.click();
  await search.fill('');
  await search.type('Contract', { delay: 25 });
  await page.waitForTimeout(2000);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(10000);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1680, height: 1200 } });
  const report = { capturedAt: new Date().toISOString(), records: [] };

  await login(page);
  await openContractWindow(page);

  const listRows = await page.locator('.z-listbox-body .z-listitem').count();
  const take = Math.min(listRows, 5);
  for (let i = 0; i < take; i++) {
    await page.locator('.z-listbox-body .z-listitem').nth(i).dblclick();
    await page.waitForTimeout(5000);
    const record = await extract(page);
    record.dropdowns = await captureDropdowns(page);

    const innerTabNames = record.innerTabs.length ? record.innerTabs : ['Contract'];
    record.innerTabData = {};
    for (const tabName of innerTabNames) {
      await page.evaluate((name) => {
        const tabs = [...document.querySelectorAll('.z-tabpanel:not([style*="display: none"]) .z-tab, .z-tabpanel .z-tab')];
        const tab = tabs.find((t) => t.textContent?.replace(/\s+/g, ' ').trim() === name);
        tab?.click();
      }, tabName);
      await page.waitForTimeout(2000);
      record.innerTabData[tabName] = await extract(page);
    }

    report.records.push(record);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(2000);
    if (!(await page.locator('.z-listbox-body .z-listitem').count())) break;
  }

  await writeFile(path.join(OUT_DIR, 'contract-capture-full.json'), JSON.stringify(report, null, 2));
  console.log('Captured', report.records.length, 'contracts');
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
