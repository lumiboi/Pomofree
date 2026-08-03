import { normalizeProfilePhoto, validateProfileFile } from './profilePhoto';

test('profil fotoğrafında yalnızca küçük görsel verisi veya HTTPS adresi kabul edilir', () => {
  expect(normalizeProfilePhoto(' https://cdn.example.com/me.webp ')).toBe('https://cdn.example.com/me.webp');
  expect(normalizeProfilePhoto('data:image/webp;base64,AAAA')).toBe('data:image/webp;base64,AAAA');
  expect(() => normalizeProfilePhoto('http://example.com/me.png')).toThrow();
  expect(() => normalizeProfilePhoto('data:image/svg+xml;base64,AAAA')).toThrow();
  expect(() => normalizeProfilePhoto(`data:image/png;base64,${'A'.repeat(100001)}`)).toThrow();
});

test('yüklenen profil dosyasının türü ve ham boyutu sınırlıdır', () => {
  expect(() => validateProfileFile({ type: 'image/png', size: 1024 })).not.toThrow();
  expect(() => validateProfileFile({ type: 'image/svg+xml', size: 1024 })).toThrow();
  expect(() => validateProfileFile({ type: 'image/jpeg', size: 5 * 1024 * 1024 + 1 })).toThrow();
});
