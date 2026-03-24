import { chromium } from 'playwright';

const baseUrl = 'https://umtelkomd-finance.web.app';
const email = process.env.QA_EMAIL;
const password = process.env.QA_PASSWORD;

if (!email || !password) {
  console.error('Missing QA_EMAIL or QA_PASSWORD');
  process.exit(1);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1100 },
  acceptDownloads: true,
});
const page = await context.newPage();

const results = [];

const saveArtifacts = async (name) => {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const path = '/Users/jarl/Dev/fincontrol/test-results/' + slug + '.png';
  await page.screenshot({ path, fullPage: true });
  return path;
};

const record = async (name, fn) => {
  try {
    console.log('START', name);
    await fn();
    results.push({ name, status: 'pass' });
    console.log('PASS', name);
  } catch (error) {
    const screenshot = await saveArtifacts(name).catch(() => null);
    results.push({
      name,
      status: 'fail',
      error: error?.message?.split('\n')[0] || String(error),
      screenshot,
      url: page.url(),
    });
    console.log('FAIL', name, error?.message?.split('\n')[0] || String(error));
  }
};

const login = async () => {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});

  const emailInput = page.locator('input[type="email"]');
  if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await emailInput.fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
  }

  await page.getByText('Inicio operativo', { exact: false }).waitFor({ state: 'visible', timeout: 30000 });
};

await login();

await record('launcher opens and closes', async () => {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
  const trigger = page.getByRole('button', { name: 'Nuevo registro' });
  await trigger.waitFor({ state: 'visible', timeout: 20000 });
  await trigger.click();
  await page.getByText('Centro de tesoreria', { exact: false }).waitFor({ state: 'visible', timeout: 30000 });
  await page.getByText('Registrar cobro', { exact: false }).first().waitFor({ state: 'visible', timeout: 30000 });
  await page.getByRole('button', { name: 'Cerrar centro de tesoreria' }).click();
  await page.getByText('Centro de tesoreria', { exact: false }).waitFor({ state: 'hidden', timeout: 15000 });
});

await record('cxc abono modal opens and closes', async () => {
  await page.goto(baseUrl + '/cxc', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
  const abono = page.getByRole('button', { name: 'Abono' }).first();
  await abono.waitFor({ state: 'visible', timeout: 20000 });
  await abono.click();
  await page.locator('h3').filter({ hasText: 'Registrar Pago' }).first().waitFor({ state: 'visible', timeout: 30000 });
  await page.getByText('Monto del pago', { exact: false }).waitFor({ state: 'visible', timeout: 30000 });
  await page.getByRole('button', { name: 'Cerrar registro de pago' }).click();
  await page.locator('h3').filter({ hasText: 'Registrar Pago' }).first().waitFor({ state: 'hidden', timeout: 15000 });
});

await record('cxp abono modal opens and closes', async () => {
  await page.goto(baseUrl + '/cxp', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
  const abono = page.getByRole('button', { name: 'Abono' }).first();
  await abono.waitFor({ state: 'visible', timeout: 20000 });
  await abono.click();
  await page.locator('h3').filter({ hasText: 'Registrar Pago' }).first().waitFor({ state: 'visible', timeout: 30000 });
  await page.getByText('Monto del pago', { exact: false }).waitFor({ state: 'visible', timeout: 30000 });
  await page.getByRole('button', { name: 'Cerrar registro de pago' }).click();
  await page.locator('h3').filter({ hasText: 'Registrar Pago' }).first().waitFor({ state: 'hidden', timeout: 15000 });
});

await record('report export triggers download', async () => {
  await page.goto(baseUrl + '/reportes', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
  await page.getByRole('button', { name: 'Estado de Resultados' }).click();
  await page.getByText('Estado de resultados operativo', { exact: false }).waitFor({ state: 'visible', timeout: 20000 });
  const exportButton = page.getByRole('button', { name: 'Exportar PDF' }).first();
  await exportButton.waitFor({ state: 'visible', timeout: 20000 });
  const downloadPromise = page.waitForEvent('download', { timeout: 90000 });
  await exportButton.click();
  const download = await downloadPromise;
  const suggestedFilename = download.suggestedFilename();
  if (!suggestedFilename.endsWith('.pdf')) {
    throw new Error('Unexpected download: ' + suggestedFilename);
  }
});

console.log(JSON.stringify(results, null, 2));
const failed = results.filter((entry) => entry.status === 'fail');
await browser.close();

if (failed.length > 0) {
  process.exitCode = 1;
}
