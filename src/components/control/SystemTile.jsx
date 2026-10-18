import { Link } from "react-router-dom";

export default function SystemTile({ icon: Icon, name, status, value, sub, to }) {
  const dot = status === "online" ? "bg-success" : status === "offline" ? "bg-destructive" : "bg-muted-foreground";
  const inner = (
    <div className="p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <span className={`w-2 h-2 rounded-full ${dot} ${status === "online" ? "animate-pulse-glow" : ""}`} />
      </div>
      <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest">{name}</div>
      <div className="text-xl font-bold mt-0.5">{value}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </div>
  );
  return to ? <Link to={to} className="block">{inner}</Link> : inner;
}