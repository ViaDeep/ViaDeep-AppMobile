import { addPending, loadPending, parsePending, removePending, toDraft, type PendingReport, type PendingStorage } from '../pending-reports';

function memoryStorage(initial: string | null = null): PendingStorage & { contents: string | null } {
  const storage = {
    contents: initial,
    read: async () => storage.contents,
    write: async (value: string) => {
      storage.contents = value;
    },
  };
  return storage;
}

function pending(localId: string, overrides: Partial<PendingReport> = {}): PendingReport {
  return {
    localId,
    ownerId: 'u1',
    photoUri: `file:///docs/pending-reports/${localId}.jpg`,
    coordinates: { latitude: -12.05, longitude: -77.04 },
    address: 'Av. Arequipa 1200, Lince',
    capturedAt: '2026-10-15T10:00:00Z',
    detection: null,
    manualType: 'D40',
    description: 'Frente al paradero',
    savedAt: '2026-10-15T10:01:00Z',
    ...overrides,
  };
}

describe('reportes pendientes de envío', () => {
  it('guarda los reportes en orden y los quita al enviarlos', async () => {
    const storage = memoryStorage();
    await addPending(storage, pending('a'));
    await addPending(storage, pending('b'));
    expect((await loadPending(storage)).map((item) => item.localId)).toEqual(['a', 'b']);

    await removePending(storage, 'a');
    expect((await loadPending(storage)).map((item) => item.localId)).toEqual(['b']);
  });

  it('no duplica un reporte que ya estaba en la cola', async () => {
    const storage = memoryStorage();
    await addPending(storage, pending('a'));
    await addPending(storage, pending('a', { description: 'otra' }));
    expect(await loadPending(storage)).toHaveLength(1);
  });

  it('ignora un archivo vacío o dañado', () => {
    expect(parsePending(null)).toEqual([]);
    expect(parsePending('{no es json')).toEqual([]);
    expect(parsePending('{"localId":"a"}')).toEqual([]);
  });

  it('arma el borrador que se envía con los mismos datos', () => {
    expect(toDraft(pending('a'))).toEqual({
      photoUri: 'file:///docs/pending-reports/a.jpg',
      coordinates: { latitude: -12.05, longitude: -77.04 },
      detection: null,
      manualType: 'D40',
      description: 'Frente al paradero',
    });
  });
});
