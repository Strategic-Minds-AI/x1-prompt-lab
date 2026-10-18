import { useState } from "react";
import { Cloud, Check, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

const CONNECTOR_ID = "69db1e5e75a5f8c15c80cf34";

export default function DriveConnect({ connected, onConnected }) {
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const connect = async () => {
    setBusy(true);
    try {
      const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
      const popup = window.open(url, "_blank");
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          onConnected?.();
        }
      }, 600);
    } catch (e) {
      toast({ title: "Drive connect failed", description: String(e.message || e), variant: "destructive" });
    }
    setBusy(false);
  };

  if (connected) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-success font-mono">
        <Check className="w-3.5 h-3.5" /> Drive backup on
      </span>
    );
  }
  return (
    <button onClick={connect} disabled={busy} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-mono disabled:opacity-50">
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Cloud className="w-3.5 h-3.5" />}
      Connect Google Drive
    </button>
  );
}