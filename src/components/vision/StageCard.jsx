export default function StageCard({ icon: Icon, title, step, status, actionLabel, onAction, disabled, children }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold">{step && <span className="text-muted-foreground font-mono mr-1">{step}</span>}{title}</h3>
        </div>
        {actionLabel && (
          <button
            onClick={onAction}
            disabled={disabled || status === "running"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50"
          >
            {status === "running" ? (
              <span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <Icon className="w-3.5 h-3.5" />
            )}
            {actionLabel}
          </button>
        )}
      </div>
      {status === "running" && !children && <p className="text-xs text-muted-foreground">Working...</p>}
      {children}
    </div>
  );
}