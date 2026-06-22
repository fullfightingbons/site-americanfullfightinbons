import { describe, it, expect } from 'vitest';
import {
  checkLoginRateLimit,
  parseCookies,
  quoteIdentifier,
  toBase64Url,
  fromBase64Url,
  secureEquals,
  sanitizeText,
  sanitizeEmail,
  sanitizeUrl,
  normalizeDbValue,
  escapeHtmlText,
  parseBooleanSetting,
  mergePricing,
  normalizeGoogleReview,
} from '../src/index.ts';

describe('secureEquals', () => {
  it('retourne true pour deux chaînes identiques', () => {
    expect(secureEquals('signature123', 'signature123')).toBe(true);
  });

  it('retourne false pour des longueurs différentes', () => {
    expect(secureEquals('abc', 'ab')).toBe(false);
  });

  it('retourne false pour un seul caractère différent', () => {
    expect(secureEquals('abcdef', 'abcdeg')).toBe(false);
  });
});

describe('parseCookies', () => {
  function fakeRequest(cookieHeader) {
    return { headers: { get: (name) => (name === 'cookie' ? cookieHeader : null) } };
  }

  it('extrait le cookie de session', () => {
    const cookies = parseCookies(fakeRequest('affbc_site_session=abc.def; other=1'));
    expect(cookies.affbc_site_session).toBe('abc.def');
  });

  it('retourne un objet vide sans en-tête cookie', () => {
    expect(parseCookies(fakeRequest(null))).toEqual({});
  });

  it('décode les valeurs encodées en URL', () => {
    const cookies = parseCookies(fakeRequest('msg=hello%20world'));
    expect(cookies.msg).toBe('hello world');
  });
});

describe('quoteIdentifier', () => {
  it('accepte un identifiant de colonne/table valide', () => {
    expect(quoteIdentifier('site_settings')).toBe('"site_settings"');
  });

  it("rejette une tentative d'injection SQL", () => {
    expect(() => quoteIdentifier('site_settings; DROP TABLE users')).toThrow();
  });

  it('rejette un identifiant commençant par un chiffre', () => {
    expect(() => quoteIdentifier('1table')).toThrow();
  });
});

describe('toBase64Url / fromBase64Url', () => {
  it('fait un aller-retour fidèle sans caractères +/= ', () => {
    const original = JSON.stringify({ userId: 42, expiresAt: 1234567890 });
    const encoded = toBase64Url(original);
    expect(encoded).not.toMatch(/[+/=]/);
    expect(fromBase64Url(encoded)).toBe(original);
  });
});

describe('sanitizeText', () => {
  it('trim et compresse les espaces multiples', () => {
    expect(sanitizeText('  Bonjour    le   monde  ', 100)).toBe('Bonjour le monde');
  });

  it('tronque à la longueur maximale', () => {
    expect(sanitizeText('abcdefghij', 5)).toBe('abcde');
  });

  it('gère les valeurs null/undefined', () => {
    expect(sanitizeText(null, 10)).toBe('');
    expect(sanitizeText(undefined, 10)).toBe('');
  });
});

describe('sanitizeEmail', () => {
  it('met en minuscules et trim', () => {
    expect(sanitizeEmail('  Jean.Dupont@Example.COM  ', 100)).toBe('jean.dupont@example.com');
  });
});

describe('sanitizeUrl', () => {
  it('trim et tronque sans modifier la casse', () => {
    expect(sanitizeUrl('  https://Example.com/Path  ', 100)).toBe('https://Example.com/Path');
  });
});

describe('normalizeDbValue', () => {
  it('convertit undefined en null (compatibilité D1)', () => {
    expect(normalizeDbValue(undefined)).toBeNull();
  });

  it('convertit les booléens en 0/1', () => {
    expect(normalizeDbValue(true)).toBe(1);
    expect(normalizeDbValue(false)).toBe(0);
  });

  it('laisse les autres valeurs inchangées', () => {
    expect(normalizeDbValue('texte')).toBe('texte');
    expect(normalizeDbValue(42)).toBe(42);
    expect(normalizeDbValue(null)).toBeNull();
  });
});

describe('escapeHtmlText', () => {
  it('échappe les caractères HTML spéciaux', () => {
    expect(escapeHtmlText(`<script>alert("xss")</script>`)).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it("échappe l'apostrophe et l'esperluette", () => {
    expect(escapeHtmlText(`L'équipe & vous`)).toBe('L&#39;équipe &amp; vous');
  });
});

describe('parseBooleanSetting', () => {
  it.each(['1', 'true', 'TRUE', 'yes', 'on'])('reconnaît "%s" comme vrai', (value) => {
    expect(parseBooleanSetting(value)).toBe(true);
  });

  it.each(['0', 'false', 'no', 'off', '', undefined, null])('reconnaît "%s" comme faux', (value) => {
    expect(parseBooleanSetting(value)).toBe(false);
  });
});

describe('checkLoginRateLimit', () => {
  it('autorise les 10 premières tentatives puis bloque', () => {
    const ip = 'test-ip-' + Math.random();
    for (let i = 0; i < 10; i++) {
      expect(checkLoginRateLimit(ip)).toBe(true);
    }
    expect(checkLoginRateLimit(ip)).toBe(false);
  });

  it('traite chaque IP indépendamment', () => {
    const ipA = 'test-ip-a-' + Math.random();
    const ipB = 'test-ip-b-' + Math.random();
    for (let i = 0; i < 10; i++) checkLoginRateLimit(ipA);
    expect(checkLoginRateLimit(ipA)).toBe(false);
    expect(checkLoginRateLimit(ipB)).toBe(true);
  });
});

describe('mergePricing', () => {
  it('retourne les tarifs locaux activés quand aucun tarif partagé', () => {
    const result = mergePricing([], [{ id: '1', label: 'Cours adulte' }]);
    expect(result).toEqual([{ enabled: 1, id: '1', label: 'Cours adulte' }]);
  });

  it('applique les surcharges locales sur les tarifs partagés et trie par display_order', () => {
    const shared = [
      { id: '1', label: 'Adulte', price: 50, display_order: 2 },
      { id: '2', label: 'Enfant', price: 30, display_order: 1 },
    ];
    const local = [{ id: '1', price: 45 }]; // surcharge de prix uniquement
    const result = mergePricing(shared, local);
    expect(result.map((r) => r.id)).toEqual(['2', '1']); // trié par display_order
    expect(result.find((r) => r.id === '1').price).toBe(45); // surcharge appliquée
    expect(result.find((r) => r.id === '1').label).toBe('Adulte'); // reste du partagé conservé
  });
});

describe('normalizeGoogleReview', () => {
  it('normalise un avis Google valide', () => {
    const review = {
      name: 'places/x/reviews/1',
      authorAttribution: { displayName: 'Marie D.', photoUri: 'https://example.com/photo.jpg' },
      text: { text: 'Super club, ambiance au top !' },
      rating: 5,
      publishTime: '2026-01-01T00:00:00Z',
    };
    const result = normalizeGoogleReview(review, 0, 4);
    expect(result.author_name).toBe('Marie D.');
    expect(result.quote).toBe('Super club, ambiance au top !');
    expect(result.role_label).toBe('Google · ★★★★★');
    expect(result.rating).toBe(5);
  });

  it('rejette un avis sans texte', () => {
    const review = { authorAttribution: {}, text: {}, rating: 5 };
    expect(normalizeGoogleReview(review, 0, 4)).toBeNull();
  });

  it('rejette un avis sous la note minimale', () => {
    const review = { authorAttribution: {}, text: { text: 'Correct' }, rating: 3 };
    expect(normalizeGoogleReview(review, 0, 4)).toBeNull();
  });
});
