import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Wand2, ShieldCheck, RefreshCw, FileCode2, Download, Layers } from "lucide-react";
import StageCard from "@/components/vision/StageCard";
import PromptCard from "@/components/vision/PromptCard";

const CHIPS = [
  "AI lead-generation site for a Miami plumbing company",
  "SaaS onboarding assistant that reduces churn",
  "WhatsApp sales bot for a real estate brokerage",
  "Automated support agent for an e-commerce store",
  "Content repurposing pipeline for a marketing agency",
  "Lead qualification and CRM sync for a B2B startup",
  "Recipe and meal-plan generator for a fitness app",
  "Internal knowledge base Q&A for a law firm",
  "Appointment booking and reminders for a dental clinic",
  "Multi-language product description generator for Shopify",
];

const STRATEGY_SCHEMA = {
  type: "object",
  properties: {
    strategy_summary: { type: "string" },
    pillars: { type: "array", items: { type: "string" } },
    goals: { type: "array", items: { type: "string" } },
    kpis: { type: "array", items: { type: "string" } },
    risks: { type: "array", items: { type: "string" } },
    target_users: { type: "string" },
  },
  required: ["strategy_summary"],
};

const PROMPTS_SCHEMA = {
  type: "object",
  properties: {
    prompts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          role: { type: "string" },
          category: { type: "string" },
          goal: { type: "string" },
          prompt_text: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["title", "prompt_text"],
      },
    },
  },
  required: ["prompts"],
};

const QA_SCHEMA = {
  type: "object",
  properties: {
    results: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          qa_issues: { type: "array", items: { type: "string" } },
          validation_status: { type: "string" },
          recommendation: { type: "string" },
          score: { type: "number" },
        },
        required: ["title", "score"],
      },
    },
    system_score: { type: "number" },
    test_results: { type: "array", items: { type: "string" } },
  },
  required: ["results", "system_score"],
};

const OPTIMIZE_SCHEMA = {
  type: "object",
  properties: {
    improved: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          prompt_text: { type: "string" },
          changes: { type: "string" },
          new_score: { type: "number" },
        },
        required: ["title", "prompt_text"],
      },
    },
  },
  required: ["improved"],
};

const DOCS_SCHEMA = {
  type: "object",
  properties: {
    architecture_doc: { type: "string" },
    prompt_manifest: { type: "string" },
    deployment_plan: { type: "string" },
    crons: { type: "string" },
    sandbox_notes: { type: "string" },
  },
  required: ["architecture_doc"],
};

export default function VisionStudio() {
  const [vision, setVision] = useState("");
  const [stage, setStage] = useState(null);
  const [strategy, setStrategy] = useState(null);
  const [prompts, setPrompts] = useState([]);
  const [qa, setQa] = useState(null);
  const [optimized, setOptimized] = useState([]);
  const [docs, setDocs] = useState(null);
  const [error, setError] = useState(null);

  const run = async (prompt, schema) => {
    const res = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
    return res;
  };

  const reverseEngineer = async () => {
    if (!vision.trim()) return;
    setStage("strategy"); setError(null);
    try {
      const r = await run(`Reverse-engineer a concrete strategy from this vision. Do not invent facts; mark inferences. Vision:\n"""${vision}"""`, STRATEGY_SCHEMA);
      setStrategy(r);
    } catch (e) { setError(String(e.message || e)); }
    setStage(null);
  };

  const generatePrompts = async () => {
    if (!strategy) return;
    setStage("prompts"); setError(null);
    try {
      const r = await run(`Build an end-to-end prompt system for this strategy. Include a router, builder, QA, validator, simulator, and recommender prompt, each with full prompt text. Strategy:\n${JSON.stringify(strategy)}`, PROMPTS_SCHEMA);
      setPrompts(r.prompts || []);
      if (r.prompts?.length) {
        try {
          await base44.entities.PromptTemplate.bulkCreate(
            r.prompts.map((p) => ({
              title: p.title,
              category: p.category || "Vision System",
              goal: p.goal,
              prompt_text: p.prompt_text,
              tags: p.tags || ["vision-studio"],
              source_llm: "vision-studio",
            }))
          );
        } catch {}
      }
    } catch (e) { setError(String(e.message || e)); }
    setStage(null);
  };

  const runQA = async () => {
    if (!prompts.length) return;
    setStage("qa"); setError(null);
    try {
      const r = await run(`Run QA, validation, simulation, and recommendation for each prompt. Score each 0-100. Prompts:\n${JSON.stringify(prompts)}`, QA_SCHEMA);
      setQa(r);
      try {
        await base44.entities.PromptRun.create({
          mode: "goal",
          input: vision,
          output: JSON.stringify(r),
          quality_score: r.system_score,
          model: "vision-studio",
          notes: "QA + validation + recommendation + score",
        });
      } catch {}
    } catch (e) { setError(String(e.message || e)); }
    setStage(null);
  };

  const optimize = async () => {
    if (!qa) return;
    setStage("optimize"); setError(null);
    try {
      const r = await run(`Recursively optimize the prompts that scored below 80. Return improved versions with changes and new scores. QA results:\n${JSON.stringify(qa)}\nOriginal prompts:\n${JSON.stringify(prompts)}`, OPTIMIZE_SCHEMA);
      setOptimized(r.improved || []);
      if (r.improved?.length) {
        try {
          await base44.entities.PromptTemplate.bulkCreate(
            r.improved.map((p) => ({
              title: "Optimized: " + p.title,
              category: "Vision System",
              goal: "Optimized version",
              prompt_text: p.prompt_text,
              quality_score: p.new_score,
              tags: ["vision-studio", "optimized"],
              source_llm: "vision-studio",
            }))
          );
        } catch {}
      }
    } catch (e) { setError(String(e.message || e)); }
    setStage(null);
  };

  const generateDocs = async () => {
    if (!prompts.length) return;
    setStage("docs"); setError(null);
    try {
      const r = await run(`Produce full architectural builder documentation for this prompt system so it can be submitted to a builder agent, Vercel workflow, sandbox, and crons system. Include: system architecture, prompt manifest, deployment plan, cron schedule, and sandbox notes. Strategy:\n${JSON.stringify(strategy)}\nPrompts:\n${JSON.stringify(prompts)}\nQA:\n${JSON.stringify(qa)}`, DOCS_SCHEMA);
      setDocs(r);
    } catch (e) { setError(String(e.message || e)); }
    setStage(null);
  };

  const downloadDocs = () => {
    const md = `# Architecture\n\n${docs?.architecture_doc || ""}\n\n# Prompt Manifest\n\n${docs?.prompt_manifest || ""}\n\n# Deployment Plan\n\n${docs?.deployment_plan || ""}\n\n# Crons\n\n${docs?.crons || ""}\n\n# Sandbox Notes\n\n${docs?.sandbox_notes || ""}`;
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "builder-docs.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Sparkles className="w-6 h-6 text-primary" /> Vision Studio</h1>
        <p className="text-sm text-muted-foreground mt-1">Describe a vision. The system reverse-engineers a strategy, builds an end-to-end prompt system, runs QA + validation + scoring, recursively optimizes, and generates builder docs.</p>
      </div>

      <StageCard icon={Sparkles} title="Vision" step="1." status={stage === "strategy" ? "running" : null}>
        <Textarea value={vision} onChange={(e) => setVision(e.target.value)} placeholder="Describe the product, business, or system you want to build..." rows={3} className="bg-secondary/50" />
        <p className="text-[10px] font-mono text-muted-foreground mt-2 mb-1">Quick fill:</p>
        <div className="flex flex-wrap gap-1.5">
          {CHIPS.map((c) => (
            <button key={c} onClick={() => setVision(c)} className="text-[11px] px-2.5 py-1 rounded-full bg-secondary text-muted-foreground hover:text-foreground hover:bg-accent/20 transition-colors">{c}</button>
          ))}
        </div>
        <div className="mt-3">
          <button onClick={reverseEngineer} disabled={!vision.trim() || stage === "strategy"} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50">
            {stage === "strategy" ? <span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />} Reverse-Engineer Strategy
          </button>
        </div>
      </StageCard>

      {strategy && (
        <StageCard icon={Wand2} title="Strategy" step="2.">
          <p className="text-sm">{strategy.strategy_summary}</p>
          {strategy.target_users && <p className="text-xs text-muted-foreground mt-1">Target users: {strategy.target_users}</p>}
          <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
            <div><span className="font-semibold">Pillars</span><ul className="list-disc pl-4 text-muted-foreground">{strategy.pillars?.map((p, i) => <li key={i}>{p}</li>)}</ul></div>
            <div><span className="font-semibold">Goals</span><ul className="list-disc pl-4 text-muted-foreground">{strategy.goals?.map((g, i) => <li key={i}>{g}</li>)}</ul></div>
            <div><span className="font-semibold">KPIs</span><ul className="list-disc pl-4 text-muted-foreground">{strategy.kpis?.map((k, i) => <li key={i}>{k}</li>)}</ul></div>
            <div><span className="font-semibold">Risks</span><ul className="list-disc pl-4 text-muted-foreground">{strategy.risks?.map((r, i) => <li key={i}>{r}</li>)}</ul></div>
          </div>
          <div className="mt-3">
            <button onClick={generatePrompts} disabled={stage === "prompts"} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50">
              {stage === "prompts" ? <span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <Layers className="w-3.5 h-3.5" />} Generate Prompt System
            </button>
          </div>
        </StageCard>
      )}

      {prompts.length > 0 && (
        <StageCard icon={Layers} title={`Prompt System (${prompts.length})`} step="3.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">{prompts.map((p, i) => <PromptCard key={i} p={p} />)}</div>
          <div className="mt-3">
            <button onClick={runQA} disabled={stage === "qa"} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50">
              {stage === "qa" ? <span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />} QA + Validate + Score
            </button>
          </div>
        </StageCard>
      )}

      {qa && (
        <StageCard icon={ShieldCheck} title="QA + Validation + Score" step="4.">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-semibold">System Score:</span>
            <span className={`text-sm font-mono px-2 py-0.5 rounded ${qa.system_score >= 80 ? "bg-success/20 text-success" : "bg-warning/20 text-warning"}`}>{qa.system_score}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">{qa.results?.map((r, i) => <PromptCard key={i} p={r} score={r.score} />)}</div>
          <div className="mt-3">
            <button onClick={optimize} disabled={stage === "optimize"} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-medium disabled:opacity-50">
              {stage === "optimize" ? <span className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Recursive Optimize
            </button>
          </div>
        </StageCard>
      )}

      {optimized.length > 0 && (
        <StageCard icon={RefreshCw} title="Optimized Prompts" step="5.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">{optimized.map((p, i) => <PromptCard key={i} p={p} score={p.new_score} />)}</div>
        </StageCard>
      )}

      {prompts.length > 0 && (
        <StageCard icon={FileCode2} title="Builder Docs" step="6." status={stage === "docs" ? "running" : null} actionLabel={docs ? "Regenerate" : "Generate"} onAction={generateDocs} disabled={stage === "docs"}>
          {docs ? (
            <div>
              <pre className="text-[11px] font-mono whitespace-pre-wrap max-h-80 overflow-y-auto bg-background/50 p-3 rounded">{docs.architecture_doc}</pre>
              {docs.prompt_manifest && <pre className="text-[11px] font-mono whitespace-pre-wrap max-h-60 overflow-y-auto bg-background/50 p-3 rounded mt-2">{docs.prompt_manifest}</pre>}
              <div className="mt-3">
                <button onClick={downloadDocs} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-medium">
                  <Download className="w-3.5 h-3.5" /> Download builder-docs.md
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Generates architecture, prompt manifest, deployment plan, crons, and sandbox notes ready to submit to a builder agent or Vercel workflow.</p>
          )}
        </StageCard>
      )}

      {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">Error: {error}</div>}
    </div>
  );
}