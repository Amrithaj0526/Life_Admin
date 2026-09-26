import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config(); // fallback to local server .env

export interface Config {
  port: number;
  nodeEnv: string;
  clientUrl: string;
  serverUrl: string;
  databaseUrl: string;
  useSqliteFallback: boolean;
  jwtSecret: string;
  jwtExpiresIn: string;
  tokenEncryptionKey: string;
  uploadDir: string;
  maxFileSize: number;
  aiProvider: 'gemini' | 'mock';
  geminiApiKey: string;
  ocrEngine: 'tesseract' | 'mock';
  googleClientId: string;
  googleClientSecret: string;
  googleRedirectUri: string;
}

const nodeEnv = process.env.NODE_ENV || 'development';
const jwtSecret = process.env.JWT_SECRET || (nodeEnv === 'production' ? '' : 'lifeadmin_super_secret_jwt_key_fallback_2026');

if (nodeEnv === 'production' && (!jwtSecret || jwtSecret.includes('replace_with') || jwtSecret.length < 32)) {
  throw new Error('[SECURITY FATAL] In production mode, JWT_SECRET must be set to a high-entropy secret of at least 32 characters.');
}

const uploadPath = path.resolve(process.cwd(), process.env.UPLOAD_DIR || '../uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

export const config: Config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  serverUrl: process.env.SERVER_URL || 'http://localhost:5000',
  databaseUrl: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/lifeadmin',
  useSqliteFallback: process.env.USE_SQLITE_FALLBACK !== 'false',
  jwtSecret: jwtSecret || 'lifeadmin_super_secret_jwt_key_fallback_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  tokenEncryptionKey: process.env.TOKEN_ENCRYPTION_KEY || 'lifeadmin_token_encryption_key_2026_aes256',
  uploadDir: uploadPath,
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
  aiProvider: (process.env.AI_PROVIDER as any) || 'mock',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  ocrEngine: (process.env.OCR_ENGINE as any) || 'mock',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/calendar/google/callback',
};
