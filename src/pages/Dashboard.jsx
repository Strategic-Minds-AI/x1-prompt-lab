import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Cpu, Container, HardDrive, Wifi, WifiOff, Activity, Server, Database,
  Cloud, Sparkles, ArrowRight, Bot, Zap, Terminal as TermIcon, Plug
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useBridge } from "@/hooks/useBridge";
import SystemTile from "@/components/control/SystemTile";
import LiveActivityChart from "@/components/control/LiveActivityChart";

export default function Dashboard() {
  const { sessionId, online, loading } = useBridge();
  const [ollama, setOllama] = useState({ status: "loading", models: 0 });
  const [docker, setDocker] = useState({ status: "loading", containers: 0, running: 0 });
  const [disk, setDisk] = useState({ status: "loading", total: "", used: "", pcent: "" });
  const [activity, setActivity] = useState([]);
  const [counts, setCounts] = useState({ commands: 0, templates: 0, runs: 0 });

  const runShell = useCallback(async (command) => {
    if (!sessionId || !online) return null;
    const cmdId = await base44.functions.invoke("bridgeCommand", { session_id: sessionId, type: "shell", command });
    let attempts = 0;
    while (attempts < 30) {
      await new Promise((r) => setTimeout(r, 1000));
      const { items } = await base44.entities.LocalCommand.filter({ id: cmdId.data?.command_id }, { limit: 1 });
      const c = items[0];
      if (c && (c.status === "done" || c.status === "failed")) return c;
      attempts++;
    }
    return null;
  }, [sessionId, online]);

  const probe = useCallback(async () => {
    if (!online) {
      setOllama({ status: "offline", models: 0 });
      setDocker({ status: "offline", containers: 0, running: 0 });
      setDisk({ status: "offline", total: "", used: "", pcent: "" });
      return;
    }
    try {
      const r = await base44.functions.invoke("bridgeProxy", { session_id: sessionId, url: "http://localhost:11434/api/tags", method: "GET" });
      if (r.data && !r.data.error && r.data.status && r.data.status < 400) {
        const data = JSON.parse(r.data.body || "{}");
        setOllama({ status: "online", models: (data.models || []).length });
      } else setOllama({ status: "offline", models: 0 });
    } catch { setOllama({ status: "offline", models: 0 }); }

    try {
      const c = await runShell("docker ps -a --format '{{.Names}}\t{{.Status}}'");
      if (c && c.status === "done") {
        const lines = (c.output || "").split("\n").filter(Boolean);
        const running = lines.filter((l) => l.includes("Up")).length;
        setDocker({ status: "online", containers: lines.length, running });
      } else setDocker({ status: "offline", containers: 0, running: 0 });
    } catch { setDocker({ status: "offline", containers: 0, running: 0 }); }

    try {
      const c = await runShell("df -h / --output size,used,pcent 2>/dev/null | tail -1");
      if (c && c.status === "done") {
        const parts = (c.output || "").trim().split(/\s+/);
        setDisk({ status: "online", total: parts[0] || "—", used: parts[1] || "—", pcent: parts[2] || "" });
      } else setDisk({ status: "offline", total: "", used: "", pcent: "" });
    } catch { setDisk({ status: "offline", total: "", used: "", pcent: "" }); }
  }, [sessionId, online, runShell]);

  useEffect(() => { probe(); }, [probe]);
  useEffect(() => {
    const t = setInterval(probe, 30000);
    return () => clearInterval(t);
  }, [probe]);

  useEffect(() => {
    (async () => {
      try {
        const [cmdAgg, templates, runs] = await Promise.all([
          base44.entities.LocalCommand.aggregate({ dateBucket: { field: "created_date", unit: "day" }, limit: 14 }),
          base44.entities.PromptTemplate.count(),
          base44.entities.PromptRun.count(),
        ]);
        const rows = (cmdAgg.rows || []).map((r, i) => {
          const id = r._id;
          const label = typeof id === "string" ? id.slice(5) : (id?.day?.slice(5) || `d${i}`);
          return { day: label, count: r.count || 0 };
        });
        setActivity(rows);
        setCounts({ commands: rows.reduce((s, r) => s + r.count, 0), templates, runs });
      } catch { /* ignore */ }
    })();
  }, []);

  const cloudSystems = [
    { icon: Cloud, name: "Vercel", status: "managed", value: "Deploy", to: "/connections" },
    { icon: Database, name: "Supabase", status: "managed", value: "Data", to: "/connections" },
    { icon: Server, name: "Railway", status: "managed", value: "Runtime", to: "/connections" },
    { icon: Plug, name: "Google WS", status: "managed", value: "Inbox", to: "/connections" },
  ];

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Activity className="w-5 h-5 text-primary animate-pulse-glow" />
        <h1 className="text-2xl font-bold">Control Plane</h1>
        <span className={`ml-auto flex items-center gap-1.5 text-xs font-mono ${online ? "text-success" : "text-muted-foreground"}`}>
          {online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />} {online ? "bridge online" : loading ? "checking…" : "bridge offline"}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-6">Live monitor and control for your local machine, Ollama, Docker, and cloud systems.</p>

      {/* Local system tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SystemTile icon={Wifi} name="Local Bridge" status={online ? "online" : "offline"} value={online ? "Online" : "Offline"} sub={sessionId ? sessionId.slice(0, 8) + "…" : "no session"} to="/terminal" />
        <SystemTile icon={Cpu} name="Ollama" status={ollama.status} value={ollama.status === "online" ? `${ollama.models} models` : "Offline"} sub="local LLM runtime" to="/ollama" />
        <SystemTile icon={Container} name="Docker" status={docker.status} value={docker.status === "online" ? `${docker.running}/${docker.containers}` : "Offline"} sub="running containers" to="/terminal" />
        <SystemTile icon={HardDrive} name="Local Disk" status={disk.status} value={disk.status === "online" ? disk.pcent || "—" : "Offline"} sub={disk.status === "online" ? `${disk.used} / ${disk.total}` : "filesystem"} to="/terminal" />
      </div>

      {/* Chart + cloud systems */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2"><LiveActivityChart data={activity} /></div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">Cloud Systems</div>
          <div className="space-y-2">
            {cloudSystems.map((s) => (
              <Link key={s.name} to={s.to} className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:border-primary/30 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <s.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.value}</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="flex flex-wrap items-center gap-6 mb-6 p-4 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-accent" /><span className="text-sm"><b>{counts.commands}</b> bridge commands</span></div>
        <div className="w-px h-5 bg-border" />
        <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /><span className="text-sm"><b>{counts.templates}</b> prompt templates</span></div>
        <div className="w-px h-5 bg-border" />
        <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-success" /><span className="text-sm"><b>{counts.runs}</b> engineering runs</span></div>
      </div>

      {/* Quick controls */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Link to="/ollama" className="flex items-center gap-2 p-3 rounded-lg bg-card border border-border hover:border-primary/30 text-sm"><Cpu className="w-4 h-4 text-primary" /> Ollama</Link>
        <Link to="/terminal" className="flex items-center gap-2 p-3 rounded-lg bg-card border border-border hover:border-primary/30 text-sm"><TermIcon className="w-4 h-4 text-primary" /> Terminal</Link>
        <Link to="/prompt-studio" className="flex items-center gap-2 p-3 rounded-lg bg-card border border border-border hover:border-primary/30 text-sm"><Sparkles className="w-4 h-4 text-primary" /> Prompt Studio</Link>
        <Link to="/connections" className="flex items-center gap-2 p-3 rounded-lg bg-card border border border-border hover:border-primary/30 text-sm"><Plug className="w-4 h-4 text-primary" /> Connections</Link>
      </div>

      {/* Proactive agent strip */}
      <Link to="/react-agent" className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 hover:border-primary/40 transition-colors">
        <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
          <Bot className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">Autonomous Agent</div>
          <div className="text-xs text-muted-foreground">Proactive monitoring and self-operating control — coming online as agents are wired to the plane.</div>
        </div>
        <ArrowRight className="w-4 h-4 text-primary" />
      </Link>
    </div>
  );
}