"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const electron_updater_1 = require("electron-updater");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const db_1 = require("./db");
function isDev() {
    return !!process.env.VITE_DEV_SERVER_URL;
}
function createWindow() {
    const win = new electron_1.BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
        },
    });
    // Load app (dev or prod)
    if (isDev()) {
        win.loadURL(process.env.VITE_DEV_SERVER_URL);
        win.webContents.openDevTools({ mode: 'detach' });
    }
    else {
        const indexPath = path_1.default.join(__dirname, '../dist/index.html');
        win.loadFile(indexPath);
    }
}
electron_1.app.whenReady().then(() => {
    createWindow();
    setupMenu();
    setupAutoUpdate();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
const db = db_1.SqliteDB.getInstance();
// DB lifecycle
electron_1.ipcMain.handle('db:ensure', () => db.ensureFile());
electron_1.ipcMain.handle('db:open', () => db.open());
electron_1.ipcMain.handle('db:close', () => db.close());
electron_1.ipcMain.handle('db:reset', () => db.reset());
// Helpers
const list = (table) => () => db.list(table);
const getById = (table) => (_e, id) => db.getById(table, id);
const upsert = (table) => (_e, obj) => db.upsert(table, obj);
const del = (table) => (_e, id) => db.delete(table, id);
const updateFields = (table) => (_e, { id, patch }) => db.updateFields(table, id, patch);
// systemConfig
electron_1.ipcMain.handle('db:systemConfig:get', (_e, id) => db.getById('systemConfig', id));
electron_1.ipcMain.handle('db:systemConfig:put', (_e, cfg) => db.upsert('systemConfig', cfg));
electron_1.ipcMain.handle('db:systemConfig:clear', () => db.delete('systemConfig', 'system-config'));
// Products
electron_1.ipcMain.handle('db:products:list', list('products'));
electron_1.ipcMain.handle('db:products:get', getById('products'));
electron_1.ipcMain.handle('db:products:upsert', upsert('products'));
electron_1.ipcMain.handle('db:products:delete', del('products'));
// Clients
electron_1.ipcMain.handle('db:clients:list', list('clients'));
electron_1.ipcMain.handle('db:clients:get', getById('clients'));
electron_1.ipcMain.handle('db:clients:upsert', upsert('clients'));
electron_1.ipcMain.handle('db:clients:delete', del('clients'));
// Transactions
electron_1.ipcMain.handle('db:transactions:list', list('transactions'));
electron_1.ipcMain.handle('db:transactions:get', getById('transactions'));
electron_1.ipcMain.handle('db:transactions:upsert', upsert('transactions'));
electron_1.ipcMain.handle('db:transactions:updateFields', updateFields('transactions'));
electron_1.ipcMain.handle('db:transactions:delete', del('transactions'));
// Recurring Expenses
electron_1.ipcMain.handle('db:recurring:list', list('recurringExpenses'));
electron_1.ipcMain.handle('db:recurring:get', getById('recurringExpenses'));
electron_1.ipcMain.handle('db:recurring:upsert', upsert('recurringExpenses'));
electron_1.ipcMain.handle('db:recurring:delete', del('recurringExpenses'));
// Sales / Items
electron_1.ipcMain.handle('db:sales:list', list('sales'));
electron_1.ipcMain.handle('db:sales:get', getById('sales'));
electron_1.ipcMain.handle('db:sales:upsert', upsert('sales'));
electron_1.ipcMain.handle('db:sales:delete', del('sales'));
electron_1.ipcMain.handle('db:saleItems:list', list('saleItems'));
electron_1.ipcMain.handle('db:saleItems:upsert', upsert('saleItems'));
electron_1.ipcMain.handle('db:saleItems:delete', del('saleItems'));
// Expenses
electron_1.ipcMain.handle('db:expenses:list', list('expenses'));
electron_1.ipcMain.handle('db:expenses:get', getById('expenses'));
electron_1.ipcMain.handle('db:expenses:upsert', upsert('expenses'));
electron_1.ipcMain.handle('db:expenses:delete', del('expenses'));
// Insights
electron_1.ipcMain.handle('db:insights:list', list('insights'));
electron_1.ipcMain.handle('db:insights:put', upsert('insights'));
electron_1.ipcMain.handle('db:insights:add', upsert('insights'));
// Income
electron_1.ipcMain.handle('db:income:list', list('income'));
electron_1.ipcMain.handle('db:income:get', getById('income'));
electron_1.ipcMain.handle('db:income:upsert', upsert('income'));
electron_1.ipcMain.handle('db:income:delete', del('income'));
// Persons / Donors / Categories / Users
electron_1.ipcMain.handle('db:persons:list', list('persons'));
electron_1.ipcMain.handle('db:persons:get', getById('persons'));
electron_1.ipcMain.handle('db:persons:upsert', upsert('persons'));
electron_1.ipcMain.handle('db:persons:delete', del('persons'));
electron_1.ipcMain.handle('db:donors:list', list('donors'));
electron_1.ipcMain.handle('db:donors:upsert', upsert('donors'));
electron_1.ipcMain.handle('db:donors:delete', del('donors'));
electron_1.ipcMain.handle('db:finCats:list', list('financialCategories'));
electron_1.ipcMain.handle('db:finCats:upsert', upsert('financialCategories'));
electron_1.ipcMain.handle('db:finCats:delete', del('financialCategories'));
electron_1.ipcMain.handle('db:users:list', list('systemUsers'));
electron_1.ipcMain.handle('db:users:get', getById('systemUsers'));
electron_1.ipcMain.handle('db:users:upsert', upsert('systemUsers'));
electron_1.ipcMain.handle('db:users:delete', del('systemUsers'));
// Invitation Codes
electron_1.ipcMain.handle('db:invites:add', (_e, code) => db.upsert('invitationCodes', code));
electron_1.ipcMain.handle('db:invites:getByCode', (_e, code) => db.getById('invitationCodes', code) || db.list('invitationCodes').find(c => c.code === code));
// Subscription status
electron_1.ipcMain.handle('db:subscription:get', (_e, id) => db.getById('subscriptionStatus', id));
electron_1.ipcMain.handle('db:subscription:put', (_e, status) => db.upsert('subscriptionStatus', status));
// Sync metadata/data
electron_1.ipcMain.handle('db:syncMeta:get', (_e, id) => db.getById('syncMetadata', id));
electron_1.ipcMain.handle('db:syncMeta:put', (_e, m) => db.upsert('syncMetadata', m));
electron_1.ipcMain.handle('db:syncMeta:update', (_e, { id, patch }) => db.updateFields('syncMetadata', id, patch));
electron_1.ipcMain.handle('db:syncData:put', (_e, payload) => {
    const entries = [
        { id: `${payload.year}-sales`, year: payload.year, type: 'sales', date: new Date().toISOString(), data: JSON.stringify(payload.sales) },
        { id: `${payload.year}-income`, year: payload.year, type: 'income', date: new Date().toISOString(), data: JSON.stringify(payload.income) },
        { id: `${payload.year}-expenses`, year: payload.year, type: 'expenses', date: new Date().toISOString(), data: JSON.stringify(payload.expenses) },
        { id: `${payload.year}-insights`, year: payload.year, type: 'insights', date: new Date().toISOString(), data: JSON.stringify(payload.insights) },
    ];
    for (const e of entries)
        db.upsert('syncData', e);
});
// Backups
electron_1.ipcMain.handle('db:backup:saveDialog', async () => {
    const { canceled, filePath } = await electron_1.dialog.showSaveDialog({
        title: 'Salvar backup do banco (.db)',
        defaultPath: 'realm-system-backup.db',
        filters: [{ name: 'SQLite DB', extensions: ['db'] }]
    });
    if (canceled || !filePath)
        return null;
    fs_1.default.copyFileSync(db.getPath(), filePath);
    return filePath;
});
electron_1.ipcMain.handle('db:backup:openDialog', async () => {
    const { canceled, filePaths } = await electron_1.dialog.showOpenDialog({
        title: 'Restaurar backup do banco (.db)',
        filters: [{ name: 'SQLite DB', extensions: ['db'] }],
        properties: ['openFile']
    });
    if (canceled || !filePaths?.[0])
        return false;
    const source = filePaths[0];
    db.close();
    fs_1.default.copyFileSync(source, db.getPath());
    db.open();
    return true;
});
electron_1.ipcMain.handle('db:file:readBuffer', async () => {
    return fs_1.default.readFileSync(db.getPath()).buffer;
});
function setupMenu() {
    const template = [
        {
            label: 'Application',
            submenu: [
                { label: 'About', click: () => electron_1.shell.openExternal('https://example.com') },
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
    const menu = electron_1.Menu.buildFromTemplate(template);
    electron_1.Menu.setApplicationMenu(menu);
}
function setupAutoUpdate() {
    if (isDev())
        return;
    try {
        electron_updater_1.autoUpdater.autoDownload = true;
        electron_updater_1.autoUpdater.autoInstallOnAppQuit = true;
        electron_updater_1.autoUpdater.checkForUpdatesAndNotify();
    }
    catch (e) {
        console.error('AutoUpdate setup error:', e);
    }
}
function safeCheckForUpdates() {
    if (isDev()) {
        const w = electron_1.BrowserWindow.getFocusedWindow();
        w?.webContents.send('app:update:dev', { message: 'Updates are disabled in dev.' });
        return;
    }
    try {
        electron_updater_1.autoUpdater.checkForUpdates();
    }
    catch (e) {
        console.error('Manual update check failed:', e);
    }
}
