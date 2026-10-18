#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { readdir, stat, readFile, mkdir, copyFile, unlink, realpath } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join, basename, extname, resolve, relative, dirname, isAbsolute, sep } from 'node:path';
import os from 'node:os';

const SAFE_OPERATIONS = new Set(['docker.list', 'disk.usage', 'ollama.pull', 'ollama.remove']);
const MODEL_NAME = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/;
const OLLAMA_PATHS = new Set(['/api/tags', '/api/ps', '/api/chat', '/api/generate', '/api/embeddings', '/api/show']);
const MAX_PROXY_BODY = 100000;
function isSafeModelName(value) { return typeof value === 'string' && MODEL_NAME.test(value); }
function validateOllamaProxyRequest(input = {}) {
  if (typeof input.url !== 'string' || input.url.length > 1024) return { ok: false, error: 'Invalid Ollama URL' };
  let url;
  try { url = new URL(input.url); } catch { return { ok: false, error: 'Invalid Ollama URL' }; }
  if (url.protocol !== 'http:' || !['localhost', '127.0.0.1', '[::1]', '::1'].includes(url.hostname.toLowerCase()) || url.port !== '11434' || url.username || url.password) {
    return { ok: false, error: 'Proxy is restricted to local Ollama on port 11434' };
  }
  if (!OLLAMA_PATHS.has(url.pathname) || url.search || url.hash) return { ok: false, error: 'Ollama endpoint is not allowlisted' };
  const method = String(input.method || 'GET').toUpperCase();
  if (!['GET', 'POST'].includes(method)) return { ok: false, error: 'HTTP method is not allowlisted' };
  if ((url.pathname === '/api/tags' || url.pathname === '/api/ps') && method !== 'GET') return { ok: false, error: 'This Ollama endpoint is read-only' };
  if (url.pathname !== '/api/tags' && url.pathname !== '/api/ps' && method !== 'POST') return { ok: false, error: 'This Ollama endpoint requires POST' };
  const body = input.body == null ? undefined : (typeof input.body === 'string' ? input.body : JSON.stringify(input.body));
  if (body && body.length > MAX_PROXY_BODY) return { ok: false, error: 'Ollama request body exceeds 100 KB' };
  const headers = {};
  const contentType = input.headers?.['Content-Type'] || input.headers?.['content-type'];
  if (contentType && String(contentType).toLowerCase() !== 'application/json') return { ok: false, error: 'Only application/json is permitted' };
  if (contentType) headers['Content-Type'] = 'application/json';
  return { ok: true, normalized: { url: url.toString(), method, headers, body } };
}
function validateQueuedLocalCommand(cmd = {}) {
  if (!cmd || typeof cmd !== 'object' || Array.isArray(cmd)) return { ok: false, error: 'Invalid queued command' };
  if (cmd.type === 'operation') {
    if (!SAFE_OPERATIONS.has(cmd.command)) return { ok: false, error: 'Operation is not allowlisted' };
    if ((cmd.command === 'ollama.pull' || cmd.command === 'ollama.remove') && !isSafeModelName(cmd.args?.model)) return { ok: false, error: 'Invalid Ollama model name' };
    if (cmd.command === 'ollama.remove' && cmd.args?.confirm !== true) return { ok: false, error: 'Model removal requires explicit confirmation' };
    return { ok: true };
  }
  if (cmd.type === 'scan' || cmd.type === 'ingest') return typeof cmd.command === 'string' && cmd.command.trim() && cmd.command.length <= 1024 ? { ok: true } : { ok: false, error: 'Invalid path command' };
  if (cmd.type === 'organize') {
    const mapping = cmd.args?.mapping;
    if (!mapping || typeof mapping !== 'object' || Array.isArray(mapping) || Object.keys(mapping).length > 200) return { ok: false, error: 'Invalid file mapping' };
    for (const [source, folder] of Object.entries(mapping)) {
      if (typeof source !== 'string' || !source.trim() || source.length > 1024 || typeof folder !== 'string' || !/^[A-Za-z0-9 _.-]{1,64}$/.test(folder) || folder === '.' || folder === '..') return { ok: false, error: 'Invalid organization mapping' };
    }
    return { ok: true };
  }
  if (cmd.type === 'proxy') {
    const validation = validateOllamaProxyRequest({ url: cmd.command, ...(cmd.args || {}) });
    return validation.ok ? { ok: true } : validation;
  }
  return { ok: false, error: 'Queued command type is not allowlisted' };
}

const args = process.argv.slice(2);
function arg(k) {
  const prefix = '--' + k + '=';
  const eq = args.find(a => a.startsWith(prefix));
  if (eq) return eq.slice(prefix.length);
  const i = args.indexOf('--' + k);
  if (i >= 0 && args[i + 1]) return args[i + 1];
  const envKey = k.toUpperCase().replace(/-/g, '_');
  return process.env[envKey] || process.env[k];
}
const APP_URL = (arg('app') || '').replace(/\/$/, '');
const SESSION_ID = arg('session');
if (!APP_URL || !SESSION_ID) {
  console.error('Usage: node local-bridge.mjs --app=<appUrl> --session=<sessionId> [--root=<allowedRoot>]');
  process.exit(1);
}

const COMPUTER = os.hostname();
const OS = process.platform;
const ALLOWED_ROOT = await realpath(resolve(arg('root') || process.env.BRIDGE_ALLOWED_ROOT || process.cwd()));

async function post(path, body) {
  const res = await fetch(APP_URL + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error('Bridge request failed with HTTP ' + res.status);
  return res.json();
}

async function register() {
  await post('/functions/bridgeRegister', { session_id: SESSION_ID, computer_name: COMPUTER, os: OS });
  console.log(`[bridge] registered ${COMPUTER} (${OS}); allowed root: ${ALLOWED_ROOT}`);
}

function withinRoot(target) {
  const rel = relative(ALLOWED_ROOT, target);
  return rel === '' || (rel !== '..' && !rel.startsWith('..' + sep) && !isAbsolute(rel));
}

async function resolveAllowedPath(value, { mustExist = true } = {}) {
  if (typeof value !== 'string' || !value.trim() || value.length > 1024) throw new Error('A valid path is required');
  const candidate = resolve(ALLOWED_ROOT, value);
  if (!withinRoot(candidate)) throw new Error('Path is outside the configured bridge root');
  if (mustExist) {
    const canonical = await realpath(candidate);
    if (!withinRoot(canonical)) throw new Error('Resolved path is outside the configured bridge root');
    return canonical;
  }

  // For new destinations, resolve the nearest existing ancestor too, preventing symlink escapes.
  let ancestor = candidate;
  while (true) {
    try {
      const canonicalAncestor = await realpath(ancestor);
      if (!withinRoot(canonicalAncestor)) throw new Error('Resolved path is outside the configured bridge root');
      return candidate;
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
      const parent = dirname(ancestor);
      if (parent === ancestor) throw new Error('Could not validate destination path');
      ancestor = parent;
    }
  }
}

function execFileResult(file, argv, timeout = 30000) {
  return new Promise((resolveResult) => {
    execFile(file, argv, { maxBuffer: 5 * 1024 * 1024, timeout, windowsHide: true }, (err, stdout, stderr) => {
      const output = (stdout || '') + (stderr || '');
      if (err) resolveResult({ status: 'failed', output, error: err.message });
      else resolveResult({ status: 'done', output });
    });
  });
}

async function runOperation(operation, params = {}) {
  if (operation === 'docker.list') {
    return execFileResult('docker', ['ps', '-a', '--format', '{{.Names}}\\t{{.Status}}'], 15000);
  }
  if (operation === 'disk.usage') {
    if (process.platform === 'win32') {
      const script = "$d = Get-CimInstance Win32_LogicalDisk -Filter \"DeviceID='$env:SystemDrive'\"; if ($d -and $d.Size -gt 0) { [pscustomobject]@{total=[math]::Round($d.Size/1GB,1); used=[math]::Round(($d.Size-$d.FreeSpace)/1GB,1); pcent=[math]::Round((($d.Size-$d.FreeSpace)/$d.Size)*100,0)} | ConvertTo-Json -Compress }";
      const result = await execFileResult('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], 15000);
      if (result.status === 'failed') return result;
      try {
        const disk = JSON.parse(result.output.trim());
        return { status: 'done', output: `${disk.total}G ${disk.used}G ${disk.pcent}%`, result: disk };
      } catch { return { status: 'failed', output: result.output, error: 'Could not parse disk usage result' }; }
    }
    const result = await execFileResult('df', ['-h', '/'], 15000);
    if (result.status === 'failed') return result;
    const line = result.output.trim().split(/\r?\n/).slice(-1)[0] || '';
    const parts = line.trim().split(/\s+/);
    if (parts.length < 5) return { status: 'failed', output: result.output, error: 'Unexpected df output' };
    const disk = { total: parts[1], used: parts[2], pcent: parts[4] };
    return { status: 'done', output: `${disk.total} ${disk.used} ${disk.pcent}`, result: disk };
  }
  if (operation === 'ollama.pull' || operation === 'ollama.remove') {
    if (!isSafeModelName(params.model)) return { status: 'failed', error: 'Invalid Ollama model name' };
    if (operation === 'ollama.remove' && params.confirm !== true) return { status: 'failed', error: 'Model removal requires explicit confirmation' };
    return execFileResult('ollama', [operation === 'ollama.pull' ? 'pull' : 'rm', params.model], operation === 'ollama.pull' ? 20 * 60 * 1000 : 30000);
  }
  return { status: 'failed', error: 'Operation is not allowlisted' };
}

async function runScan(folder) {
  const start = await resolveAllowedPath(folder);
  const out = [];
  async function walk(dir, depth) {
    if (depth > 3 || out.length >= 2000) return;
    let entries;
    try { entries = await readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (out.length >= 2000) break;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        out.push({ path: full, type: 'dir' });
        await walk(full, depth + 1);
      } else if (entry.isFile()) {
        try { const s = await stat(full); out.push({ path: full, type: 'file', size: s.size, ext: extname(entry.name) }); } catch {}
      }
    }
  }
  await walk(start, 0);
  return { status: 'done', output: JSON.stringify(out, null, 2), result: { files: out, truncated: out.length >= 2000, allowed_root: ALLOWED_ROOT } };
}

async function runIngest(filePath) {
  try {
    const safePath = await resolveAllowedPath(filePath);
    const data = await readFile(safePath, 'utf8');
    return { status: 'done', output: data.slice(0, 50000), result: { content: data.slice(0, 50000), truncated: data.length > 50000 } };
  } catch (e) { return { status: 'failed', error: e.message }; }
}

async function runOrganize(mapping, root) {
  const log = [];
  if (!mapping || typeof mapping !== 'object' || Array.isArray(mapping) || Object.keys(mapping).length > 200) return { status: 'failed', error: 'Invalid file mapping' };
  let destRoot;
  try { destRoot = root ? await resolveAllowedPath(root, { mustExist: false }) : ALLOWED_ROOT; }
  catch (e) { return { status: 'failed', error: e.message }; }
  for (const [source, folder] of Object.entries(mapping)) {
    try {
      if (typeof folder !== 'string' || !/^[A-Za-z0-9 _.-]{1,64}$/.test(folder) || folder === '.' || folder === '..') throw new Error('Invalid destination folder');
      const safeSource = await resolveAllowedPath(source);
      const sourceInfo = await stat(safeSource);
      if (!sourceInfo.isFile()) throw new Error('Only regular files can be organized');
      const destDir = resolve(destRoot, folder);
      if (!withinRoot(destDir)) throw new Error('Destination is outside the configured bridge root');
      await mkdir(destDir, { recursive: true });
      const canonicalDestDir = await realpath(destDir);
      if (!withinRoot(canonicalDestDir)) throw new Error('Resolved destination is outside the configured bridge root');
      const dest = join(canonicalDestDir, basename(safeSource));
      if (!withinRoot(dest)) throw new Error('Destination is outside the configured bridge root');
      await copyFile(safeSource, dest, constants.COPYFILE_EXCL);
      try {
        await unlink(safeSource);
        log.push(`moved ${safeSource} -> ${dest}`);
      } catch (e) {
        log.push(`copied ${safeSource} -> ${dest}, but source remains: ${e.message}`);
      }
    } catch (e) { log.push(`failed ${source}: ${e.message}`); }
  }
  return { status: 'done', output: log.join('\n'), result: { moved_or_failed: log.length } };
}

async function runProxy(input) {
  const validation = validateOllamaProxyRequest({ url: input.url, method: input.method, headers: input.headers, body: input.body });
  if (!validation.ok) return { status: 'failed', error: validation.error };
  const request = validation.normalized;
  try {
    const res = await fetch(request.url, { method: request.method, headers: request.headers, body: request.body, signal: AbortSignal.timeout(120000) });
    const text = await res.text();
    return { status: 'done', output: text.slice(0, 50000), result: { status: res.status, headers: { 'content-type': res.headers.get('content-type') || '' } } };
  } catch (e) { return { status: 'failed', error: e.message }; }
}

async function handle(cmd) {
  try {
    const validation = validateQueuedLocalCommand(cmd);
    if (!validation.ok) throw new Error(validation.error || 'Rejected by local bridge safety contract');
    let result;
    if (cmd.type === 'operation') result = await runOperation(cmd.command, cmd.args || {});
    else if (cmd.type === 'scan') result = await runScan(cmd.command);
    else if (cmd.type === 'ingest') result = await runIngest(cmd.command);
    else if (cmd.type === 'organize') result = await runOrganize(cmd.args?.mapping || {}, cmd.args?.root);
    else if (cmd.type === 'proxy') result = await runProxy({ url: cmd.command, method: cmd.args?.method, headers: cmd.args?.headers, body: cmd.args?.body });
    else result = { status: 'failed', error: 'Unsupported operation type' };
    await post('/functions/bridgeResult', { session_id: SESSION_ID, command_id: cmd.command_id, ...result });
    console.log(`[bridge] ${cmd.type} ${String(cmd.command || '').slice(0, 48)} -> ${result.status}`);
  } catch (e) {
    try { await post('/functions/bridgeResult', { session_id: SESSION_ID, command_id: cmd.command_id, status: 'failed', error: e.message }); } catch {}
  }
}

let polling = false;
async function poll() {
  if (polling) return;
  polling = true;
  let res;
  try {
    res = await post('/functions/bridgePoll', { session_id: SESSION_ID });
  } catch (e) {
    console.error('[bridge] poll failed:', e.message);
  } finally {
    polling = false;
  }
  // Do not hold the poll lock while an operation runs: the interval must keep the bridge heartbeat fresh.
  if (res && res.command_id) await handle(res);
  else if (res && res.error) console.error('[bridge] poll rejected a command by safety contract');
}

await register();
console.log(`[bridge] polling ${APP_URL} every 3s. Ctrl+C to stop.`);
setInterval(poll, 3000);
poll();
