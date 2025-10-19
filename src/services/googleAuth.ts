// Lightweight Google API client loader and OAuth helper
// Requires Vite env vars: VITE_GOOGLE_CLIENT_ID (mandatory), VITE_GOOGLE_API_KEY (optional)

declare const gapi: any;

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const DISCOVERY_DOCS = [
  'https://sheets.googleapis.com/$discovery/rest?version=v4',
  'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
];
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';

let gapiLoaded = false;
let gapiInitDone = false;

export async function loadGapi(): Promise<void> {
  if (gapiLoaded) return;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Falha ao carregar gapi'));
    document.head.appendChild(script);
  });
  gapiLoaded = true;
}

export async function initGapi(): Promise<void> {
  if (gapiInitDone) return;
  if (!CLIENT_ID) throw new Error('VITE_GOOGLE_CLIENT_ID não configurado.');
  await loadGapi();
  await new Promise<void>((resolve, reject) => {
    gapi.load('client:auth2', async () => {
      try {
        await gapi.client.init({
          apiKey: API_KEY || undefined,
          clientId: CLIENT_ID,
          discoveryDocs: DISCOVERY_DOCS,
          scope: SCOPES,
        });
        gapiInitDone = true;
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  });
}

export async function ensureSignedIn(): Promise<any> {
  await initGapi();
  const auth = gapi.auth2.getAuthInstance();
  if (!auth.isSignedIn.get()) {
    await auth.signIn();
  }
  return auth.currentUser.get();
}

export function getAccessToken(): string | null {
  try {
    const auth = gapi.auth2.getAuthInstance();
    const user = auth.currentUser.get();
    const token = user.getAuthResponse(true)?.access_token;
    return token || null;
  } catch {
    return null;
  }
}

export function isSignedIn(): boolean {
  try {
    const auth = gapi.auth2.getAuthInstance();
    return auth.isSignedIn.get();
  } catch {
    return false;
  }
}

