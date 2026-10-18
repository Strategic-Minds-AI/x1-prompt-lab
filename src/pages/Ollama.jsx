import { useState } from "react";
import { Cpu, Loader2, RefreshCw, Download, Send, Wifi, WifiOff, Search, Trash2 } from "lucide-react";
import { useBridge } from "@/hooks/useBridge";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

const OLLAMA_URL = "http://localhost:11434";

export default function Ollama() {
  const { sessionId, online, loading } = useBridge();
  const { toast } = useToast();
  const [status, setStatus] = useState("idle"); // idle | detecting | online | offline
  const [models, setModels] = useState([]);
  const [selected, setSelected] = useState("");
  const [pullName, setPullName] = useState("");
  const [pulling, setPulling] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [running, setRunning] = useState(false);

  const proxy = async (path, method = "GET", body) => {
    const res = await base44.functions.invoke("bridgeProxy", {
      session_id: sessionId,
      url: `${OLLAMA_URL}${path}`,
      method,
      headers: body ? { "Content-Type": "application/json" } : {},
      body,
    });
    return res.data;
  };

  const detect = async () => {
    if (!online) return;
    setStatus("detecting");
    try {
      const r = await proxy("/api/tags");
      if (r.error || !r.status || r.status >= 400) {
        setStatus("offline");
        setModels([]);
        return;
      }
      const data = JSON.parse(r.body || "{}");
      setModels(data.models || []);
      setStatus("online");
      if (!selected && (data.models || []).length) setSelected(data.models[0].name);
    } catch {
      setStatus("offline");
      setModels([]);
    }
  };

  const pull = async () => {
    const name = pullName.trim();
    if (!name || !online) return;
    setPulling(name);
    setPullName("");
    try {
      const cmdId = await base44.functions.invoke("bridgeCommand", {
        session_id: sessionId, type: "operation", command: "ollama.pull", args: { model: name },
      });
      let done = false, attempts = 0;
      while (!done && attempts < 120) {
        await new Promise((r) => setTimeout(r, 2000));
        const { items } = await base44.entities.LocalCommand.filter({ id: cmdId.data?.command_id }, { limit: 1 });
        const c = items[0];
        if (c && (c.status === "done" || c.status === "failed")) {
          done = true;
          if (c.status === "failed") toast({ title: "Pull failed", description: c.error, variant: "destructive" });
          else toast({ title: `Pulled ${name}` });
        }
        attempts++;
      }
      if (!done) toast({ title: "Still pulling in background — check Terminal" });
      detect();
    } catch (e) {
      toast({ title: "Pull failed", description: String(e), variant: "destructive" });
    }
    setPulling(null);
  };

  const removeModel = async (name) => {
    if (!online || !window.confirm(`Remove local Ollama model "${name}"? This deletes the model from this computer.`)) return;
    try {
      const cmdId = await base44.functions.invoke("bridgeCommand", {
        session_id: sessionId, type: "operation", command: "ollama.remove", args: { model: name, confirm: true },
      });
      let done = false, attempts = 0;
      while (!done && attempts < 30) {
        await new Promise((r) => setTimeout(r, 1000));
        const { items } = await base44.entities.LocalCommand.filter({ id: cmdId.data?.command_id }, { limit: 1 });
        const c = items[0];
        if (c && (c.status === "done" || c.status === "failed")) { done = true; detect(); }
        attempts++;
      }
    } catch (e) { toast({ title: "Remove failed", description: String(e), variant: "destructive" }); }
  };

  const chat = async () => {
    if (!prompt.trim() || !selected || !online || running) return;
    setRunning(true);
    setAnswer("");
    try {
      const r = await proxy("/api/chat", "POST", JSON.stringify({
        model: selected, messages: [{ role: "user", content: prompt }], stream: false,
      }));
      if (r.error) { setAnswer(`Error: ${r.error}`); }
      else {
        const data = JSON.parse(r.body || "{}");
        setAnswer(data?.message?.content || r.body);
      }
    } catch (e) { setAnswer(`Error: ${e}`); }
    setRunning(false);
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <Cpu className="w-5 h-5 text-primary" />
        <h1 className="text-2xl font-bold">Ollama Control</h1>
        <span className={`ml-auto flex items-center gap-1.5 text-xs font-mono ${online ? "text-success" : "text-muted-foreground"}`}>
          {online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />} {online ? "bridge online" : "bridge offline"}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-6">Auto-detect local Ollama, manage models, and run prompts through the tunnel.</p>

      <div className="flex items-center gap-2 mb-6">
        <button onClick={detect} disabled={!online || status === "detecting"}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
          {status === "detecting" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Detect Ollama
        </button>
        {status === "online" && <span className="text-xs text-success font-mono">Ollama online · {models.length} model(s)</span>}
        {status === "offline" && <span className="text-xs text-destructive font-mono">Not found — run `ollama serve` on your machine</span>}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Models */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Installed Models</h2>
            <button onClick={detect} className="text-muted-foreground hover:text-foreground"><RefreshCw className="w-3.5 h-3.5" /></button>
          </div>
          {models.length === 0 ? (
            <p className="text-xs text-muted-foreground">No models detected. Pull one below.</p>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {models.map((m) => (
                <div key={m.name} className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-sm ${selected === m.name ? "border-primary bg-primary/5" : "border-border"}`}>
                  <button onClick={() => setSelected(m.name)} className="flex-1 text-left">
                    <div className="font-mono">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{(m.size / 1e9).toFixed(1)} GB</div>
                  </button>
                  <button onClick={() => removeModel(m.name)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 border-t border-border pt-3">
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-2">Pull a model</div>
            <div className="flex gap-2">
              <input value={pullName} onChange={(e) => setPullName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && pull()}
                placeholder="llama3.2, qwen2.5, mistral…"
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-input bg-transparent text-sm font-mono" />
              <button onClick={pull} disabled={!pullName.trim() || pulling} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium disabled:opacity-50">
                {pulling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} {pulling ? pulling : "Pull"}
              </button>
            </div>
            {pulling && <p className="text-xs text-muted-foreground mt-2">Pulling {pulling}… this can take a few minutes.</p>}
          </div>
        </div>

        {/* Chat */}
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col">
          <h2 className="text-sm font-semibold mb-3">Run Prompt</h2>
          {!selected && <p className="text-xs text-muted-foreground mb-3">Select a model to run a prompt.</p>}
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} disabled={!selected}
            placeholder="Ask the local model…"
            className="flex-1 min-h-[120px] px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none mb-3 disabled:opacity-50" />
          <button onClick={chat} disabled={!selected || !prompt.trim() || running}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Run on {selected || "—"}
          </button>
          {answer && (
            <pre className="mt-3 text-sm whitespace-pre-wrap break-words bg-secondary/40 border border-border rounded-lg p-3 max-h-64 overflow-y-auto">{answer}</pre>
          )}
        </div>
      </div>
    </div>
  );
}