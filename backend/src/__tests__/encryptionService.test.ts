import { encryptText, decryptText } from '../services/encryptionService';

describe('Encryption Service (AES-256-GCM)', () => {
  it('should encrypt and decrypt a plain text credential correctly', () => {
    const plainText = 'my_secret_broker_api_key_12345';
    const encrypted = encryptText(plainText);

    expect(encrypted).not.toBe(plainText);
    expect(encrypted.startsWith('enc:')).toBe(true);

    const decrypted = decryptText(encrypted);
    expect(decrypted).toBe(plainText);
  });

  it('should transparently return unencrypted legacy plain-text as-is during decryption', () => {
    const legacyPlainText = 'legacy_unencrypted_api_key';
    const result = decryptText(legacyPlainText);

    expect(result).toBe(legacyPlainText);
  });

  it('should handle empty or null values safely', () => {
    expect(encryptText('')).toBe('');
    expect(decryptText('')).toBe('');
  });
});
