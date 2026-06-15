import { chromium } from 'playwright';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

const BASE_URL = 'http://development030.abilityerp.com.au/webui/';
const USER = 'SuperUser';
const PASS = 'flamingo';
const OUT_DIR = path.resolve('discovery');

const WINDOWS = [
  'Product',
  'Price List',
  'Service Agreement',
  'Service Booking',
];

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
    const allTabs = [...document.querySelectorAll('.z-tab')].map((t) => clean(t.textContent)).filter(Boolean);
    const innerTabs = [...document.querySelectorAll('.z-tabpanel:not([style*="display: none"]) .z-tab')].map((t) =>
      clean(t.textContent)
    );
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
      .slice(0, 30)
      .map((r) => [...r.querySelectorAll('.z-listcell')].map((c) => clean(c.textContent)));
    return { activeTab, allTabs, innerTabs, fields, listColumns, listRows, body: clean(document.body.innerText).slice(0, 45000) };
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

async function openWindow(page, query) {
  const search = page.locator('input.z-bandbox-input').first();
  await search.click();
  await search.fill('');
  await search.type(query, { delay: 20 });
  await page.waitForTimeout(2500);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(10000);
}

async function openFirstRecord(page) {
  await page.evaluate(() => {
    const row = document.querySelector('.z-listbox-body .z-listitem');
    row?.scrollIntoView({ block: 'center' });
    row?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, view: window }));
  });
  await page.waitForTimeout(6000);
}

async function captureWindowTabs(page, prefix) {
  const tabs = {};
  const tabNames = await page.evaluate(() => {
    const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
    return [
      ...new Set(
        [...document.querySelectorAll('.z-tab')]
          .map((t) => clean(t.textContent))
          .filter((t) => t && !['Home', 'Menu', 'Search'].includes(t))
      ),
    ];
  });

  for (const name of tabNames) {
    await page.evaluate((tabName) => {
      const tabs = [...document.querySelectorAll('.z-tab')];
      const tab = tabs.find((t) => t.textContent?.replace(/\s+/g, ' ').trim() === tabName);
      tab?.click();
    }, name);
    await page.waitForTimeout(2500);
    const key = name.replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 40);
    await page.screenshot({ path: path.join(OUT_DIR, `${prefix}-${key}.png`), fullPage: true });
    const data = await extract(page);
    data.dropdowns = await captureDropdowns(page);
    tabs[name] = data;
    console.log(`  tab "${name}": ${data.fields.length} fields, ${data.listColumns.length} cols`);
  }
  return tabs;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1680, height: 1200 } });
  const report = { capturedAt: new Date().toISOString(), windows: {} };

  await login(page);

  for (const windowName of WINDOWS) {
    console.log('\n===', windowName, '===');
    await openWindow(page, windowName);
    const list = await extract(page);
    const slug = windowName.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    await page.screenshot({ path: path.join(OUT_DIR, `90-${slug}-list.png`), fullPage: true });

    const entry = { windowName, list, record: null, tabs: {} };
    const hasGrid = list.listColumns.length > 0 || list.listRows.some((r) => r.some(Boolean));
    const looksOpen = list.body.toLowerCase().includes(windowName.toLowerCase().split(' ')[0]);

    if (hasGrid || looksOpen) {
      if (hasGrid) await openFirstRecord(page);
      entry.record = await extract(page);
      entry.record.dropdowns = await captureDropdowns(page);
      entry.tabs = await captureWindowTabs(page, `91-${slug}`);
      await page.screenshot({ path: path.join(OUT_DIR, `90-${slug}-record.png`), fullPage: true });
    }

    report.windows[windowName] = entry;
    console.log('list cols:', list.listColumns.join(' | '));
    console.log('record fields:', entry.record?.fields?.map((f) => f.label).join(', '));
  }

  await writeFile(path.join(OUT_DIR, 'service-catalog-capture.json'), JSON.stringify(report, null, 2));
  console.log('\nSaved discovery/service-catalog-capture.json');
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
