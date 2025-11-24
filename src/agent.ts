// agent.ts
import { ChatMessage } from "./types";

interface ChatSession {
  id: string;        // unique session ID
  topic: string;     // e.g., "AP Bio review"
  messages: ChatMessage[];
  lastUpdated: number; // timestamp
}

export class MyAgent {
  private state: DurableObjectState;
  private sessions: ChatSession[] = [];

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  /** Initialize stored sessions from Durable Object storage */
  private async loadSessions() {
    const stored = await this.state.storage.get<ChatSession[]>("sessions");
    this.sessions = stored || [];
  }

  /** Save sessions back to Durable Object storage */
  private async saveSessions() {
    await this.state.storage.put("sessions", this.sessions);
  }


  /** Find the active session by ID, or create a new one */
  private async getSession(sessionId?: string, topic?: string): Promise<ChatSession> {
    await this.loadSessions();

    let session: ChatSession | undefined;

    if (sessionId) {
      session = this.sessions.find((s) => s.id === sessionId);
    }

    if (!session) {
    const defaultTopic = topic || `Chat - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;

      // Create new session
      session = {
        id: crypto.randomUUID(),
        topic: defaultTopic,
        messages: [],
        lastUpdated: Date.now(),
      };

      this.sessions.push(session);
      await this.saveSessions();
    }

    return session;
  }

  /** Handle incoming requests */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // POST /addMessage?sessionId=...&topic=...
    if (pathname === "/addMessage" && request.method === "POST") {
      const sessionId = url.searchParams.get("sessionId") || undefined;
      const topic = url.searchParams.get("topic") || undefined;
      const msg: ChatMessage = await request.json();

      const session = await this.getSession(sessionId, topic);
      session.messages.push(msg);
      session.lastUpdated = Date.now();

      await this.saveSessions();

      return new Response(
        JSON.stringify({ ok: true, sessionId: session.id }),
        { headers: { "content-type": "application/json" } }
      );
    }

    // GET /getHistory?sessionId=...
    if (pathname === "/getHistory" && request.method === "GET") {
      const sessionId = url.searchParams.get("sessionId");
      const session = sessionId ? await this.getSession(sessionId) : undefined;

      return new Response(
        JSON.stringify(session?.messages || []),
        { headers: { "content-type": "application/json" } }
      );
    }

    // GET /getSessions -> list of all sessions (for left-side chat list)
    if (pathname === "/getSessions" && request.method === "GET") {
  await this.loadSessions();

  const list = this.sessions.map(({ id, messages, lastUpdated, topic }) => {
    let summary = topic;

    if (messages && messages.length) {
      // Find the last non‑system message
      const lastMsg = [...messages]
        .reverse()
        .find((m) => m.role !== "system");

      if (lastMsg) {
        // strip line breaks and keep short
        summary = lastMsg.content.replace(/\s+/g, " ").slice(0, 40);
        if (lastMsg.content.length > 40) summary += "…";
      }
    }

    return { id, topic, summary, lastUpdated };
  });

  return new Response(JSON.stringify(list), {
    headers: { "content-type": "application/json" },
  });
}

    // Default route
    return new Response("Not found", { status: 404 });
  }
}