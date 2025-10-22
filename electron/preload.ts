import { contextBridge, ipcRenderer } from 'electron';

// This is a template preload exposing the DB API expected by SqliteEngine.
// Implement each IPC channel in the Electron main process using better-sqlite3 and schema.sql.

contextBridge.exposeInMainWorld('electronAPI', {
  // DB lifecycle
  ensureDbFile: () => ipcRenderer.invoke('db:ensure'),
  openDb: () => ipcRenderer.invoke('db:open'),
  closeDb: () => ipcRenderer.invoke('db:close'),
  resetDbFile: () => ipcRenderer.invoke('db:reset'),

  // System config
  readSystemConfig: (id: string) => ipcRenderer.invoke('db:systemConfig:get', id),
  writeSystemConfig: (cfg: any) => ipcRenderer.invoke('db:systemConfig:put', cfg),
  clearSystemConfig: () => ipcRenderer.invoke('db:systemConfig:clear'),

  // Products
  listProducts: () => ipcRenderer.invoke('db:products:list'),
  getProductById: (id: string) => ipcRenderer.invoke('db:products:get', id),
  upsertProduct: (p: any) => ipcRenderer.invoke('db:products:upsert', p),
  deleteProduct: (id: string) => ipcRenderer.invoke('db:products:delete', id),

  // Clients
  listClients: () => ipcRenderer.invoke('db:clients:list'),
  getClientById: (id: string) => ipcRenderer.invoke('db:clients:get', id),
  upsertClient: (c: any) => ipcRenderer.invoke('db:clients:upsert', c),
  deleteClient: (id: string) => ipcRenderer.invoke('db:clients:delete', id),

  // Transactions
  listTransactions: () => ipcRenderer.invoke('db:transactions:list'),
  getTransactionById: (id: string) => ipcRenderer.invoke('db:transactions:get', id),
  upsertTransaction: (t: any) => ipcRenderer.invoke('db:transactions:upsert', t),
  updateTransactionFields: (id: string, patch: any) => ipcRenderer.invoke('db:transactions:updateFields', { id, patch }),
  deleteTransaction: (id: string) => ipcRenderer.invoke('db:transactions:delete', id),

  // Recurring Expenses
  listRecurringExpenses: () => ipcRenderer.invoke('db:recurring:list'),
  getRecurringExpenseById: (id: string) => ipcRenderer.invoke('db:recurring:get', id),
  upsertRecurringExpense: (m: any) => ipcRenderer.invoke('db:recurring:upsert', m),
  deleteRecurringExpense: (id: string) => ipcRenderer.invoke('db:recurring:delete', id),

  // Sales / Items
  listSales: () => ipcRenderer.invoke('db:sales:list'),
  getSaleById: (id: string) => ipcRenderer.invoke('db:sales:get', id),
  upsertSale: (s: any) => ipcRenderer.invoke('db:sales:upsert', s),
  deleteSale: (id: string) => ipcRenderer.invoke('db:sales:delete', id),
  listSaleItems: () => ipcRenderer.invoke('db:saleItems:list'),
  upsertSaleItem: (i: any) => ipcRenderer.invoke('db:saleItems:upsert', i),
  deleteSaleItem: (id: string) => ipcRenderer.invoke('db:saleItems:delete', id),

  // Expenses
  listExpenses: () => ipcRenderer.invoke('db:expenses:list'),
  getExpenseById: (id: string) => ipcRenderer.invoke('db:expenses:get', id),
  upsertExpense: (e: any) => ipcRenderer.invoke('db:expenses:upsert', e),
  deleteExpense: (id: string) => ipcRenderer.invoke('db:expenses:delete', id),

  // Insights
  listInsights: () => ipcRenderer.invoke('db:insights:list'),
  putInsight: (i: any) => ipcRenderer.invoke('db:insights:put', i),
  addInsight: (i: any) => ipcRenderer.invoke('db:insights:add', i),

  // Income
  listIncome: () => ipcRenderer.invoke('db:income:list'),
  getIncomeById: (id: string) => ipcRenderer.invoke('db:income:get', id),
  upsertIncome: (i: any) => ipcRenderer.invoke('db:income:upsert', i),
  deleteIncome: (id: string) => ipcRenderer.invoke('db:income:delete', id),

  // Persons / Donors / Categories / Users
  listPersons: () => ipcRenderer.invoke('db:persons:list'),
  getPersonById: (id: string) => ipcRenderer.invoke('db:persons:get', id),
  upsertPerson: (p: any) => ipcRenderer.invoke('db:persons:upsert', p),
  deletePerson: (id: string) => ipcRenderer.invoke('db:persons:delete', id),
  listDonors: () => ipcRenderer.invoke('db:donors:list'),
  upsertDonor: (d: any) => ipcRenderer.invoke('db:donors:upsert', d),
  deleteDonor: (id: string) => ipcRenderer.invoke('db:donors:delete', id),
  listFinancialCategories: () => ipcRenderer.invoke('db:finCats:list'),
  upsertFinancialCategory: (c: any) => ipcRenderer.invoke('db:finCats:upsert', c),
  deleteFinancialCategory: (id: string) => ipcRenderer.invoke('db:finCats:delete', id),
  listSystemUsers: () => ipcRenderer.invoke('db:users:list'),
  getSystemUserById: (id: string) => ipcRenderer.invoke('db:users:get', id),
  upsertSystemUser: (u: any) => ipcRenderer.invoke('db:users:upsert', u),
  deleteSystemUser: (id: string) => ipcRenderer.invoke('db:users:delete', id),

  // Invitation codes
  addInvitationCode: (c: any) => ipcRenderer.invoke('db:invites:add', c),
  getInvitationCodeByCode: (code: string) => ipcRenderer.invoke('db:invites:getByCode', code),

  // Subscription status
  getSubscriptionStatus: (id: string) => ipcRenderer.invoke('db:subscription:get', id),
  putSubscriptionStatus: (s: any) => ipcRenderer.invoke('db:subscription:put', s),

  // Sync metadata/data for Sheets
  getSyncMetadata: (id: string) => ipcRenderer.invoke('db:syncMeta:get', id),
  putSyncMetadata: (m: any) => ipcRenderer.invoke('db:syncMeta:put', m),
  updateSyncMetadata: (id: string, patch: any) => ipcRenderer.invoke('db:syncMeta:update', { id, patch }),
  putSyncData: (payload: any) => ipcRenderer.invoke('db:syncData:put', payload),

  // Backups
  backupDbToLocal: () => ipcRenderer.invoke('db:backup:saveDialog'),
  restoreDbFromLocal: () => ipcRenderer.invoke('db:backup:openDialog'),
  readDbFileBuffer: () => ipcRenderer.invoke('db:file:readBuffer'),
});

