import { useState, useEffect } from "react";
import { GitCompare, Play, Search, Check, X, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import DriveConnect from "@/components/DriveConnect";

/** @type {Array<{ id: "claude-sonnet-5" | "gpt_6_sol" | "gemini_3_8_flash", label: string, family: string, color: string }>} */
const MODELS = [
  { id: "claude-sonnet-5", label: "Claude Sonnet 5", family: "Anthropic", color: "text-orange-500" },
  { id: "gpt_6_sol", label: "GPT-6 Sol", family: "OpenAI", color: "text-emerald-500" },
  { id: "gemini_3_8_flash", label: "Gemini 3.8 Flash", family: "Google", color: "text-blue-500" },
];

export default function ModelCompare() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [promptText, setPromptText] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [driveConnected, setDriveConnected] = useState(false);

  const load = async () => {
    const q = {};
    if (filter !== "all") q.category = filter;
    if (query.trim()) q.title = { $regex: query.trim(), $options: "i" };
    const { items } = await base44.entities.PromptTemplate.filter(q, { sort: "-created_date", limit: 50 });
    setTemplates(items);
    const cats = await base44.entities.PromptTemplate.list({ distinct: "category" });
    setCategories(cats.items || []);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter, query]);

  const pick = (t) => {
    setSelected(t.id);
    setPromptText(t.prompt_text);
    setResults(null);
  };

  const run = async () => {
    if (!promptText.trim()) return;
    setLoading(true);
    setResults(null);
    const start = Date.now();
    const runs = await Promise.allSettled(
      MODELS.map((m) =>
        base44.integrations.Core.InvokeLLM({ prompt: promptText, model: m.id })
          .then((res) => ({ model: m, output: typeof res === "string" ? res : JSON.stringify(res, null, 2), ok: true, ms: null }))
      )
    );
    const out = runs.map((r, i) => {
      const model = MODELS[i];
      if (r.status === "fulfilled") return r.value;
      return { model, output: null, ok: false, error: String(r.reason?.message || r.reason) };
    });
    setResults(out);
    setLoading(false);
    const elapsed = Date.now() - start;
    try {
      await base44.entities.PromptRun.create({
        mode: "compare",
        input: promptText,
        output: JSON.stringify(out.map((o) => ({ model: o.model.id, ok: o.ok }))),
        model: "multi",
        notes: `Compared ${MODELS.length} models in ${elapsed}ms`,
      });
      if (driveConnected) {
        base44.functions.invoke("syncPromptToDrive", {
          title: "compare-" + Date.now(),
          content: `# Model Comparison\n\n## Prompt\n${promptText}\n\n${out.map((o) => `\n## ${o.model.label}\n${o.ok ? o.output : "ERROR: " + ("error" in o ? o.error : "Unknown error")}`).join("\n")}`,
          mode: "compare",
        }).then((r) => toast({ title: "Backed up to Google Drive" })).catch(() => setDriveConnected(false));
      }
    } catch (e) {
      toast({ title: "Run saved, Drive backup skipped", description: String(e.message || e), variant: "destructive" });
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <GitCompare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Model Compare</h1>
            <p className="text-sm text-muted-foreground">Run one prompt across Claude, GPT, and Gemini — side by side.</p>
          </div>
        </div>
        <DriveConnect connected={driveConnected} onConnected={() => setDriveConnected(true)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selector */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search library..." className="bg-secondary/50 pl-9" />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
            {templates.map((t) => (
              <button key={t.id} onClick={() => pick(t)} className={`w-full text-left p-2.5 rounded-lg border transition-colors ${selected === t.id ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/30"}`}>
                <p className="text-sm font-medium truncate">{t.title}</p>
                <p className="text-[10px] text-muted-foreground font-mono">{t.category}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Prompt + run */}
        <div className="lg:col-span-2 space-y-3">
          <Textarea value={promptText} onChange={(e) => setPromptText(e.target.value)} placeholder="Select a prompt from the library, or paste one..." className="min-h-[180px] bg-secondary/50 font-mono text-sm" />
          <Button onClick={run} disabled={!promptText.trim() || loading} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {loading ? "Running across 3 models..." : "Compare Models"}
          </Button>
          <p className="text-[10px] text-muted-foreground font-mono">Non-default models use more integration credits.</p>

          {results && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {results.map((r) => (
                <div key={r.model.id} className="border border-border rounded-lg bg-card overflow-hidden flex flex-col">
                  <div className="px-3 py-2 border-b border-border bg-secondary/30 flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-semibold ${r.model.color}`}>{r.model.label}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{r.model.family}</p>
                    </div>
                    {r.ok ? <Check className="w-4 h-4 text-success" /> : <X className="w-4 h-4 text-destructive" />}
                  </div>
                  <pre className="p-3 text-xs font-mono text-foreground/80 whitespace-pre-wrap break-words max-h-[400px] overflow-y-auto flex-1">
                    {r.ok ? r.output : "ERROR: " + r.error}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
