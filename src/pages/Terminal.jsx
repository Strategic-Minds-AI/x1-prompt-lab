import { useState } from "react";
import { Terminal as TermIcon, Download, Copy, Loader2, Wifi, WifiOff, Plus, CornerDownLeft } from "lucide-react";
import { useBridge } from "@/hooks/useBridge";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

export default function Terminal() {
  const { sessionId, online, loading, create, sendCommand } = useBridge();
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const appUrl = "https://prompt-lab-copy-c8730880.base44.app";
  const runCmd = `node local-bridge.mjs --app=${appUrl} --session=${sessionId || "<SESSION>"}`;

  const copy = () => {
    navigator.clipboard?.writeText(runCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const run = async () => {
    if (!input.trim() || !online || busy) return;
    setBusy(true);
    const cmd = input.trim();
    setInput("");
    setHistory((h) => [...h, { command: cmd, output: "", status: "pending" }]);
    try {
      const cmdId = await sendCommand("shell", cmd);
      let done = false, attempts = 0;
      while (!done && attempts < 40) {
        await new Promise((r) => setTimeout(r, 1000));
        const { items } = await base44.entities.LocalCommand.filter({ id: cmdId }, { limit: 1 });
        const c = items[0];
        if (c && (c.status === "done" || c.status === "failed")) {
          done = true;
          setHistory((h) => h.map((e, i) => (i === h.length - 1 ? { ...e, output: c.output || c.error || "", status: c.status } : e)));
        }
        attempts++;
      }
      if (!done) setHistory((h) => h.map((e, i) => (i === h.length - 1 ? { ...e, output: "timeout", status: "failed" } : e)));
    } catch (error) {
      setHistory((h) => h.map((entry, i) => (i === h.length - 1 ? { ...entry, output: String(error), status: "failed" } : entry)));
    }
    setBusy(false);
  };

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <TermIcon className="w-5 h-5 text-primary" />
        <h1 className="text-2xl font-bold">Local Terminal</h1>
        <span className={`ml-auto flex items-center gap-1.5 text-xs font-mono ${online ? "text-success" : "text-muted-foreground"}`}>
          {online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />} {online ? "bridge online" : "bridge offline"}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-2">Run the bridge from the folder you want to authorize. Commands are restricted to an allowlist; arbitrary shell execution is disabled.</p>
      <p className="text-xs text-muted-foreground mb-6">The terminal accepts only allowlisted legacy diagnostics and Ollama model pulls. Use the Dashboard and Ollama pages for the typed controls; unsupported shell commands are rejected.</p>

      {!sessionId && !loading && (
        <div className="rounded-xl border border-border bg-card p-5 mb-6">
          <p className="text-sm text-muted-foreground mb-3">No bridge yet. Create one to get your session token.</p>
          <button onClick={create} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
            <Plus className="w-4 h-4" /> Create bridge session
          </button>
        </div>
      )}

      {sessionId && (
        <div className="rounded-xl border border-border bg-card p-5 mb-6 space-y-3">
          <div>
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">1. Download the bridge</div>
            <a href={`${appUrl}/local-bridge.mjs`} download className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
              <Download className="w-4 h-4" /> local-bridge.mjs
            </a>
          </div>
          <div>
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">2. Run it in a terminal (Node 18+)</div>
            <div className="flex items-center gap-2 bg-secondary/40 border border-border rounded-lg p-2.5 font-mono text-xs">
              <code className="flex-1 break-all">{runCmd}</code>
              <button onClick={copy} className="text-muted-foreground hover:text-foreground">{copied ? "copied" : <Copy className="w-3.5 h-3.5" />}</button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Status updates automatically once the bridge connects.</p>
        </div>
      )}

      <div className="rounded-xl border border-border bg-black/80 p-4 font-mono text-xs min-h-[300px] flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-2 mb-3">
          {history.length === 0 && <div className="text-muted-foreground">No commands yet. Type a command below.</div>}
          {history.map((h, i) => (
            <div key={i}>
              <div className="text-emerald-400">$ {h.command}</div>
              {h.status === "pending" && <div className="text-muted-foreground flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> runningâ€¦</div>}
              {h.status !== "pending" && <pre className="text-muted-foreground whitespace-pre-wrap break-all">{h.output}</pre>}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 border-t border-border pt-3">
          <span className="text-emerald-400">$</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
            disabled={!online || busy}
            placeholder={online ? "enter an approved command (arbitrary shell is blocked)" : "waiting for bridgeâ€¦"}
            className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground disabled:opacity-50"
          />
          <CornerDownLeft className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
