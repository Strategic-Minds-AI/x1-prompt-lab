import { Copy, Check, Clock } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function ResultPanel({ result, isLoading, elapsed }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = typeof result === "string" ? result : JSON.stringify(result, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="border border-border rounded-lg bg-card p-8 flex flex-col items-center justify-center min-h-[200px] gap-3">
        <div className="relative">
          <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <div className="absolute inset-0 w-10 h-10 border-2 border-accent/10 border-b-accent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
        <p className="text-sm text-muted-foreground">Procesando con LLM...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="border border-dashed border-border rounded-lg bg-card/50 p-8 flex items-center justify-center min-h-[200px]">
        <p className="text-sm text-muted-foreground">Los resultados aparecerán aquí</p>
      </div>
    );
  }

  const isStructured = typeof result === "object";

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success" />
          <span className="text-xs font-mono text-muted-foreground">Resultado</span>
        </div>
        <div className="flex items-center gap-3">
          {elapsed && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {elapsed}ms
            </span>
          )}
          <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground transition-colors">
            {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-h-[500px] overflow-y-auto">
        {isStructured ? (
          <pre className="text-sm font-mono text-foreground whitespace-pre-wrap break-words">
            {JSON.stringify(result, null, 2)}
          </pre>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none text-foreground/90">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}