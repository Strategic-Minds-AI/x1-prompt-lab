import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Library, Plus, Trash2, Play, Search, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

const CATEGORIES = ["Website Builders", "Content Systems", "Automations", "Data Extraction", "Agents", "Code Generation", "Analysis", "Optimized", "Other"];

export default function PromptLibrary() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", category: "Other", goal: "", prompt_text: "", tags: "", quality_score: null });

  const load = async () => {
    setLoading(true);
    const q = {};
    if (filter !== "all") q.category = filter;
    if (query.trim()) q.title = { $regex: query.trim(), $options: "i" };
    const { items } = await base44.entities.PromptTemplate.filter(q, { sort: "-created_date", limit: 100 });
    setTemplates(items);
    const cats = await base44.entities.PromptTemplate.list({ distinct: "category" });
    setCategories([...new Set([...CATEGORIES, ...(cats.items || [])])]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter, query]);

  const createTemplate = async () => {
    if (!form.title.trim() || !form.prompt_text.trim()) {
      toast({ title: "Title and prompt are required", variant: "destructive" });
      return;
    }
    await base44.entities.PromptTemplate.create({
      title: form.title,
      category: form.category,
      goal: form.goal,
      prompt_text: form.prompt_text,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      quality_score: form.quality_score ? Number(form.quality_score) : null,
    });
    setForm({ title: "", category: "Other", goal: "", prompt_text: "", tags: "", quality_score: null });
    setShowForm(false);
    toast({ title: "Template created" });
    load();
  };

  const remove = async (id) => {
    await base44.entities.PromptTemplate.delete(id);
    load();
  };

  const loadIntoStudio = (t) => {
    navigate(`/prompt-studio?prompt=${encodeURIComponent(t.prompt_text)}`);
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Library className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Prompt Library</h1>
            <p className="text-sm text-muted-foreground">Strategic prompt templates — load into the Studio, or create your own.</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(!showForm)} variant="outline" className="gap-2">
          <Plus className="w-4 h-4" /> New Template
        </Button>
      </div>

      {showForm && (
        <div className="mb-6 p-4 rounded-lg border border-border bg-card space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wide">New Template</p>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="bg-secondary/50" />
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Input value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} placeholder="Goal — what this prompt achieves" className="bg-secondary/50" />
          <Textarea value={form.prompt_text} onChange={(e) => setForm({ ...form, prompt_text: e.target.value })} placeholder="The strategic prompt..." className="min-h-[140px] bg-secondary/50 font-mono text-sm" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="tags, comma, separated" className="bg-secondary/50" />
            <Input value={form.quality_score || ""} onChange={(e) => setForm({ ...form, quality_score: e.target.value })} placeholder="quality score 0-100" type="number" className="bg-secondary/50" />
          </div>
          <Button onClick={createTemplate} className="gap-2"><Plus className="w-4 h-4" /> Create Template</Button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search templates..." className="bg-secondary/50 pl-9" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="bg-secondary/50 w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg bg-card/50 p-8 text-center">
          <p className="text-sm text-muted-foreground">No templates yet. Create one, or run the Studio to generate optimized prompts.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((t) => (
            <div key={t.id} className="p-4 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors group">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-sm">{t.title}</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">{t.category}</span>
                </div>
                {t.quality_score != null && <span className="text-xs font-mono text-success">{t.quality_score}/100</span>}
              </div>
              {t.goal && <p className="text-xs text-muted-foreground mb-2">{t.goal}</p>}
              <pre className="text-xs font-mono text-foreground/70 whitespace-pre-wrap break-words max-h-[100px] overflow-y-auto mb-3">{t.prompt_text}</pre>
              {t.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {t.tags.map((tag) => <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{tag}</span>)}
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={() => loadIntoStudio(t)} size="sm" className="gap-1.5 flex-1"><Play className="w-3.5 h-3.5" /> Load in Studio</Button>
                <button onClick={() => remove(t.id)} className="px-2 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}