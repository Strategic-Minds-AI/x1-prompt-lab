import test from "node:test";
import assert from "node:assert/strict";
import { normalizeLocalCommand, validateQueuedLocalCommand, validateOllamaProxyRequest } from "../base44/shared/bridge-contract.js";

const session = "12345678-1234-1234-1234-12345678901212345678901234567890";

test("accepts typed read-only Docker operation", () => {
  const result = normalizeLocalCommand({ session_id: session, type: "operation", command: "docker.list" });
  assert.equal(result.ok, true);
  assert.equal(result.command.command, "docker.list");
});

test("maps exact legacy dashboard command with either escaped or literal tab to a typed operation", () => {
  const commands = [
    "docker ps -a --format '{{.Names}}\\t{{.Status}}'",
    "docker ps -a --format '{{.Names}}\t{{.Status}}'",
  ];
  for (const command of commands) {
    const result = normalizeLocalCommand({ session_id: session, type: "shell", command });
    assert.equal(result.ok, true, JSON.stringify(command));
    assert.equal(result.command.type, "operation");
    assert.equal(result.command.command, "docker.list");
  }
});

test("rejects arbitrary shell execution and shell metacharacters", () => {
  for (const command of ["whoami", "docker ps; whoami", "powershell -Command whoami", "ollama pull x && whoami"]) {
    assert.equal(normalizeLocalCommand({ session_id: session, type: "shell", command }).ok, false, command);
  }
});

test("validates model names and requires explicit removal confirmation", () => {
  assert.equal(normalizeLocalCommand({ session_id: session, type: "operation", command: "ollama.pull", args: { model: "qwen2.5:latest" } }).ok, true);
  assert.equal(normalizeLocalCommand({ session_id: session, type: "operation", command: "ollama.pull", args: { model: 'x"; whoami' } }).ok, false);
  assert.equal(normalizeLocalCommand({ session_id: session, type: "operation", command: "ollama.remove", args: { model: "llama3.1:8b" } }).ok, false);
  assert.equal(normalizeLocalCommand({ session_id: session, type: "operation", command: "ollama.remove", args: { model: "llama3.1:8b", confirm: true } }).ok, true);
});

test("restricts proxy to local Ollama allowlisted endpoints", () => {
  assert.equal(validateOllamaProxyRequest({ url: "http://localhost:11434/api/tags", method: "GET" }).ok, true);
  assert.equal(validateOllamaProxyRequest({ url: "http://localhost:11434/api/chat", method: "POST", body: "{}" }).ok, true);
  assert.equal(validateOllamaProxyRequest({ url: "http://localhost:2375/containers/json", method: "GET" }).ok, false);
  assert.equal(validateOllamaProxyRequest({ url: "http://127.0.0.1:11434/api/tags", method: "POST" }).ok, false);
  assert.equal(validateOllamaProxyRequest({ url: "http://localhost:11434/api/delete", method: "POST" }).ok, false);
});

test("rejects direct queued shell and unknown operation types", () => {
  assert.equal(validateQueuedLocalCommand({ type: "shell", command: "whoami" }).ok, false);
  assert.equal(validateQueuedLocalCommand({ type: "operation", command: "arbitrary" }).ok, false);
});

test("rejects invalid session IDs and malformed organize maps", () => {
  assert.equal(normalizeLocalCommand({ session_id: "short", type: "operation", command: "docker.list" }).ok, false);
  assert.equal(normalizeLocalCommand({ session_id: session, type: "organize", command: "", args: { mapping: { "C:\\secret.txt": "../escape" } } }).ok, false);
});
