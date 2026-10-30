import { documentDirectory, getInfoAsync, makeDirectoryAsync, readAsStringAsync, writeAsStringAsync } from 'expo-file-system/legacy';

import type { ContinuousLog } from './continuous-test';

const FOLDER = `${documentDirectory ?? ''}benchmark/`;
const FILE = `${FOLDER}uso-continuo.json`;

/** Última prueba de uso continuo guardada; si quedó en "running", la app se cerró a mitad de la prueba. */
export async function readContinuousLog(): Promise<ContinuousLog | null> {
  try {
    const info = await getInfoAsync(FILE);
    return info.exists ? (JSON.parse(await readAsStringAsync(FILE)) as ContinuousLog) : null;
  } catch {
    return null;
  }
}

export async function writeContinuousLog(log: ContinuousLog): Promise<void> {
  const info = await getInfoAsync(FOLDER);
  if (!info.exists) await makeDirectoryAsync(FOLDER, { intermediates: true });
  await writeAsStringAsync(FILE, JSON.stringify(log));
}
