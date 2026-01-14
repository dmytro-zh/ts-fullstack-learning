import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as dotenv } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.test alongside this script to ensure a test DB is set
dotenv({ path: path.resolve(__dirname, '..', '.env.test') });

const url = process.env.DATABASE_URL;

if (!url) {
  console.error('ERROR: DATABASE_URL is not set.');
  process.exit(1);
}

const lower = url.toLowerCase();

if (lower.includes('dev.db')) {
  console.error(`ERROR: Refusing to run because DATABASE_URL points to dev.db: ${url}`);
  process.exit(1);
}

if (!lower.includes('test.db')) {
  console.error(`ERROR: Tests must use test.db. Current DATABASE_URL: ${url}`);
  process.exit(1);
}

console.log(`OK: DATABASE_URL looks safe: ${url}`);
