const SAFE_OPERATIONS = new Set(["docker.list", "disk.usage", "ollama.pull", "ollama.remove"]);
const MODEL_NAME = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/;
const SESSION_ID = /^[A-Za-z0-9-]{32,128}$/;
const MAX_TEXT = 1024;
const MAX_PROXY_BODY = 100_000;
const OLLAMA_PATHS = new Set(["/api/tags", "/api/ps", "/api/chat", "/api/generate", "/api/embeddings", "/api/show"]);

const failure = (error, status = 400) => ({ ok: false, status, error });

export function isSafeModelName(value) {
  return typeof value === "string" && MODEL_NAME.test(value);
}

export function validateOllamaProxyRequest(input = {}) {
  if (typeof input.url !== "string" || input.url.length > MAX_TEXT) return failure("Invalid Ollama URL");
  let url;
  try { url = new URL(input.url); } catch { return failure("Invalid Ollama URL"); }
  const localHosts = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);
  if (url.protocol !== "http:" || !localHosts.has(url.hostname.toLowerCase()) || url.port !== "11434" || url.username || url.password) {
    return failure("Proxy is restricted to the local Ollama service on port 11434", 403);
  }
  if (!OLLAMA_PATHS.has(url.pathname) || url.search || url.hash) return failure("Ollama endpoint is not allowlisted", 403);
  const method = String(input.method || "GET").toUpperCase();
  if (!["GET", "POST"].includes(method)) return failure("HTTP method is not allowlisted", 403);
  if ((url.pathname === "/api/tags" || url.pathname === "/api/ps") && method !== "GET") return failure("This Ollama endpoint is read-only", 403);
  if (url.pathname !== "/api/tags" && url.pathname !== "/api/ps" && method !== "POST") return failure("This Ollama endpoint requires POST", 400);
  const body = input.body == null ? undefined : (typeof input.body === "string" ? input.body : JSON.stringify(input.body));
  if (body && body.length > MAX_PROXY_BODY) return failure("Ollama request body exceeds 100 KB");
  const headers = {};
  const contentType = input.headers?.["Content-Type"] || input.headers?.["content-type"];
  if (contentType) {
    if (String(contentType).toLowerCase() !== "application/json") return failure("Only application/json is permitted");
    headers["Content-Type"] = "application/json";
  }
  return { ok: true, normalized: { url: url.toString(), method, headers, body } };
}

function validateOperation(command, args = {}) {
  if (!SAFE_OPERATIONS.has(command)) return failure("Operation is not allowlisted");
  if (command === "ollama.pull" || command === "ollama.remove") {
    if (!isSafeModelName(args.model)) return failure("A valid Ollama model name is required");
    if (command === "ollama.remove" && args.confirm !== true) return failure("Model removal requires explicit confirmation", 403);
  }
  return { ok: true, normalized: { type: "operation", command, args: command.startsWith("ollama.") ? { model: args.model, ...(command === "ollama.remove" ? { confirm: true } : {}) } : {} } };
}

function validateOrganizeArgs(args = {}) {
  const mapping = args.mapping;
  if (!mapping || typeof mapping !== "object" || Array.isArray(mapping) || Object.keys(mapping).length > 200) return failure("A file mapping with at most 200 entries is required");
  for (const [source, folder] of Object.entries(mapping)) {
    if (typeof source !== "string" || !source.trim() || source.length > MAX_TEXT) return failure("Invalid source path in mapping");
    if (typeof folder !== "string" || !/^[A-Za-z0-9 _.-]{1,64}$/.test(folder) || folder === "." || folder === "..") return failure("Invalid destination folder name");
  }
  if (args.root != null && (typeof args.root !== "string" || args.root.length > MAX_TEXT)) return failure("Invalid organization root");
  return { ok: true, normalized: { mapping, ...(args.root ? { root: args.root } : {}) } };
}

export function normalizeLocalCommand(body = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return failure("JSON object required");
  if (typeof body.session_id !== "string" || !SESSION_ID.test(body.session_id)) return failure("Invalid bridge session");
  let type = body.type;
  let command = body.command;
  let args = body.args && typeof body.args === "object" && !Array.isArray(body.args) ? body.args : {};

  // Compatibility adapter: only exact known legacy commands are translated into typed operations.
  if (type === "shell") {
    const raw = typeof command === "string" ? command.trim() : "";
    const canonical = raw.replace(/\\\\t/g, "\t").replace(/\\t/g, "\t");
    if (canonical === "docker ps -a --format '{{.Names}}\t{{.Status}}'") {
      type = "operation"; command = "docker.list"; args = {};
    } else if (raw === "df -h / --output size,used,pcent 2>/dev/null | tail -1") {
      type = "operation"; command = "disk.usage"; args = {};
    } else {
      const pull = raw.match(/^ollama pull ["']?([A-Za-z0-9][A-Za-z0-9._:/-]{0,127})["']?$/);
      if (pull && isSafeModelName(pull[1])) {
        type = "operation"; command = "ollama.pull"; args = { model: pull[1] };
      } else {
        return failure("Arbitrary shell execution is disabled. Use a supported typed operation.", 403);
      }
    }
  }

  let normalized;
  if (type === "operation") {
    const result = validateOperation(command, args);
    if (!result.ok) return result;
    normalized = result.normalized;
  } else if (type === "scan" || type === "ingest") {
    if (typeof command !== "string" || !command.trim() || command.length > MAX_TEXT) return failure("A valid path is required");
    normalized = { type, command: command.trim(), args: {} };
  } else if (type === "organize") {
    const result = validateOrganizeArgs(args);
    if (!result.ok) return result;
    normalized = { type, command: "", args: result.normalized };
  } else {
    return failure("Command type is not allowlisted", 403);
  }

  const candidate = { session_id: body.session_id, ...normalized, status: "pending" };
  const check = validateQueuedLocalCommand(candidate);
  if (!check.ok) return check;
  return { ok: true, command: candidate };
}

export function validateQueuedLocalCommand(cmd = {}) {
  if (!cmd || typeof cmd !== "object" || Array.isArray(cmd)) return failure("Invalid queued command");
  if (cmd.type === "operation") return validateOperation(cmd.command, cmd.args || {});
  if (cmd.type === "scan" || cmd.type === "ingest") {
    if (typeof cmd.command !== "string" || !cmd.command.trim() || cmd.command.length > MAX_TEXT) return failure("Invalid path command");
    return { ok: true };
  }
  if (cmd.type === "organize") return validateOrganizeArgs(cmd.args || {});
  if (cmd.type === "proxy") {
    const result = validateOllamaProxyRequest({ url: cmd.command, ...(cmd.args || {}) });
    return result.ok ? { ok: true } : result;
  }
  return failure("Queued command type is not allowlisted", 403);
}
