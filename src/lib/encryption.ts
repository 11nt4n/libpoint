import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): string {
  if (!text) return text;
  
  // Need to read from process.env directly inside the function
  // because this might be evaluated differently in server vs client context
  // though it should only ever be called on the server
  const keyHex = process.env.ENCRYPTION_KEY;
  
  if (!keyHex || keyHex.length !== 64) {
    console.error('Invalid or missing ENCRYPTION_KEY in environment variables.');
    return text;
  }

  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(keyHex, 'hex'), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (e) {
    console.error('Encryption failed', e);
    return text;
  }
}

export function decrypt(text: string): string {
  if (!text || !text.includes(':')) return text; // Not encrypted (backward compatibility)
  
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) return text;

  try {
    const [ivHex, authTagHex, encryptedText] = text.split(':');
    if (!ivHex || !authTagHex || !encryptedText) return text;
    
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(keyHex, 'hex'),
      Buffer.from(ivHex, 'hex')
    );
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    console.error('Decryption failed', e);
    return text; // Return original if decryption fails (e.g., tampered data)
  }
}
