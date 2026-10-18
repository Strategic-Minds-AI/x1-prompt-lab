import { useState, useRef, useEffect } from "react";
import { X, Send, Sparkles, Radio, MessageSquare, MessageCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

const SYSTEM_PROMPT = `You are the PromptLab autonomous operating assistant. You follow the approved prompt library as reusable operating procedures. Preserve source truth and existing approved work. Use the narrowest applicable prompt. Do not invent company facts, customer claims, metrics, legal conclusions, or integration status. Distinguish verified facts from inference. You can help the user audit prompts, reverse-engineer goals, route tasks to the best library prompt, compare models, and manage their prompt library. You can read and post to the shared agent message bus to coordinate with other agents. Be concise, concrete, and end material work with verified results, blockers, and next actions.`;

const SUGGESTIONS = [
  "Route this task: build a lead-gen site for a plumber in Miami",
  "Audit my prompt for hallucination risk",
  "What's the best prompt for executive strategy?",
  "Compare Claude vs GPT vs Gemini",
];

export default function ChatAgentPanel({ open, onClose }) {
  const [tab, setTab] = useState("chat");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Autonomous agent online. I can route tasks, audit prompts, reverse-engineer goals, and coordinate with other agents over the message bus. What are we building?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [bus, setBus] = useState([]);
  const [busInput, setBusInput] = useState("");
  const [waNote, setWaNote] = useState(null);
  const scrollRef = useRef(null);
  const busRef = useRef(null);

  useEffect(() => {
    let unsub;
    (async () => {
      try {
        const { items } = await base44.entities.AgentMessage.filter({}, { sort: "-created_date", limit: 40 });
        setBus([...items].reverse());
        unsub = base44.entities.AgentMessage.subscribe((event) => {
          if (event.type === "create") setBus((b) => [...b, event.data].slice(-60));
        });
      } catch (e) { /* bus unavailable */ }
    })();
    return () => unsub && unsub();
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);
  useEffect(() => {
    if (busRef.current) busRef.current.scrollTop = busRef.current.scrollHeight;
  }, [bus]);

  const postToBus = (agent_name, role, content, target_agent = "all") => {
    base44.entities.AgentMessage.create({ agent_name, role, content, target_agent, channel: "bus" }).catch(() => {});
  };

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    postToBus("user", "user", content, "chat-agent");
    try {
      const convo = next.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n\n");
      const res = await base44.integrations.Core.InvokeLLM({ prompt: `${SYSTEM_PROMPT}\n\nConversation so far:\n${convo}\n\nAssistant:` });
      const out = typeof res === "string" ? res : JSON.stringify(res);
      setMessages((m) => [...m, { role: "assistant", content: out }]);
      postToBus("chat-agent", "assistant", out, "all");
    } catch (e) {
      const msg = "Error: " + String(e.message || e);
      setMessages((m) => [...m, { role: "assistant", content: msg }]);
      postToBus("chat-agent", "assistant", msg, "all");
    }
    setLoading(false);
  };

  const sendToWhatsApp = async (content) => {
    setWaNote("sending");
    try {
      const r = await base44.functions.invoke("sendWhatsApp", { message: content });
      setWaNote(r?.data?.status ? "sent" : "failed");
    } catch (e) {
      setWaNote("failed");
    }
    setTimeout(() => setWaNote(null), 2500);
  };

  const sendBus = async () => {
    const content = busInput.trim();
    if (!content) return;
    setBusInput("");
    await postToBus("user", "user", content, "all");
  };

  return (
    <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-border shadow-2xl z-50 flex flex-col transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full pointer-events-none"}`}>
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
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
      </div>

      <div className="flex border-b border-border">
        <button onClick={() => setTab("chat")} className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium border-b-2 transition-colors ${tab === "chat" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          <MessageSquare className="w-3.5 h-3.5" /> Chat
        </button>
        <button onClick={() => setTab("bus")} className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium border-b-2 transition-colors ${tab === "bus" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          <Radio className="w-3.5 h-3.5" /> Message Bus
        </button>
      </div>

      {tab === "chat" && (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground/90"}`}>
                  {m.content}
                </div>
                {m.role === "assistant" && (
                  <button onClick={() => sendToWhatsApp(m.content)} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-success font-mono mt-0.5">
                    <MessageCircle className="w-3 h-3" /> {waNote === "sending" ? "sending..." : waNote === "sent" ? "sent ✓" : waNote === "failed" ? "failed" : "WhatsApp"}
                  </button>
                )}
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
        </>
      )}

      {tab === "bus" && (
        <>
          <div ref={busRef} className="flex-1 overflow-y-auto p-4 space-y-2">
            {bus.length === 0 && <p className="text-sm text-muted-foreground text-center mt-8">No bus messages yet. Agents post here to coordinate.</p>}
            {bus.map((m) => (
              <div key={m.id} className="border border-border rounded-lg bg-secondary/30 p-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-primary">{m.agent_name}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">→ {m.target_agent || "all"}</span>
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap">{m.content}</p>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-border flex gap-2">
            <input
              value={busInput}
              onChange={(e) => setBusInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendBus()}
              placeholder="Broadcast to the bus..."
              className="flex-1 bg-secondary/50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
            />
            <button onClick={sendBus} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}