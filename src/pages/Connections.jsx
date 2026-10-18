import { useState } from "react";
import { Cloud, Mail, Calendar, Table, FileText, ListChecks, Database, KeyRound, Server, HardDrive, Terminal, Info } from "lucide-react";
import DriveConnect from "@/components/DriveConnect";
import ServiceConnect from "@/components/ServiceConnect";

const GOOGLE = [
  { id: "69db200274332486fd28dd7e", label: "Gmail", icon: Mail },
  { id: "69ddcb305a599e0b4a1b3cff", label: "Google Calendar", icon: Calendar },
  { id: "69db1fad3c50db37ad0ce8dd", label: "Google Sheets", icon: Table },
  { id: "69ddcb7e5d965b5605cd24b4", label: "Google Docs", icon: FileText },
  { id: "69db201897e4e8f9ae073be7", label: "Google Tasks", icon: ListChecks },
];

const INFRA = [
  { name: "Vercel", icon: HardDrive, key: "VERCEL_API_KEY", desc: "Deploy generated apps and workflows. Create a token at vercel.com/account/tokens." },
  { name: "Railway", icon: Server, key: "RAILWAY_API_KEY", desc: "Sync backend engine. Create a token in Railway account settings." },
  { name: "Railway Engine URL", icon: Server, key: "RAILWAY_ENGINE_URL", desc: "The Railway engine/service base URL the app syncs to." },
  { name: "Sandbox", icon: Terminal, key: "SANDBOX_API_KEY", desc: "Code-execution sandbox for running generated prompts safely." },
];

export default function Connections() {
  const [driveConnected, setDriveConnected] = useState(false);

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><KeyRound className="w-6 h-6 text-primary" /> Connections</h1>
        <p className="text-sm text-muted-foreground mt-1">Connect Google Workspace, Supabase, and install infrastructure keys. Google Drive enables automatic run backups.</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-sm font-semibold">Google Drive (auto-sync)</h2>
              <p className="text-xs text-muted-foreground">Connect once to auto-upload every prompt run, audit, and simulation report to Drive.</p>
            </div>
          </div>
          <DriveConnect connected={driveConnected} onConnected={() => setDriveConnected(true)} />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-semibold">Google Workspace</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {GOOGLE.map((g) => (
            <div key={g.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
              <div className="flex items-center gap-2">
                <g.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{g.label}</span>
              </div>
              <ServiceConnect connectorId={g.id} label={g.label} />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-sm font-semibold">Supabase (backend)</h2>
              <p className="text-xs text-muted-foreground">Connect your Supabase project for backend data sync.</p>
            </div>
          </div>
          <ServiceConnect connectorId="69e521c8418f5cecefb2567c" label="Supabase" />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-2">
          <KeyRound className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-semibold">Infrastructure Keys</h2>
        </div>
        <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4">
          <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">Keys are stored in the app's encrypted <span className="font-mono text-foreground">Secrets</span> panel (the secure store backend functions read from). Open the Secrets tab in the app dashboard and paste each value into its slot.</p>
        </div>
        <div className="space-y-2">
          {INFRA.map((k) => (
            <div key={k.key} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
              <div className="flex items-center gap-2 min-w-0">
                <k.icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-sm font-medium">{k.name}</span>
                  <p className="text-[11px] text-muted-foreground truncate">{k.desc}</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground flex-shrink-0 ml-2">Secret: {k.key}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-2">
          <Terminal className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-semibold">Local Computer Terminal</h2>
        </div>
        <p className="text-xs text-muted-foreground">A browser app cannot directly shell into your local computer. To control your local machine, a small local bridge (a CLI/agent running on your computer) is required, which the app talks to over a secure tunnel. This needs a backend function plus a local process you run, I can build it if you want.</p>
      </div>
    </div>
  );
}