export default function PromptCard({ p, score }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold truncate">{p.title}</span>
        {score != null && (
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0 ml-2 ${score >= 80 ? "bg-success/20 text-success" : "bg-warning/20 text-warning"}`}>{score}</span>
        )}
      </div>
      {p.role && <span className="text-[10px] text-muted-foreground font-mono">{p.role}</span>}
      {p.goal && <p className="text-xs text-muted-foreground mt-1">{p.goal}</p>}
      {p.prompt_text && (
        <pre className="text-[11px] font-mono whitespace-pre-wrap mt-2 max-h-32 overflow-y-auto bg-background/50 p-2 rounded">{p.prompt_text}</pre>
      )}
      {p.recommendation && <p className="text-xs mt-2"><span className="font-semibold">Rec:</span> {p.recommendation}</p>}
      {p.qa_issues?.length > 0 && (
        <ul className="text-[11px] list-disc pl-4 text-muted-foreground mt-1">{p.qa_issues.map((x, i) => <li key={i}>{x}</li>)}</ul>
      )}
      {p.validation_status && <span className="text-[10px] font-mono text-muted-foreground block mt-1">status: {p.validation_status}</span>}
      {p.changes && <p className="text-[11px] text-muted-foreground mt-1">{p.changes}</p>}
    </div>
  );
}