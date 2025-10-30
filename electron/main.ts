import { app, BrowserWindow, ipcMain, dialog, Menu, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import fs from 'fs';
import { SqliteDB } from './db';

function isDev() {
  return !!process.env.VITE_DEV_SERVER_URL;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  // Load app (dev or prod)
  if (isDev()) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL!);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    win.loadFile(indexPath);
  }
}

app.whenReady().then(() => {
  createWindow();
  setupMenu();
  setupAutoUpdate();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

const db = SqliteDB.getInstance();

// DB lifecycle
ipcMain.handle('db:ensure', () => db.ensureFile());
ipcMain.handle('db:open', () => db.open());
ipcMain.handle('db:close', () => db.close());
ipcMain.handle('db:reset', () => db.reset());

// Helpers
const list = (table: string) => () => db.list(table);
const getById = (table: string) => (_e: any, id: string) => db.getById(table, id);
const upsert = (table: string) => (_e: any, obj: any) => db.upsert(table, obj);
const del = (table: string) => (_e: any, id: string) => db.delete(table, id);
const updateFields = (table: string) => (_e: any, { id, patch }: any) => db.updateFields(table, id, patch);

// systemConfig
ipcMain.handle('db:systemConfig:get', (_e, id: string) => db.getById('systemConfig', id));
ipcMain.handle('db:systemConfig:put', (_e, cfg: any) => db.upsert('systemConfig', cfg));
ipcMain.handle('db:systemConfig:clear', () => db.delete('systemConfig', 'system-config'));

// Products
ipcMain.handle('db:products:list', list('products'));
ipcMain.handle('db:products:get', getById('products'));
ipcMain.handle('db:products:upsert', upsert('products'));
ipcMain.handle('db:products:delete', del('products'));

// Clients
ipcMain.handle('db:clients:list', list('clients'));
ipcMain.handle('db:clients:get', getById('clients'));
ipcMain.handle('db:clients:upsert', upsert('clients'));
ipcMain.handle('db:clients:delete', del('clients'));

// Transactions
ipcMain.handle('db:transactions:list', list('transactions'));
ipcMain.handle('db:transactions:get', getById('transactions'));
ipcMain.handle('db:transactions:upsert', upsert('transactions'));
ipcMain.handle('db:transactions:updateFields', updateFields('transactions'));
ipcMain.handle('db:transactions:delete', del('transactions'));

// Recurring Expenses
ipcMain.handle('db:recurring:list', list('recurringExpenses'));
ipcMain.handle('db:recurring:get', getById('recurringExpenses'));
ipcMain.handle('db:recurring:upsert', upsert('recurringExpenses'));
ipcMain.handle('db:recurring:delete', del('recurringExpenses'));

// Sales / Items
ipcMain.handle('db:sales:list', list('sales'));
ipcMain.handle('db:sales:get', getById('sales'));
ipcMain.handle('db:sales:upsert', upsert('sales'));
ipcMain.handle('db:sales:delete', del('sales'));
ipcMain.handle('db:saleItems:list', list('saleItems'));
ipcMain.handle('db:saleItems:upsert', upsert('saleItems'));
ipcMain.handle('db:saleItems:delete', del('saleItems'));

// Expenses
ipcMain.handle('db:expenses:list', list('expenses'));
ipcMain.handle('db:expenses:get', getById('expenses'));
ipcMain.handle('db:expenses:upsert', upsert('expenses'));
ipcMain.handle('db:expenses:delete', del('expenses'));

// Insights
ipcMain.handle('db:insights:list', list('insights'));
ipcMain.handle('db:insights:put', upsert('insights'));
ipcMain.handle('db:insights:add', upsert('insights'));

// Income
ipcMain.handle('db:income:list', list('income'));
ipcMain.handle('db:income:get', getById('income'));
ipcMain.handle('db:income:upsert', upsert('income'));
ipcMain.handle('db:income:delete', del('income'));

// Persons / Donors / Categories / Users
ipcMain.handle('db:persons:list', list('persons'));
ipcMain.handle('db:persons:get', getById('persons'));
ipcMain.handle('db:persons:upsert', upsert('persons'));
ipcMain.handle('db:persons:delete', del('persons'));
ipcMain.handle('db:donors:list', list('donors'));
ipcMain.handle('db:donors:upsert', upsert('donors'));
ipcMain.handle('db:donors:delete', del('donors'));
ipcMain.handle('db:finCats:list', list('financialCategories'));
ipcMain.handle('db:finCats:upsert', upsert('financialCategories'));
ipcMain.handle('db:finCats:delete', del('financialCategories'));
ipcMain.handle('db:users:list', list('systemUsers'));
ipcMain.handle('db:users:get', getById('systemUsers'));
ipcMain.handle('db:users:upsert', upsert('systemUsers'));
ipcMain.handle('db:users:delete', del('systemUsers'));

// Invitation Codes
ipcMain.handle('db:invites:add', (_e, code: any) => db.upsert('invitationCodes', code));
ipcMain.handle('db:invites:getByCode', (_e, code: string) => db.getById('invitationCodes', code) || db.list('invitationCodes').find(c => c.code === code));

// Subscription status
ipcMain.handle('db:subscription:get', (_e, id: string) => db.getById('subscriptionStatus', id));
ipcMain.handle('db:subscription:put', (_e, status: any) => db.upsert('subscriptionStatus', status));

// Sync metadata/data
ipcMain.handle('db:syncMeta:get', (_e, id: string) => db.getById('syncMetadata', id));
ipcMain.handle('db:syncMeta:put', (_e, m: any) => db.upsert('syncMetadata', m));
ipcMain.handle('db:syncMeta:update', (_e, { id, patch }: any) => db.updateFields('syncMetadata', id, patch));
ipcMain.handle('db:syncData:put', (_e, payload: any) => {
  const entries = [
    { id: `${payload.year}-sales`, year: payload.year, type: 'sales', date: new Date().toISOString(), data: JSON.stringify(payload.sales) },
    { id: `${payload.year}-income`, year: payload.year, type: 'income', date: new Date().toISOString(), data: JSON.stringify(payload.income) },
    { id: `${payload.year}-expenses`, year: payload.year, type: 'expenses', date: new Date().toISOString(), data: JSON.stringify(payload.expenses) },
    { id: `${payload.year}-insights`, year: payload.year, type: 'insights', date: new Date().toISOString(), data: JSON.stringify(payload.insights) },
  ];
  for (const e of entries) db.upsert('syncData', e);
});

// Backups
ipcMain.handle('db:backup:saveDialog', async () => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Salvar backup do banco (.db)',
    defaultPath: 'realm-system-backup.db',
    filters: [{ name: 'SQLite DB', extensions: ['db'] }]
  });
  if (canceled || !filePath) return null;
  fs.copyFileSync(db.getPath(), filePath);
  return filePath;
});

ipcMain.handle('db:backup:openDialog', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Restaurar backup do banco (.db)',
    filters: [{ name: 'SQLite DB', extensions: ['db'] }],
    properties: ['openFile']
  });
  if (canceled || !filePaths?.[0]) return false;
  const source = filePaths[0];
  db.close();
  fs.copyFileSync(source, db.getPath());
  db.open();
  return true;
});

ipcMain.handle('db:file:readBuffer', async () => {
  return fs.readFileSync(db.getPath()).buffer as ArrayBuffer;
});
function setupMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Application',
      submenu: [
        { label: 'About', click: () => shell.openExternal('https://example.com') },
        { label: 'Check for Updates', click: () => safeCheckForUpdates() },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function setupAutoUpdate() {
  if (isDev()) return;
  try {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.checkForUpdatesAndNotify();
  } catch (e) {
    console.error('AutoUpdate setup error:', e);
  }
}

function safeCheckForUpdates() {
  if (isDev()) {
    const w = BrowserWindow.getFocusedWindow();
    w?.webContents.send('app:update:dev', { message: 'Updates are disabled in dev.' });
    return;
  }
  try {
    autoUpdater.checkForUpdates();
  } catch (e) {
    console.error('Manual update check failed:', e);
  }
}
