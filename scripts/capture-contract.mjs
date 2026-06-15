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
    const allTabs = [...document.querySelectorAll('.z-tab')].map((t) => clean(t.textContent)).filter(Boolean);
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
    return { activeTab, allTabs, fields, listColumns, listRows, body: clean(document.body.innerText).slice(0, 40000) };
  });
}

async function captureDropdowns(page, tab) {
  const out = [];
  for (const combo of await page.locator('.z-combobox:visible').all()) {
    const input = combo.locator('input').first();
    const h = await input.elementHandle().catch(() => null);
    if (!h) continue;
    const field = await page.evaluate(
      (el) => el.closest('tr')?.querySelector('.z-label')?.textContent?.trim() || el.getAttribute('title') || '',
      h
    );
    if (!field) continue;
    try {
      await combo.locator('.z-combobox-button').click({ timeout: 2000 });
      await page.waitForTimeout(500);
      const options = [
        ...new Set(
          (await page.locator('.z-combobox-popup:visible .z-comboitem').allInnerTexts())
            .map((o) => o.trim())
            .filter(Boolean)
        ),
      ];
      await page.keyboard.press('Escape');
      await page.waitForTimeout(150);
      if (options.length) out.push({ tab, field, options });
    } catch {
      /* skip */
    }
  }
  return out;
}

async function openWindowBySearch(page, query) {
  const search = page.locator('input.z-bandbox-input').first();
  await search.click();
  await search.fill('');
  await search.type(query, { delay: 25 });
  await page.waitForTimeout(2500);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(10000);
}

async function openWindowByTree(page, pattern) {
  const opened = await page.evaluate((reSource) => {
    const re = new RegExp(reSource, 'i');
    const nodes = [...document.querySelectorAll('.z-treecell-text')];
    const target = nodes.find((n) => re.test(n.textContent || ''));
    if (!target) return null;
    target.scrollIntoView({ block: 'center' });
    const cell = target.closest('.z-treecell') || target;
    cell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, view: window }));
    return target.textContent?.trim();
  }, pattern);
  if (opened) await page.waitForTimeout(10000);
  return opened;
}

async function openFirstRecord(page) {
  await page.evaluate(() => {
    const row = document.querySelector('.z-listbox-body .z-listitem');
    row?.scrollIntoView({ block: 'center' });
    row?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, view: window }));
  });
  await page.waitForTimeout(6000);
}

async function captureAllTabs(page, report, prefix) {
  report.tabs = {};
  report.allDropdowns = [];

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

    const key = name.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    await page.screenshot({ path: path.join(OUT_DIR, `${prefix}-${key}.png`), fullPage: true });

    const data = await extract(page);
    data.dropdowns = await captureDropdowns(page, name);
    report.tabs[name] = data;
    report.allDropdowns.push(...data.dropdowns);
    console.log(`Tab "${name}": ${data.fields.length} fields, ${data.dropdowns.length} dropdowns`);
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1680, height: 1200 } });
  const report = { capturedAt: new Date().toISOString(), attempts: [] };

  await login(page);

  const queries = ['Contract', 'Contracts', 'Service Contract', 'NDIS Contract', 'Support Contract'];
  for (const query of queries) {
    console.log('Trying menu search:', query);
    await openWindowBySearch(page, query);
    const snap = await extract(page);
    report.attempts.push({ method: 'search', query, tabs: snap.allTabs, bodySnippet: snap.body.slice(0, 500) });
    if (/contract/i.test(snap.body) && snap.allTabs.some((t) => /contract/i.test(t) || t.length > 2)) {
      report.windowName = query;
      report.list = snap;
      break;
    }
  }

  if (!report.list) {
    const treeHit = await openWindowByTree(page, 'contract');
    const snap = await extract(page);
    report.attempts.push({ method: 'tree', query: treeHit, tabs: snap.allTabs });
    if (treeHit) {
      report.windowName = treeHit;
      report.list = snap;
    }
  }

  if (!report.list) {
    console.log('Could not open contract window via search/tree');
    await page.screenshot({ path: path.join(OUT_DIR, '80-contract-search-fail.png'), fullPage: true });
    await writeFile(path.join(OUT_DIR, 'contract-capture.json'), JSON.stringify(report, null, 2));
    await browser.close();
    process.exit(1);
  }

  await page.screenshot({ path: path.join(OUT_DIR, '80-contract-list.png'), fullPage: true });
  console.log('List columns:', report.list.listColumns);

  const hasGrid = report.list.listColumns.length > 0 || /document|contract|start date|end date/i.test(report.list.body);
  if (hasGrid) {
    await openFirstRecord(page);
    await page.screenshot({ path: path.join(OUT_DIR, '81-contract-record.png'), fullPage: true });
    report.record = await extract(page);
    await captureAllTabs(page, report, '82');
  } else {
    report.record = report.list;
    await captureAllTabs(page, report, '82');
  }

  await writeFile(path.join(OUT_DIR, 'contract-capture.json'), JSON.stringify(report, null, 2));
  console.log('Done. Window:', report.windowName, 'Tabs:', Object.keys(report.tabs || {}).join(', '));
  await browser.close();
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
