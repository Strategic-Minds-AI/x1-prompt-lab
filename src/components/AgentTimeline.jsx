import { Search, Brain, CheckCircle, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const actionConfig = {
  search: { icon: Search, labelEs: "Búsqueda web", labelEn: "Web search", color: "text-primary bg-primary/10 border-primary/20" },
  reason: { icon: Brain, labelEs: "Razonamiento", labelEn: "Reasoning", color: "text-accent bg-accent/10 border-accent/20" },
  done: { icon: CheckCircle, labelEs: "Finalizado", labelEn: "Done", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
};

const labels = {
  es: { thought: "Pensamiento", observationCheck: "Validación de observaciones", query: "Consulta", observation: "Observación", answer: "Respuesta final", step: "Paso", showMore: "Ver más", showLess: "Ver menos" },
  en: { thought: "Thought", observationCheck: "Observation Validation", query: "Query", observation: "Observation", answer: "Final Answer", step: "Step", showMore: "Show more", showLess: "Show less" },
};

export default function AgentTimeline({ iterations, lang }) {
  const t = labels[lang];
  return (
    <div className="space-y-1">
      {iterations.map((iter, i) => {
        const cfg = actionConfig[iter.action] || actionConfig.reason;
        const Icon = cfg.icon;
        return (
          <div key={i}>
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-secondary/30">
                <span className="text-[10px] font-mono text-muted-foreground">{t.step} {i + 1}</span>
                <div className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border ${cfg.color}`}>
                  <Icon className="w-3 h-3" /> {lang === "es" ? cfg.labelEs : cfg.labelEn}
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide mb-1">{t.thought}</p>
                  <p className="text-sm text-foreground/90">{iter.thought}</p>
                </div>
                {iter.observationCheck && (
                  <div className="rounded-md bg-amber-500/5 border border-amber-500/15 p-3">
                    <p className="text-[10px] font-mono text-amber-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> {t.observationCheck}
                    </p>
                    <p className="text-sm text-foreground/80">{iter.observationCheck}</p>
                  </div>
                )}
                {iter.actionInput && (
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide mb-1">{t.query}</p>
                    <p className="text-sm text-foreground/90 font-mono bg-secondary/50 px-3 py-1.5 rounded">{iter.actionInput}</p>
                  </div>
                )}
                {iter.observation && <Observation text={iter.observation} label={t.observation} showMore={t.showMore} showLess={t.showLess} />}
                {iter.answer && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-wide mb-1">{t.answer}</p>
                    <p className="text-sm text-foreground/90">{iter.answer}</p>
                  </div>
                )}
              </div>
            </div>
            {i < iterations.length - 1 && <div className="flex justify-center py-1"><div className="w-px h-4 bg-border" /></div>}
          </div>
        );
      })}
    </div>
  );
}

function Observation({ text, label, showMore, showLess }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 300;
  const display = expanded || !isLong ? text : text.slice(0, 300) + "...";
  return (
    <div>
      <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-muted-foreground/80 whitespace-pre-wrap">{display}</p>
      {isLong && (
        <button onClick={() => setExpanded(!expanded)} className="text-xs text-primary mt-1 flex items-center gap-1">
          {expanded ? <><ChevronUp className="w-3 h-3" /> {showLess}</> : <><ChevronDown className="w-3 h-3" /> {showMore}</>}
        </button>
      )}
    </div>
  );
}