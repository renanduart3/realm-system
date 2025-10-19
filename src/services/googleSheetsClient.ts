// Thin wrapper around gapi Sheets and Drive APIs
declare const gapi: any;

export async function createSpreadsheet(title: string): Promise<string> {
  const res = await gapi.client.sheets.spreadsheets.create({
    properties: { title },
  });
  return res.result.spreadsheetId as string;
}

export async function getSpreadsheet(spreadsheetId: string): Promise<any> {
  const res = await gapi.client.sheets.spreadsheets.get({ spreadsheetId });
  return res.result;
}

export async function addSheetIfMissing(spreadsheetId: string, sheetTitle: string): Promise<void> {
  const res = await gapi.client.sheets.spreadsheets.get({ spreadsheetId });
  const exists = (res.result.sheets || []).some((s: any) => s.properties?.title === sheetTitle);
  if (!exists) {
    await gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requests: [
        { addSheet: { properties: { title: sheetTitle } } }
      ]
    });
  }
}

export async function clearSheet(spreadsheetId: string, sheetTitle: string): Promise<void> {
  await gapi.client.sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${sheetTitle}!A:ZZZ`,
  });
}

export async function writeSheet(spreadsheetId: string, sheetTitle: string, headers: string[], rows: (string|number|boolean|null)[][]): Promise<void> {
  const values = [headers, ...rows];
  await gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetTitle}!A1`,
    valueInputOption: 'RAW',
  }, {
    range: `${sheetTitle}!A1`,
    majorDimension: 'ROWS',
    values,
  });
}

