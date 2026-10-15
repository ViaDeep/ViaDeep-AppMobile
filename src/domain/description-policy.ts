/**
 * Mismas reglas que DescriptionPolicy del servicio de incidencias, para avisar antes de enviar: la descripción debe
 * hablar del daño en la vía, sin groserías ni insultos y sin enlaces, correos ni teléfonos. Es una lista de palabras:
 * atrapa lo evidente, pero no entiende el sentido del texto.
 */
const BLOCKED_WORDS = new Set([
  'mierda', 'mierdas', 'mrd', 'carajo', 'carajos', 'puta', 'putas', 'puto', 'putos', 'putamadre', 'ptm',
  'conchatumare', 'conchatumadre', 'conchasumare', 'conchasumadre', 'ctm', 'csm', 'chucha', 'chuchatumare',
  'huevon', 'huevona', 'huevones', 'huevonas', 'webon', 'webona', 'webones', 'weon', 'cojudo', 'cojuda',
  'cojudos', 'cojudas', 'cojudez', 'cabron', 'cabrona', 'cabrones', 'pendejo', 'pendeja', 'pendejos',
  'imbecil', 'imbeciles', 'idiota', 'idiotas', 'estupido', 'estupida', 'estupidos', 'estupidas', 'tarado',
  'tarada', 'mongol', 'mongolico', 'mongolica', 'retrasado', 'retrasada', 'maricon', 'maricones', 'marica',
  'cabro', 'cabros', 'rosquete', 'zorra', 'zorras', 'verga', 'vergas', 'pinga', 'pingas',
  'pichula', 'cagada', 'cagar', 'cagon', 'culo', 'culos', 'coño', 'joder', 'jodido', 'jodida', 'malparido',
  'malparida', 'gonorrea', 'hijueputa', 'hdp', 'hdlgp', 'chupala', 'chupame', 'lameculos',
]);

const LINK = /(https?:\/\/|www\.|\b[\w-]+\.(com|pe|net|org)\b)/i;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/;
const PHONE = /(\d[\s-]?){9,}/;

/** Minúsculas, sin tildes, con 4→a, 3→e, 1→i, 0→o, @→a, $/5→s y sin letras repetidas ("PUUUTA" → "puta"). */
export function normalizeForPolicy(text: string): string {
  const withoutAccents = text
    .toLowerCase()
    .replace(/ñ/g, '\u0001')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\u0001/g, 'ñ');
  const letters = withoutAccents
    .replace(/[4@]/g, 'a')
    .replace(/3/g, 'e')
    .replace(/1/g, 'i')
    .replace(/0/g, 'o')
    .replace(/[5$]/g, 's');
  return letters.replace(/([a-zñ])\1+/g, '$1');
}

/** El motivo por el que la descripción no se aceptaría, o null si se puede enviar. */
export function descriptionProblem(description: string): string | null {
  if (!description.trim()) return null;
  if (LINK.test(description) || EMAIL.test(description)) {
    return 'La descripción no puede incluir enlaces ni correos. Describe solo el daño en la vía.';
  }
  if (PHONE.test(description)) {
    return 'La descripción no puede incluir números de teléfono. Describe solo el daño en la vía.';
  }
  const offensive = normalizeForPolicy(description)
    .split(/[^a-zñ]+/)
    .some((word) => BLOCKED_WORDS.has(word));
  return offensive ? 'La descripción contiene palabras inapropiadas. Describe solo el daño en la vía.' : null;
}
