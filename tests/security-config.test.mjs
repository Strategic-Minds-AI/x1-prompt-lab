import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = async (path) => readFile(new URL(path, root), "utf8");
const parse = async (path) => JSON.parse(await read(path));

test("local bridge and command records are admin-only at the entity boundary", async () => {
  for (const path of ["base44/entities/LocalBridge.jsonc", "base44/entities/LocalCommand.jsonc"]) {
    const schema = await parse(path);
    for (const action of ["create", "read", "update", "delete"]) {
      assert.deepEqual(schema.rls?.[action], { user_condition: { role: "admin" } }, `${path} ${action}`);
    }
  }
});

test("bridge admission, status, and proxy functions enforce admin authorization", async () => {
  for (const path of [
    "base44/functions/bridgeCommand/entry.ts",
    "base44/functions/bridgeProxy/entry.ts",
    "base44/functions/bridgeStatus/entry.ts",
  ]) {
    const source = await read(path);
    assert.match(source, /if \(user\.role !== 'admin'\) return Response\.json\(\{ error: 'Forbidden' \}, \{ status: 403 \}\)/, path);
  }
});

test("poll validates the queued contract and result writes are session-bound", async () => {
  const poll = await read("base44/functions/bridgePoll/entry.ts");
  assert.match(poll, /validateQueuedLocalCommand\(cmd\)/);
  const result = await read("base44/functions/bridgeResult/entry.ts");
  assert.match(result, /\{ id: body\.command_id, session_id: body\.session_id \}/);
  assert.match(result, /command\.status !== 'running'/);
});

test("MCP schema documents allowlisted execution and marks commands destructive", async () => {
  const config = await parse("base44/mcp/config.json");
  const tool = config.tools.functions.find((item) => item.name === "run_local_command");
  assert.ok(tool);
  assert.equal(tool.annotations.destructive_hint, true);
  assert.match(tool.description, /Arbitrary shell execution is disabled/);
  assert.ok(tool.input_schema.properties.type.enum.includes("operation"));
});
