import { useState } from "react";
import { Check, Loader2, Plug } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

export default function ServiceConnect({ connectorId, label }) {
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(false);
  const { toast } = useToast();

  const connect = async () => {
    setBusy(true);
    try {
      const url = await base44.connectors.connectAppUser(connectorId);
      const popup = window.open(url, "_blank");
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          setConnected(true);
        }
      }, 600);
    } catch (e) {
      toast({ title: label + " connect failed", description: String(e.message || e), variant: "destructive" });
    }
    setBusy(false);
  };

  if (connected) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-success font-mono">
        <Check className="w-3.5 h-3.5" /> {label} connected
      </span>
    );
  }
  return (
    <button
      onClick={connect}
      disabled={busy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50"
    >
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plug className="w-3.5 h-3.5" />} Connect {label}
    </button>
  );
}