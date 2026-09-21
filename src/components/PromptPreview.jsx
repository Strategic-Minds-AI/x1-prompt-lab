import { useState } from "react";
import { ChevronDown, ChevronUp, Code2 } from "lucide-react";

export default function PromptPreview({ buildPrompt, label }) {
  const [open, setOpen] = useState(false);

  const prompt = open ? buildPrompt() : null;

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 bg-secondary/40 hover:bg-secondary/60 transition-colors text-xs font-mono"
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <Code2 className="w-3.5 h-3.5 text-primary" />
          <span>{label || "View InvokeLLM prompt"}</span>
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>
      {open && (
        <div className="p-3 bg-muted/30 max-h-[300px] overflow-y-auto">
          <pre className="text-xs font-mono text-foreground/70 whitespace-pre-wrap break-words">{prompt}</pre>
        </div>
      )}
    </div>
  );
}