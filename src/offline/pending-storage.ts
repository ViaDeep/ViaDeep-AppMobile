import {
  copyAsync,
  deleteAsync,
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
  readAsStringAsync,
  writeAsStringAsync,
} from 'expo-file-system/legacy';

import type { PendingStorage } from './pending-reports';

// Se usa la carpeta de documentos de la app y no la caché: el sistema puede borrar la caché (y con ella la foto).
const FOLDER = `${documentDirectory ?? ''}pending-reports/`;
const LIST_FILE = `${FOLDER}reports.json`;

async function ensureFolder() {
  const info = await getInfoAsync(FOLDER);
  if (!info.exists) await makeDirectoryAsync(FOLDER, { intermediates: true });
}

export const fileStorage: PendingStorage = {
  async read() {
    const info = await getInfoAsync(LIST_FILE);
    return info.exists ? readAsStringAsync(LIST_FILE) : null;
  },
  async write(contents) {
    await ensureFolder();
    await writeAsStringAsync(LIST_FILE, contents);
  },
};

/** Copia la foto a la carpeta de pendientes para que siga ahí cuando el ciudadano la envíe. */
export async function keepPhoto(photoUri: string, localId: string): Promise<string> {
  await ensureFolder();
  const target = `${FOLDER}${localId}.jpg`;
  await copyAsync({ from: photoUri, to: target });
  return target;
}

export async function deletePhoto(photoUri: string): Promise<void> {
  if (!photoUri.startsWith(FOLDER)) return;
  await deleteAsync(photoUri, { idempotent: true }).catch(() => undefined);
}
