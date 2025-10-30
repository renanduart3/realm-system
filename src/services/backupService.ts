import { appConfig } from '../config/app.config';
import { getDbEngine } from '../db/engine';
import { exportDatabase, downloadJsonDump, importDatabase } from '../utils/dbBackup';

declare const gapi: any;

function isSqliteEngine(): boolean {
  return (appConfig as any).dbEngine === 'sqlite';
}

// JSON fallback (IndexedDB)
export async function backupJson(): Promise<void> {
  const dump = await exportDatabase();
  downloadJsonDump(dump);
}

export async function restoreJsonFromFile(file: File): Promise<void> {
  const text = await file.text();
  await importDatabase(JSON.parse(text));
}

// Electron SQLite: Local filesystem backup/restore
export async function backupSqliteToLocal(): Promise<string | null> {
  if (!isSqliteEngine()) throw new Error('Not using sqlite engine');
  const api = (window as any).electronAPI;
  if (!api?.backupDbToLocal) throw new Error('Electron backupDbToLocal not available');
  const savedPath = await api.backupDbToLocal();
  return savedPath || null;
}

export async function restoreSqliteFromLocal(): Promise<boolean> {
  if (!isSqliteEngine()) throw new Error('Not using sqlite engine');
  const api = (window as any).electronAPI;
  if (!api?.restoreDbFromLocal) throw new Error('Electron restoreDbFromLocal not available');
  return await api.restoreDbFromLocal();
}

// Electron SQLite: Google Drive backup
export async function backupSqliteToGoogleDrive(): Promise<string> {
  if (!isSqliteEngine()) throw new Error('Not using sqlite engine');
  const { initGapi, ensureSignedIn } = await import('./googleAuth');
  await initGapi();
  await ensureSignedIn();

  const api = (window as any).electronAPI;
  if (!api?.readDbFileBuffer) throw new Error('Electron readDbFileBuffer not available');
  const arrayBuffer: ArrayBuffer = await api.readDbFileBuffer();
  const fileName = `realm-system-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.db`;

  const metadata = {
    name: fileName,
    mimeType: 'application/octet-stream',
  };
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelim = `\r\n--${boundary}--`;
  const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/octet-stream\r\n' +
    'Content-Transfer-Encoding: base64\r\n\r\n' +
    base64Data +
    closeDelim;

  const response = await gapi.client.request({
    path: '/upload/drive/v3/files',
    method: 'POST',
    params: { uploadType: 'multipart' },
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body: multipartRequestBody,
  });
  return response.result?.id as string;
}

