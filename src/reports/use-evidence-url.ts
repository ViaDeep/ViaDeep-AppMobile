import { useEffect, useState } from 'react';

import { evidenceApi } from '@/api/evidence-api';

/** Las URLs firmadas duran poco; se reutilizan solo por unos minutos. */
const TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { url: Promise<string>; at: number }>();

function signedUrl(evidenceId: string): Promise<string> {
  const cached = cache.get(evidenceId);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.url;
  const url = evidenceApi.signedUrl(evidenceId);
  cache.set(evidenceId, { url, at: Date.now() });
  // Si falla, se olvida para reintentar la próxima vez.
  url.catch(() => cache.delete(evidenceId));
  return url;
}

/** URL firmada de la foto de un reporte, o null mientras carga o si falla. */
export function useEvidenceUrl(evidenceId: string | null | undefined): string | null {
  const [loaded, setLoaded] = useState<{ id: string; url: string } | null>(null);

  useEffect(() => {
    if (!evidenceId) return;
    let cancelled = false;
    signedUrl(evidenceId)
      .then((url) => {
        if (!cancelled) setLoaded({ id: evidenceId, url });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [evidenceId]);

  return loaded && loaded.id === evidenceId ? loaded.url : null;
}
