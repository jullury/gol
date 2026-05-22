import { getDatabase } from './database';

interface AppSetting {
  key: string;
  value: string;
}

export async function getSetting(key: string): Promise<string | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<AppSetting>(
    'SELECT value FROM app_settings WHERE key = ?',
    [key],
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', [
    key,
    value,
  ]);
}
