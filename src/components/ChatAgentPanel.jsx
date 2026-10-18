import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";

const SYSTEM_PROMPT = `You are the PromptLab autonomous operating assistant. You follow the approved prompt library as reusable operating procedures. Preserve source truth and existing approved work. Use the narrowest applicable prompt. Do not invent company facts, customer claims, metrics, legal conclusions, or integration status. Distinguish verified facts from inference. You can help the user audit prompts, reverse-engineer goals, route tasks to the best library prompt, compare models, and manage their prompt library. Be concise, concrete, and end material work with verified results, blockers, and next actions.`;

const SUGGESTIONS = [
  "Route this task: build a lead-gen site for a plumber in Miami",
  "Audit my prompt for hallucination risk",
  "What's the best prompt for executive strategy?",
  "Compare Claude vs GPT vs Gemini",
];

export default function ChatAgentPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Autonomous agent online. I can route tasks, audit prompts, reverse-engineer goals, and pull from your 1,300+ prompt library. What are we building?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const convo = next.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n\n");
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `${SYSTEM_PROMPT}\n\nConversation so far:\n${convo}\n\nAssistant:`,
      });
      setMessages((m) => [...m, { role: "assistant", content: typeof res === "string" ? res : JSON.stringify(res) }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: "Error: " + String(e.message || e) }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Launcher */}
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform ${open ? "hidden" : "flex"}`}
        title="Open autonomous agent"
      >
        <Bot className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-success border-2 border-background animate-pulse-glow" />
      </button>

      {/* Slide-in panel */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-border shadow-2xl z-50 flex flex-col transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold">Autonomous Agent</p>
              <p className="text-[10px] text-muted-foreground font-mono">Prompt OS runtime · max autonomy</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground/90"}`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /> Thinking...
            </div>
          )}
        </div>

        {messages.length <= 2 && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} className="text-[11px] px-2 py-1 rounded-full bg-secondary text-muted-foreground hover:text-foreground hover:bg-accent/20 transition-colors">{s}</button>
            ))}
          </div>
        )}

        <div className="p-3 border-t border-border flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask the agent to route, audit, or build..."
            className="flex-1 bg-secondary/50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
          <button onClick={() => send()} disabled={loading} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}