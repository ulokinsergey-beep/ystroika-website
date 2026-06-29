/**
 * build-staging.mjs — кросс-платформенная сборка под Timeweb staging /new-site/.
 * Ставит STAGING=1 (base:'/new-site/') и запускает astro build.
 *   npm run build:staging
 */
import { execSync } from 'node:child_process';
process.env.STAGING = '1';
execSync('npx astro build', { stdio: 'inherit', env: process.env });
