import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";

export default function SourceInput({ index, value, onChange, onRemove, canRemove }) {
  return (
    <div className="relative group">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-mono text-muted-foreground">
          Source #{index + 1}
        </label>
        {canRemove && (
          <button
            onClick={onRemove}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Paste the content of source ${index + 1} here...`}
        className="min-h-[120px] bg-secondary/50 border-border font-mono text-sm resize-y"
      />
    </div>
  );
}