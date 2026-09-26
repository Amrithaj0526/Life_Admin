import crypto from 'crypto';
import { config } from '../../config/env.js';
import { getDatabase } from '../../config/database.js';

export class CryptoService {
  private static getKey(): Buffer {
    // Derive a fixed 32-byte (256-bit) key using SHA-256 from the configured encryption key
    return crypto.createHash('sha256').update(config.tokenEncryptionKey).digest();
  }

  /**
   * Encrypt a sensitive token using AES-256-GCM authenticated encryption.
   */
  static encryptToken(plainText: string): string {
    if (!plainText) return '';
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-gcm', this.getKey(), iv);
      let encrypted = cipher.update(plainText, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag().toString('hex');
      return `enc:gcm:${iv.toString('hex')}:${authTag}:${encrypted}`;
    } catch (err: any) {
      console.error('[CryptoService] Encryption error:', err.message);
      return plainText;
    }
  }

  /**
   * Decrypt a sensitive token with backward compatibility for unencrypted legacy tokens.
   */
  static decryptToken(cipherText: string): string {
    if (!cipherText) return '';
    if (!cipherText.startsWith('enc:gcm:')) {
      // Legacy unencrypted token
      return cipherText;
    }

    try {
      const parts = cipherText.split(':');
      if (parts.length !== 5) {
        throw new Error('Invalid encrypted token format');
      }
      const [, , ivHex, authTagHex, encryptedHex] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-gcm', this.getKey(), iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (err: any) {
      console.error('[CryptoService] Decryption failed or tag verification mismatch:', err.message);
      throw new Error('Unable to decrypt stored credentials.');
    }
  }

  /**
   * Generate a cryptographically random, single-use OAuth state parameter
   * bound to the initiating user and expiring in 10 minutes.
   */
  static async generateOAuthState(userId: string): Promise<string> {
    const db = await getDatabase();
    const state = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Clean up expired states first
    try {
      await db.query(`DELETE FROM oauth_states WHERE expires_at < $1`, [new Date().toISOString()]);
    } catch {}

    await db.query(
      `INSERT INTO oauth_states (state, user_id, created_at, expires_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP, $3)`,
      [state, userId, expiresAt]
    );

    return state;
  }

  /**
   * Validate and consume an OAuth state parameter.
   * Ensures single-use, validity, and retrieves the initiating user ID.
   */
  static async validateAndConsumeOAuthState(state: string): Promise<string | null> {
    if (!state || typeof state !== 'string' || state.length < 16) {
      return null;
    }

    const db = await getDatabase();
    const now = new Date().toISOString();

    const res = await db.query(
      `SELECT user_id, expires_at FROM oauth_states WHERE state = $1`,
      [state]
    );

    if (res.rows.length === 0) {
      return null;
    }

    const record = res.rows[0];

    // Single-use: delete state immediately
    await db.query(`DELETE FROM oauth_states WHERE state = $1`, [state]);

    // Check expiration
    if (new Date(record.expires_at).getTime() < Date.now()) {
      return null;
    }

    return record.user_id;
  }
}
