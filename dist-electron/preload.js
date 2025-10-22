"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// This is a template preload exposing the DB API expected by SqliteEngine.
// Implement each IPC channel in the Electron main process using better-sqlite3 and schema.sql.
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // DB lifecycle
    ensureDbFile: () => electron_1.ipcRenderer.invoke('db:ensure'),
    openDb: () => electron_1.ipcRenderer.invoke('db:open'),
    closeDb: () => electron_1.ipcRenderer.invoke('db:close'),
    resetDbFile: () => electron_1.ipcRenderer.invoke('db:reset'),
    // System config
    readSystemConfig: (id) => electron_1.ipcRenderer.invoke('db:systemConfig:get', id),
    writeSystemConfig: (cfg) => electron_1.ipcRenderer.invoke('db:systemConfig:put', cfg),
    clearSystemConfig: () => electron_1.ipcRenderer.invoke('db:systemConfig:clear'),
    // Products
    listProducts: () => electron_1.ipcRenderer.invoke('db:products:list'),
    getProductById: (id) => electron_1.ipcRenderer.invoke('db:products:get', id),
    upsertProduct: (p) => electron_1.ipcRenderer.invoke('db:products:upsert', p),
    deleteProduct: (id) => electron_1.ipcRenderer.invoke('db:products:delete', id),
    // Clients
    listClients: () => electron_1.ipcRenderer.invoke('db:clients:list'),
    getClientById: (id) => electron_1.ipcRenderer.invoke('db:clients:get', id),
    upsertClient: (c) => electron_1.ipcRenderer.invoke('db:clients:upsert', c),
    deleteClient: (id) => electron_1.ipcRenderer.invoke('db:clients:delete', id),
    // Transactions
    listTransactions: () => electron_1.ipcRenderer.invoke('db:transactions:list'),
    getTransactionById: (id) => electron_1.ipcRenderer.invoke('db:transactions:get', id),
    upsertTransaction: (t) => electron_1.ipcRenderer.invoke('db:transactions:upsert', t),
    updateTransactionFields: (id, patch) => electron_1.ipcRenderer.invoke('db:transactions:updateFields', { id, patch }),
    deleteTransaction: (id) => electron_1.ipcRenderer.invoke('db:transactions:delete', id),
    // Recurring Expenses
    listRecurringExpenses: () => electron_1.ipcRenderer.invoke('db:recurring:list'),
    getRecurringExpenseById: (id) => electron_1.ipcRenderer.invoke('db:recurring:get', id),
    upsertRecurringExpense: (m) => electron_1.ipcRenderer.invoke('db:recurring:upsert', m),
    deleteRecurringExpense: (id) => electron_1.ipcRenderer.invoke('db:recurring:delete', id),
    // Sales / Items
    listSales: () => electron_1.ipcRenderer.invoke('db:sales:list'),
    getSaleById: (id) => electron_1.ipcRenderer.invoke('db:sales:get', id),
    upsertSale: (s) => electron_1.ipcRenderer.invoke('db:sales:upsert', s),
    deleteSale: (id) => electron_1.ipcRenderer.invoke('db:sales:delete', id),
    listSaleItems: () => electron_1.ipcRenderer.invoke('db:saleItems:list'),
    upsertSaleItem: (i) => electron_1.ipcRenderer.invoke('db:saleItems:upsert', i),
    deleteSaleItem: (id) => electron_1.ipcRenderer.invoke('db:saleItems:delete', id),
    // Expenses
    listExpenses: () => electron_1.ipcRenderer.invoke('db:expenses:list'),
    getExpenseById: (id) => electron_1.ipcRenderer.invoke('db:expenses:get', id),
    upsertExpense: (e) => electron_1.ipcRenderer.invoke('db:expenses:upsert', e),
    deleteExpense: (id) => electron_1.ipcRenderer.invoke('db:expenses:delete', id),
    // Insights
    listInsights: () => electron_1.ipcRenderer.invoke('db:insights:list'),
    putInsight: (i) => electron_1.ipcRenderer.invoke('db:insights:put', i),
    addInsight: (i) => electron_1.ipcRenderer.invoke('db:insights:add', i),
    // Income
    listIncome: () => electron_1.ipcRenderer.invoke('db:income:list'),
    getIncomeById: (id) => electron_1.ipcRenderer.invoke('db:income:get', id),
    upsertIncome: (i) => electron_1.ipcRenderer.invoke('db:income:upsert', i),
    deleteIncome: (id) => electron_1.ipcRenderer.invoke('db:income:delete', id),
    // Persons / Donors / Categories / Users
    listPersons: () => electron_1.ipcRenderer.invoke('db:persons:list'),
    getPersonById: (id) => electron_1.ipcRenderer.invoke('db:persons:get', id),
    upsertPerson: (p) => electron_1.ipcRenderer.invoke('db:persons:upsert', p),
    deletePerson: (id) => electron_1.ipcRenderer.invoke('db:persons:delete', id),
    listDonors: () => electron_1.ipcRenderer.invoke('db:donors:list'),
    upsertDonor: (d) => electron_1.ipcRenderer.invoke('db:donors:upsert', d),
    deleteDonor: (id) => electron_1.ipcRenderer.invoke('db:donors:delete', id),
    listFinancialCategories: () => electron_1.ipcRenderer.invoke('db:finCats:list'),
    upsertFinancialCategory: (c) => electron_1.ipcRenderer.invoke('db:finCats:upsert', c),
    deleteFinancialCategory: (id) => electron_1.ipcRenderer.invoke('db:finCats:delete', id),
    listSystemUsers: () => electron_1.ipcRenderer.invoke('db:users:list'),
    getSystemUserById: (id) => electron_1.ipcRenderer.invoke('db:users:get', id),
    upsertSystemUser: (u) => electron_1.ipcRenderer.invoke('db:users:upsert', u),
    deleteSystemUser: (id) => electron_1.ipcRenderer.invoke('db:users:delete', id),
    // Invitation codes
    addInvitationCode: (c) => electron_1.ipcRenderer.invoke('db:invites:add', c),
    getInvitationCodeByCode: (code) => electron_1.ipcRenderer.invoke('db:invites:getByCode', code),
    // Subscription status
    getSubscriptionStatus: (id) => electron_1.ipcRenderer.invoke('db:subscription:get', id),
    putSubscriptionStatus: (s) => electron_1.ipcRenderer.invoke('db:subscription:put', s),
    // Sync metadata/data for Sheets
    getSyncMetadata: (id) => electron_1.ipcRenderer.invoke('db:syncMeta:get', id),
    putSyncMetadata: (m) => electron_1.ipcRenderer.invoke('db:syncMeta:put', m),
    updateSyncMetadata: (id, patch) => electron_1.ipcRenderer.invoke('db:syncMeta:update', { id, patch }),
    putSyncData: (payload) => electron_1.ipcRenderer.invoke('db:syncData:put', payload),
    // Backups
    backupDbToLocal: () => electron_1.ipcRenderer.invoke('db:backup:saveDialog'),
    restoreDbFromLocal: () => electron_1.ipcRenderer.invoke('db:backup:openDialog'),
    readDbFileBuffer: () => electron_1.ipcRenderer.invoke('db:file:readBuffer'),
});
