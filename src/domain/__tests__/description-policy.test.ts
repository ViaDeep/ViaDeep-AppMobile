import { BLOCKED_WORDS, descriptionProblem, normalizeForPolicy } from '../description-policy';

describe('descriptionProblem', () => {
  it('acepta descripciones sobre la vía', () => {
    expect(descriptionProblem('Bache grande frente al paradero de la Av. Arequipa 1200')).toBeNull();
    expect(descriptionProblem('Hay basura y el perro casi se cae en la computadora')).toBeNull();
    expect(descriptionProblem('   ')).toBeNull();
  });

  it('rechaza groserías aunque estén disfrazadas', () => {
    expect(descriptionProblem('Arreglen esta mierda')).toMatch('palabras inapropiadas');
    expect(descriptionProblem('PUUUTA que bache')).not.toBeNull();
    expect(descriptionProblem('son unos c0jud0s')).not.toBeNull();
    expect(descriptionProblem('Huevón el que lo dejó así')).not.toBeNull();
  });

  it('rechaza también groserías en inglés', () => {
    expect(descriptionProblem('fix this shit')).not.toBeNull();
    expect(descriptionProblem('FUUUCK this road')).not.toBeNull();
    expect(descriptionProblem('what an asshole')).not.toBeNull();
    expect(descriptionProblem('as bad as it gets')).toBeNull();
  });

  it('rechaza enlaces, correos y teléfonos', () => {
    expect(descriptionProblem('mira https://ejemplo.com')).toMatch('enlaces');
    expect(descriptionProblem('visita www.ofertas.pe')).not.toBeNull();
    expect(descriptionProblem('escríbeme a vecino@correo.pe')).not.toBeNull();
    expect(descriptionProblem('llámame al 987 654 321')).toMatch('teléfono');
  });

  it('normaliza tildes, números y letras repetidas', () => {
    expect(normalizeForPolicy('HUEVÓÓN')).toBe('huevon');
    expect(normalizeForPolicy('c0jud0')).toBe('cojudo');
    expect(normalizeForPolicy('Coño')).toBe('coño');
  });

  it('guarda cada palabra bloqueada ya normalizada', () => {
    BLOCKED_WORDS.forEach((word) => expect(normalizeForPolicy(word)).toBe(word));
  });
});
