import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../public/local-bridge.mjs", import.meta.url), "utf8");

test("local bridge uses argv-based execution, not arbitrary shell exec", () => {
  assert.match(source, /import \{ execFile \} from 'node:child_process'/);
  assert.doesNotMatch(source, /import \{ exec \} from 'node:child_process'/);
  assert.doesNotMatch(source, /\bexec\(cmd\.command/);
  assert.match(source, /SAFE_OPERATIONS/);
  assert.match(source, /validateQueuedLocalCommand\(cmd\)/);
});

test("file operations are confined to a canonical allowed root", () => {
  assert.match(source, /BRIDGE_ALLOWED_ROOT/);
  assert.match(source, /await realpath\(resolve\(arg\('root'\)/);
  assert.match(source, /Path is outside the configured bridge root/);
  assert.match(source, /Resolved path is outside the configured bridge root/);
  assert.match(source, /await realpath\(destDir\)/);
  assert.match(source, /constants\.COPYFILE_EXCL/);
  assert.match(source, /Only regular files can be organized/);
});

test("proxy validates the local Ollama service before fetch", () => {
  assert.match(source, /Proxy is restricted to local Ollama on port 11434/);
  assert.match(source, /Ollama endpoint is not allowlisted/);
  assert.match(source, /const validation = validateOllamaProxyRequest/);
});
