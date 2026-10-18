import { useState, useRef, useEffect } from "react";
import { X, Send, Sparkles, Radio, MessageSquare, MessageCircle, Wrench } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";

const SUGGESTIONS = [
  "Run an orchestrator tick: audit the roadmap and tell me the next action",
  "Check bridge + Ollama/Docker status and fix anything degraded",
  "Advance the bootstrap roadmap — pick the next undone task and implement it",
  "Coordinate the agents: post a directive and brief me on WhatsApp",
];

export default function ChatAgentPanel({ open, onClose }) {
  const [tab, setTab] = useState("chat");
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [bus, setBus] = useState([]);
  const [busInput, setBusInput] = useState("");
  const [waNote, setWaNote] = useState(null);
  const scrollRef = useRef(null);
  const busRef = useRef(null);
  const unsubRef = useRef(null);

  // Start agent conversation on first open
  useEffect(() => {
    if (!open || conversation) return;
    (async () => {
      try {
        const conv = await base44.agents.createConversation({ agent_name: "autonomous_agent", metadata: { name: "PromptLab Agent" } });
        setConversation(conv);
        unsubRef.current = base44.agents.subscribeToConversation(conv.id, (data) => {
          setMessages(data.messages || []);
          const last = (data.messages || [])[data.messages.length - 1];
          if (last && last.role === "assistant" && last.content) setLoading(false);
        });
      } catch (e) {
        setMessages([{ role: "assistant", content: "Agent initializing — reopen the panel in a moment." }]);
      }
    })();
    return () => unsubRef.current && unsubRef.current();
  }, [open]);

  // Message bus: load + subscribe
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

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || loading || !conversation) return;
    setInput("");
    setLoading(true);
    try {
      await base44.agents.addMessage(conversation, { role: "user", content });
    } catch (e) {
      setLoading(false);
      setMessages((m) => [...m, { role: "assistant", content: "Error: " + String(e.message || e) }]);
    }
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
    try { await base44.entities.AgentMessage.create({ agent_name: "user", role: "user", content, target_agent: "all", channel: "bus" }); } catch {}
  };

  return (
    <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-border shadow-2xl z-50 flex flex-col transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full pointer-events-none"}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">System Orchestrator</p>
            <p className="text-[10px] text-muted-foreground font-mono">roadmap · monitor · coordinate · audit · fix · enhance</p>
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
            {messages.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground text-center mt-8">The orchestrator owns the roadmap, monitors local + cloud systems, coordinates agents, and acts on its own. Tell it what to advance.</p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground/90"}`}>
                  {m.role === "assistant" ? <ReactMarkdown>{m.content || ""}</ReactMarkdown> : m.content}
                </div>
                {m.tool_calls?.map((tc, j) => (
                  <div key={j} className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono mt-0.5">
                    <Wrench className="w-3 h-3" /> {tc.name}: {tc.status}
                  </div>
                ))}
                {m.role === "assistant" && m.content && (
                  <button onClick={() => sendToWhatsApp(m.content)} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-success font-mono mt-0.5">
                    <MessageCircle className="w-3 h-3" /> {waNote === "sending" ? "sending..." : waNote === "sent" ? "sent ✓" : waNote === "failed" ? "failed" : "WhatsApp"}
                  </button>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /> Working...
              </div>
            )}
          </div>
          {messages.length <= 1 && (
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
              placeholder="Tell the agent what to do..."
              className="flex-1 bg-secondary/50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
            />
            <button onClick={() => send()} disabled={loading || !conversation} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50">
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