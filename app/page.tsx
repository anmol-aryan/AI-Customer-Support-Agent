"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Bot, Check, ChevronRight, CircleHelp, Clock3, Headphones, Inbox, LayoutDashboard, LifeBuoy, MessageCircleMore, PackageCheck, Plus, Search, Send, ShieldCheck, Sparkles, TicketCheck, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type Source = { title: string; section: string };
type Message = { id: string; role: "user" | "assistant"; text: string; intent?: string; sources?: Source[]; ticketId?: string; confidence?: number };
type Ticket = { id: number; ticketId: string; customerName: string; email: string; issue: string; category: string; priority: string; status: string; createdAt: string };
type ModelContextLike = { registerTool: (tool: { name: string; title: string; description: string; inputSchema: object; annotations: { readOnlyHint: boolean; untrustedContentHint: boolean }; execute: (input: unknown) => Promise<unknown> }, options?: { signal?: AbortSignal }) => void | Promise<void> };

const quickQuestions = ["Where is order NB-1042?", "Can I return a used product?", "How long does delivery take?", "I need help from a human"];
const initialMessages: Message[] = [{ id: "welcome", role: "assistant", text: "Hi! I’m Nova, Northstar’s support agent. I can track orders, explain returns and refunds, troubleshoot products, or create a ticket for our team. How can I help?", confidence: 1 }];

function statusStyle(status: string) {
  if (status === "Resolved") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "In progress") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-blue-50 text-blue-700 border-blue-200";
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketSearch, setTicketSearch] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, loading]);

  async function loadTickets() {
    setTicketLoading(true);
    try {
      const response = await fetch("/api/tickets", { cache: "no-store" });
      const payload = await response.json();
      setTickets(payload.tickets ?? []);
    } catch { setFeedback("Ticket dashboard is temporarily unavailable."); }
    finally { setTicketLoading(false); }
  }

  useEffect(() => { void loadTickets(); }, []);

  async function sendMessage(text = input) {
    const clean = text.trim();
    if (!clean || loading) return;
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", text: clean }]);
    setInput(""); setLoading(true);
    try {
      const response = await fetch("/api/support", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: clean, history: messages.slice(-6).map(({ role, text: content }) => ({ role, content })) }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Support request failed");
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", text: payload.answer, intent: payload.intent, sources: payload.sources, ticketId: payload.ticketId, confidence: payload.confidence }]);
      if (payload.ticketId) void loadTickets();
    } catch { setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", text: "I couldn’t complete that request. Your message is safe—please try again in a moment." }]); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    const modelContext = (document as Document & { modelContext?: ModelContextLike }).modelContext;
    if (!modelContext?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(modelContext.registerTool({
        name: "ask_customer_support",
        title: "Ask customer support",
        description: "Send a customer question to Nova and add the grounded response to the visible conversation.",
        inputSchema: { type: "object", properties: { question: { type: "string", minLength: 2, maxLength: 1600 } }, required: ["question"], additionalProperties: false },
        annotations: { readOnlyHint: false, untrustedContentHint: true },
        async execute(input) {
          const question = typeof input === "object" && input !== null && "question" in input ? String((input as { question: unknown }).question).trim() : "";
          if (question.length < 2 || question.length > 1600) throw new Error("question must contain 2–1600 characters");
          await sendMessage(question);
          return { accepted: true, question };
        },
      }, { signal: lifecycle.signal })).catch(() => undefined);
    } catch { /* WebMCP is optional in unsupported browsers. */ }
    return () => lifecycle.abort();
  }, []);

  function submit(event: FormEvent) { event.preventDefault(); void sendMessage(); }

  async function updateTicket(ticketId: string, status: string) {
    const previous = tickets;
    setTickets((items) => items.map((item) => item.ticketId === ticketId ? { ...item, status } : item));
    try {
      const response = await fetch("/api/tickets", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticketId, status }) });
      if (!response.ok) throw new Error("Update failed");
      setFeedback(`${ticketId} moved to ${status}.`); setTimeout(() => setFeedback(null), 2600);
    } catch { setTickets(previous); setFeedback("Status could not be updated."); }
  }

  const filteredTickets = useMemo(() => { const query = ticketSearch.toLowerCase(); return tickets.filter((ticket) => [ticket.ticketId, ticket.customerName, ticket.issue, ticket.category, ticket.status].some((value) => value.toLowerCase().includes(query))); }, [tickets, ticketSearch]);
  const latestIntent = [...messages].reverse().find((message) => message.intent);
  const confidence = Math.round((latestIntent?.confidence ?? 0) * 100);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark"><Sparkles size={19} /><span>ResolveAI</span></div>
        <nav className="side-nav" aria-label="Primary navigation">
          <a className="nav-item active" href="#workspace"><MessageCircleMore size={19} /><span>Agent workspace</span></a>
          <a className="nav-item" href="#tickets"><Inbox size={19} /><span>Support inbox</span><span className="nav-count">{tickets.filter((ticket) => ticket.status === "Open").length}</span></a>
          <a className="nav-item" href="#knowledge"><CircleHelp size={19} /><span>Knowledge base</span></a>
          <a className="nav-item" href="#analytics"><LayoutDashboard size={19} /><span>Analytics</span></a>
        </nav>
        <div className="side-card"><div className="side-card-icon"><ShieldCheck size={18} /></div><p>Grounded response mode</p><span>Answers use verified policies and tools.</span></div>
        <div className="profile-row"><div className="avatar">AA</div><div><strong>Anmol Aryan</strong><span>Workspace admin</span></div></div>
      </aside>

      <section className="workspace" id="workspace">
        <header className="topbar">
          <div><p>Customer support</p><h1>Agent workspace</h1></div>
          <div className="top-actions"><Badge className="mode-badge"><span className="live-dot" /> Demo AI active</Badge><Button variant="outline" onClick={() => setMessages(initialMessages)}><Plus size={16} /> New conversation</Button></div>
        </header>

        <Tabs defaultValue="chat" className="product-tabs">
          <TabsList className="tab-list">
            <TabsTrigger value="chat"><MessageCircleMore size={16} /> Conversation</TabsTrigger>
            <TabsTrigger value="tickets" onClick={loadTickets}><TicketCheck size={16} /> Tickets</TabsTrigger>
            <TabsTrigger value="knowledge"><CircleHelp size={16} /> Knowledge</TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="chat-layout">
            <div className="conversation-card">
              <div className="conversation-head"><div className="customer-identity"><div className="avatar customer"><UserRound size={18} /></div><div><strong>Live customer</strong><span>New conversation · Web chat</span></div></div><Badge variant="outline" className="priority-badge">Normal priority</Badge></div>
              <div className="messages" aria-live="polite">
                {messages.map((message) => <article key={message.id} className={`message-row ${message.role}`}>
                  {message.role === "assistant" && <div className="message-avatar"><Bot size={17} /></div>}
                  <div className="message-wrap"><div className="message-bubble">{message.text}</div>
                    {message.role === "assistant" && (message.intent || message.sources?.length || message.ticketId) && <div className="message-evidence">
                      {message.intent && <span><Sparkles size={13} /> {message.intent.replaceAll("_", " ")}</span>}
                      {message.sources?.map((source) => <span key={source.title + source.section}><ShieldCheck size={13} /> {source.title} · {source.section}</span>)}
                      {message.ticketId && <span><TicketCheck size={13} /> {message.ticketId}</span>}
                    </div>}
                  </div>
                </article>)}
                {loading && <div className="message-row assistant"><div className="message-avatar"><Bot size={17} /></div><div className="thinking"><i /><i /><i /><span>Checking verified information</span></div></div>}
                <div ref={endRef} />
              </div>
              {messages.length === 1 && <div className="suggestions">{quickQuestions.map((question) => <button key={question} onClick={() => void sendMessage(question)}>{question}<ChevronRight size={15} /></button>)}</div>}
              <form className="composer" onSubmit={submit}><Textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} placeholder="Ask about an order, return, refund, or product issue…" aria-label="Message" rows={2} /><div className="composer-foot"><span>Enter to send · Shift + Enter for a new line</span><Button type="submit" disabled={!input.trim() || loading} aria-label="Send message"><Send size={17} /></Button></div></form>
            </div>
            <aside className="context-panel">
              <p className="eyebrow">Agent context</p>
              <div className="context-block"><span>Customer</span><strong>Guest visitor</strong><small>No account details shared</small></div>
              <div className="context-block"><span>Detected intent</span><strong>{latestIntent?.intent?.replaceAll("_", " ") ?? "Waiting for message"}</strong></div>
              <div className="context-block"><span>Confidence</span><div className="confidence-row"><div className="confidence-track"><i style={{ width: `${confidence}%` }} /></div><strong>{confidence}%</strong></div></div>
              <div className="guardrail-card"><ShieldCheck size={19} /><div><strong>Safety checks on</strong><span>Policy grounding, PII masking, and human escalation are active.</span></div></div>
              <Button variant="outline" className="wide-action" onClick={() => void sendMessage("Please connect me with a human support agent.")}><Headphones size={16} /> Escalate to human</Button>
            </aside>
          </TabsContent>

          <TabsContent value="tickets" id="tickets" className="tickets-view">
            <div className="section-heading"><div><p className="eyebrow">Support operations</p><h2>Ticket inbox</h2><span>Review, prioritize, and resolve escalated conversations.</span></div><div className="search-field"><Search size={16} /><Input value={ticketSearch} onChange={(event) => setTicketSearch(event.target.value)} placeholder="Search tickets" /></div></div>
            <div className="stat-grid"><div><Inbox size={18} /><span>Open</span><strong>{tickets.filter((ticket) => ticket.status === "Open").length}</strong></div><div><Clock3 size={18} /><span>In progress</span><strong>{tickets.filter((ticket) => ticket.status === "In progress").length}</strong></div><div><Check size={18} /><span>Resolved</span><strong>{tickets.filter((ticket) => ticket.status === "Resolved").length}</strong></div></div>
            <div className="ticket-table-wrap"><table className="ticket-table"><thead><tr><th>Ticket</th><th>Customer</th><th>Issue</th><th>Priority</th><th>Status</th></tr></thead><tbody>
              {ticketLoading ? <tr><td colSpan={5}>Loading tickets…</td></tr> : filteredTickets.length === 0 ? <tr><td colSpan={5}>No tickets yet. Ask Nova for a human agent to create one.</td></tr> : filteredTickets.map((ticket) => <tr key={ticket.ticketId}><td><strong>{ticket.ticketId}</strong><span>{new Date(ticket.createdAt).toLocaleDateString()}</span></td><td>{ticket.customerName}<span>{ticket.email}</span></td><td><strong>{ticket.category}</strong><span className="issue-cell">{ticket.issue}</span></td><td><Badge variant="outline" className={ticket.priority === "High" ? "high-priority" : ""}>{ticket.priority}</Badge></td><td><select aria-label={`Status for ${ticket.ticketId}`} value={ticket.status} onChange={(event) => void updateTicket(ticket.ticketId, event.target.value)} className={statusStyle(ticket.status)}><option>Open</option><option>In progress</option><option>Resolved</option></select></td></tr>)}
            </tbody></table></div>
          </TabsContent>

          <TabsContent value="knowledge" id="knowledge" className="knowledge-view">
            <div className="section-heading"><div><p className="eyebrow">Verified sources</p><h2>Knowledge base</h2><span>Nova retrieves only from these approved company policies.</span></div></div>
            <div className="knowledge-grid">{[
              { icon: PackageCheck, title: "Shipping & delivery", desc: "Delivery estimates, tracking, address changes", articles: 8 },
              { icon: ShieldCheck, title: "Returns & refunds", desc: "Eligibility, timelines, exchanges, payment reversals", articles: 9 },
              { icon: LifeBuoy, title: "Product support", desc: "Setup, warranty, troubleshooting, account help", articles: 8 },
            ].map((item) => <article key={item.title}><div className="knowledge-icon"><item.icon size={20} /></div><div><h3>{item.title}</h3><p>{item.desc}</p><span>{item.articles} verified articles</span></div></article>)}</div>
            <div className="retrieval-note"><Sparkles size={20} /><div><strong>How grounded answers work</strong><p>The agent identifies intent, retrieves the most relevant policy sections, checks confidence, and responds with visible citations. If evidence is weak, it asks a question or creates a human-support ticket.</p></div></div>
          </TabsContent>
        </Tabs>
      </section>
      {feedback && <div className="toast" role="status">{feedback}</div>}
    </main>
  );
}
