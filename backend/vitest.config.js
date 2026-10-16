import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Tests use their own database. Values come from .env.test and override .env.
const dir = path.dirname(fileURLToPath(import.meta.url));
const testEnv = dotenv.parse(fs.readFileSync(path.join(dir, '.env.test')));

export default defineConfig({
  test: {
    environment: 'node',
    env: { ...testEnv, NODE_ENV: 'test' },
    globalSetup: ['./tests/globalSetup.js'],
    fileParallelism: false, // one shared database, so run files one after another
    testTimeout: 15000,
    hookTimeout: 60000,
  },
});
