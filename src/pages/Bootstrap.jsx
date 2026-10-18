import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle2, Circle, Plus, Loader2, ListChecks, Rocket } from "lucide-react";

export const PHASES = [
  "Control Plane Core",
  "Local System Mastery",
  "Cloud Infrastructure",
  "Unified Agent Brain",
  "Self-Operating & Evolving",
  "Autonomous AI Company",
  "The Last Key",
];

export default function Bootstrap() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newPhase, setNewPhase] = useState(PHASES[0]);
  const { toast } = useToast();

  const load = async () => {
    try {
      const { items } = await base44.entities.BootstrapTask.filter({}, { sort: "order", limit: 300 });
      setTasks(items);
    } catch { /* ignore */ }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toggle = async (t) => {
    setTasks((ts) => ts.map((x) => (x.id === t.id ? { ...x, done: !t.done } : x)));
    try { await base44.entities.BootstrapTask.update(t.id, { done: !t.done }); }
    catch { load(); }
  };

  const add = async () => {
    if (!newTitle.trim()) return;
    try {
      const order = tasks.filter((t) => t.phase === newPhase).length;
      await base44.entities.BootstrapTask.create({ phase: newPhase, title: newTitle.trim(), done: false, order });
      setNewTitle("");
      load();
    } catch (e) { toast({ title: "Failed to add", description: String(e), variant: "destructive" }); }
  };

  const byPhase = (phase) => tasks.filter((t) => t.phase === phase);
  const progress = (phase) => {
    const ps = byPhase(phase);
    if (!ps.length) return 0;
    return Math.round((ps.filter((t) => t.done).length / ps.length) * 100);
  };
  const overall = () => {
    if (!tasks.length) return 0;
    return Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100);
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <Rocket className="w-5 h-5 text-primary" />
        <h1 className="text-2xl font-bold">System Bootstrap Roadmap</h1>
        <span className="ml-auto text-xs font-mono text-muted-foreground">{overall()}% complete</span>
      </div>
      <p className="text-sm text-muted-foreground mb-5">The full plan to make this a self-operating, self-learning, evolving autonomous system.</p>

      <div className="h-2 rounded-full bg-secondary overflow-hidden mb-6">
        <div className="h-full bg-primary transition-all" style={{ width: `${overall()}%` }} />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="w-4 h-4 animate-spin" /> loading roadmap…</div>
      ) : (
        <div className="space-y-5">
          {PHASES.map((phase) => {
            const ps = byPhase(phase);
            const p = progress(phase);
            return (
              <div key={phase} className="rounded-xl bg-card border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold flex items-center gap-2"><ListChecks className="w-4 h-4 text-primary" /> {phase}</h2>
                  <span className="text-xs font-mono text-muted-foreground">{ps.filter((t) => t.done).length}/{ps.length} · {p}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden mb-3">
                  <div className="h-full bg-primary/70 transition-all" style={{ width: `${p}%` }} />
                </div>
                <div className="space-y-1">
                  {ps.map((t) => (
                    <button key={t.id} onClick={() => toggle(t)} className="flex items-start gap-2.5 w-full text-left p-2 rounded-lg hover:bg-secondary/40 transition-colors">
                      {t.done ? <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" /> : <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />}
                      <div className={t.done ? "text-sm text-muted-foreground line-through" : "text-sm"}>
                        {t.title}
                        {t.detail && <div className="text-xs text-muted-foreground mt-0.5">{t.detail}</div>}
                      </div>
                    </button>
                  ))}
                  {ps.length === 0 && <p className="text-xs text-muted-foreground px-2">No tasks yet.</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 rounded-xl bg-card border border-border p-4">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-2">Add a task</div>
        <div className="flex gap-2">
          <select value={newPhase} onChange={(e) => setNewPhase(e.target.value)} className="px-2.5 py-1.5 rounded-lg border border-input bg-transparent text-sm">
            {PHASES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="new task…"
            className="flex-1 px-2.5 py-1.5 rounded-lg border border-input bg-transparent text-sm" />
          <button onClick={add} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>
    </div>
  );
}