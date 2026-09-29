import fs from 'node:fs';

const envText = fs.readFileSync('.env', 'utf8');
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .filter((line) => line.includes('=') && !line.trim().startsWith('#'))
    .map((line) => {
      const separator = line.indexOf('=');
      return [line.slice(0, separator), line.slice(separator + 1).trim()];
    })
);

const { VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: key } = env;
if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.');
  process.exit(1);
}

const checks = [
  ['Supabase Auth', '/auth/v1/health'],
  ['Supabase REST', '/rest/v1/profiles?select=id&limit=0'],
];

const results = await Promise.all(checks.map(async ([name, path]) => {
  try {
    const response = await fetch(`${url}${path}`, { headers: { apikey: key } });
    return { name, status: response.status, ok: response.ok };
  } catch (error) {
    return { name, error: error instanceof Error ? error.message : 'Network request failed' };
  }
}));

for (const result of results) {
  console.log(`${result.name}: ${result.ok ? 'OK' : 'FAILED'}${result.status ? ` (${result.status})` : ''}${result.error ? `: ${result.error}` : ''}`);
}

if (results.some((result) => !result.ok)) process.exit(1);
