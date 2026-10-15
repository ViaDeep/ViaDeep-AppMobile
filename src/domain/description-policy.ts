/**
 * Mismas reglas que DescriptionPolicy del servicio de incidencias, para avisar antes de enviar: la descripción debe
 * hablar del daño en la vía, sin groserías ni insultos (en español o inglés) y sin enlaces, correos ni teléfonos. Es una lista de palabras:
 * atrapa lo evidente, pero no entiende el sentido del texto.
 */
export const BLOCKED_WORDS: ReadonlySet<string> = new Set([
  'mierda', 'mierdas', 'mrd', 'carajo', 'carajos', 'puta', 'putas', 'puto', 'putos', 'putamadre', 'ptm',
  'conchatumare', 'conchatumadre', 'conchasumare', 'conchasumadre', 'ctm', 'csm', 'chucha', 'chuchatumare',
  'huevon', 'huevona', 'huevones', 'huevonas', 'webon', 'webona', 'webones', 'weon', 'cojudo', 'cojuda',
  'cojudos', 'cojudas', 'cojudez', 'cabron', 'cabrona', 'cabrones', 'pendejo', 'pendeja', 'pendejos',
  'imbecil', 'imbeciles', 'idiota', 'idiotas', 'estupido', 'estupida', 'estupidos', 'estupidas', 'tarado',
  'tarada', 'mongol', 'mongolico', 'mongolica', 'retrasado', 'retrasada', 'maricon', 'maricones', 'marica',
  'cabro', 'cabros', 'rosquete', 'zora', 'zoras', 'verga', 'vergas', 'pinga', 'pingas',
  'pichula', 'cagada', 'cagar', 'cagon', 'culo', 'culos', 'coño', 'joder', 'jodido', 'jodida', 'malparido',
  'malparida', 'gonorea', 'hijueputa', 'hdp', 'hdlgp', 'chupala', 'chupame', 'lameculos',
  // Inglés. Van ya normalizadas: "asshole" se guarda como "ashole". "ass" no se incluye porque quedaría "as".
  'fuck', 'fucks', 'fucked', 'fucking', 'fuckin', 'fucker', 'fuckers', 'motherfucker', 'fck', 'fuk', 'shit',
  'shits', 'shity', 'bulshit', 'bitch', 'bitches', 'ashole', 'asholes', 'dick', 'dickhead', 'cock', 'pusy',
  'cunt', 'bastard', 'slut', 'whore', 'fag', 'fagot', 'retard', 'retarded', 'dumbas', 'jackas', 'wtf',
  'stfu', 'idiot', 'stupid', 'moron',
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
