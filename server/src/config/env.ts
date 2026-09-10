import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the project root
dotenv.config({
  path: path.resolve(__dirname, '../../../.env'),
});

export const env = {
  port: Number(process.env.PORT ?? 5000),

  mongoUri:
    process.env.MONGODB_URI ??
    'mongodb://127.0.0.1:27017/interview-prep-kit',

  jwtSecret:
    process.env.JWT_SECRET ??
    'development-only-secret',

  clientUrl:
    process.env.CLIENT_URL ??
    'http://localhost:5173',

  geminiApiKey:
    process.env.GEMINI_API_KEY ?? '',

  geminiModel:
    process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
};