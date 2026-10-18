import { useState } from "react";
import { Compass, FolderSearch, Loader2, Sparkles, Check, ArrowRight } from "lucide-react";
import { useBridge } from "@/hooks/useBridge";
import { base44 } from "@/api/base44Client";

export default function Discovery() {
  const { sessionId, online, loading, create, sendCommand } = useBridge();
  const [folder, setFolder] = useState("");
  const [files, setFiles] = useState([]);
  const [mapping, setMapping] = useState(null);
  const [busy, setBusy] = useState(null);
  const [log, setLog] = useState("");

  const waitResult = async (cmdId) => {
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const { items } = await base44.entities.LocalCommand.filter({ id: cmdId }, { limit: 1 });
      const c = items[0];
      if (c && (c.status === "done" || c.status === "failed")) return c;
    }
    return { status: "failed", error: "timeout" };
  };

  const scan = async () => {
    if (!folder.trim() || !online) return;
    setBusy("scan");
    setFiles([]);
    setMapping(null);
    setLog("");
    try {
      const cmdId = await sendCommand("scan", folder.trim());
      const res = await waitResult(cmdId);
      const fl = res.result?.files || [];
      setFiles(fl);
      setLog(res.output || res.error || "");
    } catch (e) { setLog(String(e)); }
    setBusy(null);
  };

  const route = async () => {
    if (!files.length) return;
    setBusy("route");
    setMapping(null);
    try {
      const candidates = files.filter((file) => file.type === "file");
      if (!candidates.length) {
        setLog("No regular files are available to classify inside the authorized root.");
        setBusy(null);
        return;
      }
      const res = await base44.functions.invoke("bridgeRoute", { files: candidates });
      setMapping(res.data || {});
    } catch (e) { setLog(String(e)); }
    setBusy(null);
  };

  const organize = async () => {
    if (!mapping) return;
    setBusy("organize");
    setLog("");
    try {
      const cmdId = await sendCommand("organize", "", { mapping, root: folder.trim() });
      const res = await waitResult(cmdId);
      setLog(res.output || res.error || "");
      setMapping(null);
      setFiles([]);
    } catch (e) { setLog(String(e)); }
    setBusy(null);
  };

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <Compass className="w-5 h-5 text-primary" />
        <h1 className="text-2xl font-bold">Discovery & Ingestion</h1>
        <span className={`ml-auto flex items-center gap-1.5 text-xs font-mono ${online ? "text-success" : "text-muted-foreground"}`}>
          {online ? <Check className="w-3.5 h-3.5" /> : <Loader2 className="w-3.5 h-3.5 animate-spin" />} {online ? "bridge online" : "bridge offline"}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-2">Scan a folder inside the local bridge's configured root, classify files, and organize them into subfolders.</p>
      <p className="text-xs text-muted-foreground mb-6">For safety, start the bridge from the parent folder you want to authorize. Absolute paths outside that root and symlink escapes are rejected; organization never overwrites existing files.</p>

      {!sessionId && !loading && (
        <button onClick={create} className="mb-6 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
          <Sparkles className="w-4 h-4" /> Create bridge session
        </button>
      )}

      <div className="rounded-xl border border-border bg-card p-5 mb-6">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-2">Scan a folder</div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 flex-1 bg-secondary/40 border border-border rounded-lg px-3">
            <FolderSearch className="w-4 h-4 text-muted-foreground" />
            <input value={folder} onChange={(e) => setFolder(e.target.value)} disabled={!online} placeholder="relative path inside the bridge root (e.g. Downloads)" className="flex-1 bg-transparent outline-none py-2 text-sm font-mono placeholder:text-muted-foreground disabled:opacity-50" />
          </div>
          <button onClick={scan} disabled={!online || busy === "scan" || !folder.trim()} className="flex items-center gap-1.5 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
            {busy === "scan" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderSearch className="w-4 h-4" />} Scan
          </button>
        </div>
      </div>

      {files.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest">{files.length} files found</div>
            <button onClick={route} disabled={busy === "route"} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-sm font-medium disabled:opacity-50">
              {busy === "route" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Auto-classify
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto space-y-1 text-xs font-mono">
            {files.slice(0, 100).map((f, i) => (
              <div key={i} className="flex items-center justify-between text-muted-foreground">
                <span className="truncate">{f.path}</span>
                {mapping && mapping[f.path] && <span className="text-primary ml-2 flex items-center gap-1"><ArrowRight className="w-3 h-3" />{mapping[f.path]}</span>}
              </div>
            ))}
          </div>
          {mapping && (
            <button onClick={organize} disabled={busy === "organize"} className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-success text-white text-sm font-medium disabled:opacity-50">
              {busy === "organize" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Confirm & organize
            </button>
          )}
        </div>
      )}

      {log && (
        <div className="rounded-xl border border-border bg-black/80 p-4 font-mono text-xs whitespace-pre-wrap break-all text-muted-foreground max-h-60 overflow-y-auto">{log}</div>
      )}
    </div>
  );
}