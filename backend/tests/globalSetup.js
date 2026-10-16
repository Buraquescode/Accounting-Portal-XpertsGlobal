import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Rebuilds the TEST database once per run: applies migrations, then runs the seed.
// migrate reset is used because the audit-log trigger blocks TRUNCATE and DELETE by design.
export default function setup() {
  const testEnv = dotenv.parse(fs.readFileSync(path.join(backendDir, '.env.test')));
  execSync('npx prisma migrate reset --force --skip-generate', {
    cwd: backendDir,
    env: { ...process.env, ...testEnv, NODE_ENV: 'test' },
    stdio: 'inherit',
  });
}
