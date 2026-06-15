import { chromium } from 'playwright';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

const BASE_URL = 'http://development030.abilityerp.com.au/webui/';
const USER = 'SuperUser';
const PASS = 'flamingo';
const OUT = path.resolve('discovery/support-plan-capture.json');

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
    const visiblePanel = document.querySelector('.z-tabpanel:not([style*="display: none"])');
    const innerTabs = visiblePanel
      ? [...visiblePanel.querySelectorAll('.z-tab')].map((t) => clean(t.textContent)).filter(Boolean)
      : [];
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
      .slice(0, 40)
      .map((r) => [...r.querySelectorAll('.z-listcell')].map((c) => clean(c.textContent)));
    return {
      activeTab,
      allTabs,
      innerTabs,
      fields,
      listColumns,
      listRows,
      body: clean(document.body.innerText).slice(0, 50000),
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

async function openSupportReceiverBern(page) {
  const search = page.locator('input.z-bandbox-input').first();
  await search.click();
  await search.fill('');
  await search.type('Support Receiver (BP)', { delay: 25 });
  await page.waitForTimeout(2000);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(10000);

  await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.z-listbox-body .z-listitem')];
    const row =
      rows.find((r) => /bern/i.test(r.textContent || '')) ||
      rows.find((r) => /rose/i.test(r.textContent || '')) ||
      rows[0];
    row?.scrollIntoView({ block: 'center' });
    row?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, view: window }));
  });
  await page.waitForTimeout(8000);
}

async function clickTab(page, tabName) {
  const clicked = await page.evaluate((name) => {
    const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const tabs = [...document.querySelectorAll('.z-tab')];
    const tab = tabs.find((t) => clean(t.textContent) === name);
    if (!tab) return false;
    tab.scrollIntoView({ block: 'center' });
    tab.click();
    return true;
  }, tabName);
  if (!clicked) {
    await page.locator('.z-tab').filter({ hasText: tabName }).first().click({ timeout: 5000 }).catch(() => {});
  }
  await page.waitForTimeout(3500);
}

async function openFirstGridRow(page) {
  await page.evaluate(() => {
    const panel = document.querySelector('.z-tabpanel:not([style*="display: none"])');
    const row = panel?.querySelector('.z-listbox-body .z-listitem') || document.querySelector('.z-listbox-body .z-listitem');
    row?.scrollIntoView({ block: 'center' });
    row?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, view: window }));
  });
  await page.waitForTimeout(5000);
}

async function main() {
  await mkdir(path.dirname(OUT), { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1680, height: 1200 } });
  const report = { capturedAt: new Date().toISOString(), tabs: {}, allDropdowns: [] };

  await login(page);
  await openSupportReceiverBern(page);
  report.recordHeader = await extract(page);

  for (const tab of [
    'Plan & Assessment',
    'Support Plan',
    'Goals',
    'Progress Review',
    'Support Receiver Needs and Rules',
  ]) {
    console.log(`\n=== ${tab} ===`);
    await clickTab(page, tab);
    const data = await extract(page);
    data.dropdowns = await captureDropdowns(page);
    report.tabs[tab] = data;
    report.allDropdowns.push(...data.dropdowns.map((d) => ({ ...d, tab })));
    console.log(`fields: ${data.fields.length}, cols: ${data.listColumns.join(' | ')}, rows: ${data.listRows.length}`);
    console.log(`body snippet: ${data.body.slice(0, 280)}`);

    if (data.listRows.length > 0) {
      await openFirstGridRow(page);
      const detail = await extract(page);
      detail.dropdowns = await captureDropdowns(page);
      report.tabs[`${tab} (detail)`] = detail;
      report.allDropdowns.push(...detail.dropdowns.map((d) => ({ ...d, tab: `${tab} (detail)` })));
      console.log(`detail fields: ${detail.fields.length}`);
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(1500);
      await clickTab(page, tab);
    }
  }

  await writeFile(OUT, JSON.stringify(report, null, 2));
  console.log('\nSaved', OUT);
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
