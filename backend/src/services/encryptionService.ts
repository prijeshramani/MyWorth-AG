import crypto from 'crypto';

// Master secret key derivation for AES-256-GCM encryption
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

// Fallback development key if process.env.APP_SECRET is not specified
const DEFAULT_SECRET = 'family_wealth_os_local_secure_master_key_2026';

function getEncryptionKey(): Buffer {
  const secret = process.env.APP_SECRET || DEFAULT_SECRET;
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypts a plain-text string using AES-256-GCM.
 * Output format: "enc:iv_hex:authTag_hex:encrypted_hex"
 */
export function encryptText(text: string): string {
  if (!text) return text;
  
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `enc:${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Encryption operation failed.');
  }
}

/**
 * Decrypts an encrypted string produced by encryptText.
 * If string is not encrypted (legacy plain-text), returns original text safely.
 */
export function decryptText(encryptedPayload: string): string {
  if (!encryptedPayload) return encryptedPayload;
  
  // Check if string follows "enc:iv:authTag:cipher" format
  if (!encryptedPayload.startsWith('enc:')) {
    return encryptedPayload; // Return legacy plain-text as-is
  }

  try {
    const parts = encryptedPayload.split(':');
    if (parts.length !== 4) return encryptedPayload;

    const [, ivHex, authTagHex, cipherHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed for payload:', error);
    return encryptedPayload; // Fallback safely
  }
}
