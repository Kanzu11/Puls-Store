import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');
const rootEnvPath = path.resolve(__dirname, '../../.env');
const outPath = path.resolve(__dirname, '../tgcloud/lib/config.js');

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  const map = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
    map[key] = val;
  }
  return map;
}

const rootEnv = parseEnv(rootEnvPath);
const tgEnv = parseEnv(envPath);

const dbUrl = tgEnv.VITE_NEON_DATABASE_URL || rootEnv.DATABASE_URL || '';
const httpUrl =
  tgEnv.VITE_NEON_HTTP_URL || 'https://ep-red-night-b52t1wpd.c-7.us-east-2.aws.neon.tech/sql';
const webAppUrl =
  tgEnv.VITE_WEB_APP_URL || rootEnv.NEXT_PUBLIC_TMA_URL || 'https://app9220334330.tgcloud.ai/';

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(
  outPath,
  `// Auto-generated from telegram/.env (gitignored — never committed to GitHub)\n` +
    `export const NEON_DATABASE_URL = ${JSON.stringify(dbUrl)};\n` +
    `export const NEON_HTTP_URL = ${JSON.stringify(httpUrl)};\n` +
    `export const WEB_APP_URL = ${JSON.stringify(webAppUrl)};\n`,
  'utf8'
);
console.log('✅ Synced telegram/.env -> telegram/tgcloud/lib/config.js');

