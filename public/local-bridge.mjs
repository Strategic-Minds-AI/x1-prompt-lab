#!/usr/bin/env node
import { exec } from 'node:child_process';
import { readdir, stat, readFile, mkdir, rename } from 'node:fs/promises';
import { join, basename, extname, resolve } from 'node:path';
import os from 'node:os';

const args = process.argv.slice(2);
function arg(k) {
  const i = args.indexOf('--' + k);
  if (i >= 0 && args[i + 1]) return args[i + 1];
  const envKey = k.toUpperCase().replace(/-/g, '_');
  return process.env[envKey] || process.env[k];
}
const APP_URL = (arg('app') || '').replace(/\/$/, '');
const SESSION_ID = arg('session');
if (!APP_URL || !SESSION_ID) {
  console.error('Usage: node local-bridge.mjs --app=<appUrl> --session=<sessionId>');
  process.exit(1);
}

const COMPUTER = os.hostname();
const OS = process.platform;

async function post(path, body) {
  const res = await fetch(APP_URL + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  return res.json();
}

async function register() {
  await post('/functions/bridgeRegister', { session_id: SESSION_ID, computer_name: COMPUTER, os: OS });
  console.log(`[bridge] registered ${COMPUTER} (${OS}) session ${SESSION_ID}`);
}

function runShell(cmd) {
  return new Promise((res) => {
    exec(cmd, { maxBuffer: 5 * 1024 * 1024, timeout: 60000 }, (err, stdout, stderr) => {
      if (err) res({ status: 'failed', output: (stdout || '') + (stderr || ''), error: err.message });
      else res({ status: 'done', output: (stdout || '') + (stderr || '') });
    });
  });
}

async function runScan(folder) {
  const out = [];
  async function walk(dir, depth) {
    if (depth > 3) return;
    let entries;
    try { entries = await readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) { out.push({ path: full, type: 'dir' }); await walk(full, depth + 1); }
      else {
        try { const s = await stat(full); out.push({ path: full, type: 'file', size: s.size, ext: extname(e.name) }); } catch {}
      }
    }
  }
  await walk(resolve(folder), 0);
  return { status: 'done', output: JSON.stringify(out, null, 2), result: { files: out } };
}

async function runIngest(filePath) {
  try {
    const data = await readFile(filePath, 'utf8');
    return { status: 'done', output: data.slice(0, 50000), result: { content: data.slice(0, 50000) } };
  } catch (e) { return { status: 'failed', error: e.message }; }
}

async function runOrganize(mapping, root) {
  const log = [];
  for (const [src, folder] of Object.entries(mapping)) {
    const destDir = join(root || 'Organized', folder);
    try {
      await mkdir(destDir, { recursive: true });
      const dest = join(destDir, basename(src));
      await rename(src, dest);
      log.push(`moved ${src} -> ${dest}`);
    } catch (e) { log.push(`failed ${src}: ${e.message}`); }
  }
  return { status: 'done', output: log.join('\n') };
}

async function handle(cmd) {
  try {
    let r;
    if (cmd.type === 'shell') r = await runShell(cmd.command);
    else if (cmd.type === 'scan') r = await runScan(cmd.command);
    else if (cmd.type === 'ingest') r = await runIngest(cmd.command);
    else if (cmd.type === 'organize') r = await runOrganize(cmd.args?.mapping || {}, cmd.args?.root);
    else r = { status: 'failed', error: 'unknown type ' + cmd.type };
    await post('/functions/bridgeResult', { session_id: SESSION_ID, command_id: cmd.command_id, ...r });
    console.log(`[bridge] ${cmd.type} ${String(cmd.command).slice(0, 60)} -> ${r.status}`);
  } catch (e) {
    await post('/functions/bridgeResult', { session_id: SESSION_ID, command_id: cmd.command_id, status: 'failed', error: e.message });
  }
}

async function poll() {
  try {
    const res = await post('/functions/bridgePoll', { session_id: SESSION_ID });
    if (res && res.command_id) await handle(res);
    else if (res && res.error) console.error('[bridge] poll error', res.error);
  } catch (e) { console.error('[bridge] poll failed', e.message); }
}

await register();
console.log(`[bridge] polling ${APP_URL} every 3s. Ctrl+C to stop.`);
setInterval(poll, 3000);
poll();
