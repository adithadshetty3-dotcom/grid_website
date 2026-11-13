import crypto from 'node:crypto';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { loadConfig } from '../src/config.js';
import { openPostgresDatabase, openSqliteDatabase } from '../src/db.js';
import { USERNAME_PATTERN } from '../src/security.js';

function hiddenPrompt(question) {
  return new Promise((resolve, reject) => {
    stdout.write(question);
    const wasRaw = Boolean(stdin.isRaw);
    if (stdin.isTTY) stdin.setRawMode(true);
    let value = '';
    const done = (error) => {
      stdin.off('data', onData);
      if (stdin.isTTY) stdin.setRawMode(wasRaw);
      stdout.write('\n');
      error ? reject(error) : resolve(value);
    };
    const onData = (chunk) => {
      for (const char of chunk.toString()) {
        if (char === '\u0003') return done(new Error('Cancelled.'));
        if (char === '\r' || char === '\n') return done();
        if (char === '\u007f' || char === '\b') value = value.slice(0, -1);
        else if (char >= ' ') value += char;
      }
    };
    stdin.on('data', onData);
  });
}

const config = loadConfig();
const db = config.databaseKind === 'postgres'
  ? openPostgresDatabase(config.databaseUrl, { max: 1 })
  : openSqliteDatabase(config.databasePath);
const prompt = readline.createInterface({ input: stdin, output: stdout });
try {
  await db.assertSchema();
  const username = (await prompt.question('New admin username: ')).trim();
  if (!USERNAME_PATTERN.test(username)) throw new Error('Username must use 1–80 letters, numbers, dot, underscore or hyphen.');
  if (await db.prepare('SELECT id FROM timeline_admins WHERE lower(username)=lower(?)').get(username)) throw new Error('That username already exists. Existing admins are never changed by this command.');
  if ((await prompt.question('Type CREATE NEW ADMIN to continue: ')) !== 'CREATE NEW ADMIN') throw new Error('Confirmation did not match; no account was created.');
  const password = await hiddenPrompt('New password (minimum 14 characters): ');
  const confirmation = await hiddenPrompt('Repeat new password: ');
  if (password.length < 14 || password !== confirmation) throw new Error('Passwords did not match or were too short. No account was created.');
  const salt = crypto.randomBytes(8).toString('hex');
  const key = await new Promise((resolve, reject) => crypto.scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, derived) => error ? reject(error) : resolve(derived)));
  const hash = `scrypt:32768:8:1$${salt}$${key.toString('hex')}`;
  await db.prepare('INSERT INTO timeline_admins (username, password_hash, is_active, session_version, created_at) VALUES (?, ?, TRUE, 0, ?)')
    .run(username, hash, new Date().toISOString().replace('T', ' ').replace('Z', ''));
  process.stdout.write(`Created admin account ${username}. No existing account or session was changed.\n`);
} finally {
  prompt.close();
  await db.close();
}
