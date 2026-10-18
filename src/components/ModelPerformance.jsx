import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { GitCompare } from "lucide-react";

export default function ModelPerformance() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [total, success] = await Promise.all([
          base44.entities.PromptRun.aggregate({ groupBy: "model", count: true, avg: "quality_score", sort: "-count" }),
          base44.entities.PromptRun.aggregate({ query: { quality_score: { $gte: 80 } }, groupBy: "model", count: true }),
        ]);
        const sMap = {};
        (success.rows || []).forEach((r) => { sMap[r.model] = r.count; });
        setRows(
          (total.rows || []).map((r) => ({
            model: r.model || "unknown",
            runs: r.count,
            avg: Math.round(r.avg_quality_score || 0),
            successRate: r.count ? Math.round(((sMap[r.model] || 0) / r.count) * 100) : 0,
          }))
        );
      } catch (e) { /* no runs yet */ }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="mb-8 p-4 rounded-xl bg-card border border-border text-sm text-muted-foreground">Loading model performance...</div>;
  if (!rows.length) return null;

  return (
    <div className="mb-8 p-5 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-2 mb-4">
        <GitCompare className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest">Model Performance</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {rows.map((r) => (
          <div key={r.model} className="p-3 rounded-lg bg-secondary/30 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold font-mono">{r.model}</span>
              <span className="text-[10px] text-muted-foreground font-mono">{r.runs} runs</span>
            </div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Avg score</span>
              <span className={`font-mono ${r.avg >= 80 ? "text-success" : r.avg >= 60 ? "text-warning" : "text-destructive"}`}>{r.avg}/100</span>
            </div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Success rate</span>
              <span className="font-mono">{r.successRate}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden mt-2">
              <div className={`h-full ${r.successRate >= 80 ? "bg-success" : r.successRate >= 50 ? "bg-warning" : "bg-destructive"}`} style={{ width: `${r.successRate}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}