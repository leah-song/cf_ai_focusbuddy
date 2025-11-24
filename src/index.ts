/**
 * LLM Chat Application Template
 *
 * A simple chat application using Cloudflare Workers AI.
 * This template demonstrates how to implement an LLM-powered chat interface with
 * streaming responses using Server-Sent Events (SSE).
 *
 * @license MIT
 */
import { Env, ChatMessage } from "./types";
import { MyAgent } from "./agent";


// Model ID for Workers AI model
// https://developers.cloudflare.com/workers-ai/models/
const MODEL_ID = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

// Default system prompt
const SYSTEM_PROMPT =
	"You are an informative, friendly, encouraging study buddy. Provide concise and accurate responses in a quick manner.";

export default {
	/**
	 * Main request handler for the Worker
	 */
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext,
	): Promise<Response> {
		const url = new URL(request.url);
		// inside fetch(...) near the top, create a stub for your DO once per request
		// create DO stub (do this once per request, near the top of fetch)
		// Get user ID from header (or default to 'anonymous') - 11/24
		const userId = request.headers.get("x-user-id") || "anonymous";

		// Each user gets their own Durable Object instance - 11/24
		const doId = env.MyAgent.idFromName(`chat-${userId}`);
		const doStub = env.MyAgent.get(doId);
	
		// Handle static assets (frontend)
		if (url.pathname === "/" || !url.pathname.startsWith("/api/")) {
			return env.ASSETS.fetch(request);
		}

		if (url.pathname === "/api/chat") {
			// Handle POST requests for chat
			if (request.method === "POST") {
				return handleChatRequest(request, env);
			}

			// Method not allowed for other request types
			return new Response("Method not allowed", { status: 405 });
		}

		// POST /api/newSession (Generating a new chat with a new session)
		if (url.pathname === "/api/newSession" && request.method === "POST") {
  			// Safely parse optional JSON body to read { topic }
			 let body: any = {};
			  try {
   				 body = await request.json();
  				} catch (_) {
  				  body = {};
  				}
			const topic = body.topic || `Chat - ${new Date().toLocaleString()}`;

  		// Forward to the Durable Object's addMessage endpoint with topic query.
  		// The agent.ts will create a new session when it sees no sessionId and a topic.
  			const res = await doStub.fetch(
    		`https://do/addMessage?topic=${encodeURIComponent(topic)}`,
    		{
     		 method: "POST",
      		headers: { "content-type": "application/json" },
      		// send a small placeholder ChatMessage object (agent will append it into the new session)
      		body: JSON.stringify({ role: "assistant",
      content:
        "Hi friend! I'm your helpful study buddy powered by Cloudflare Workers AI. How can I help you today?"}),
    		}
  			);

		  // Forward the DO response (should include { ok: true, sessionId })
  			return res;
		}

		// GET /api/sessions -> list of all sessions
if (url.pathname === "/api/sessions" && request.method === "GET") {
  const res = await doStub.fetch("https://do/getSessions");
  return res; // DO returns JSON list already
}

// GET /api/session?id=... -> load chat history for a session
if (url.pathname === "/api/session" && request.method === "GET") {
  const id = url.searchParams.get("id");
  if (!id) {
    return new Response("Missing id", { status: 400 });
  }
  const res = await doStub.fetch(`https://do/getHistory?sessionId=${id}`);
  return res; 
}

// POST /api/addMessage -> persist a message through the Durable Object
if (url.pathname === "/api/addMessage" && request.method === "POST") {
  try {
    // Parse the JSON body safely
    const body = (await request.json()) as any;

    // Extract possible fields
    const sessionId: string | undefined = body.sessionId;
    const message: ChatMessage | undefined = body.message;
    const topic: string | undefined = body.topic;

    // Validate
    if (!message) {
      return new Response("Missing message", { status: 400 });
    }

    // Build query
    const query = new URLSearchParams();
    if (sessionId) query.set("sessionId", sessionId);
    if (topic) query.set("topic", topic);

    // Forward to the Durable Object
    const doRes = await doStub.fetch(`https://do/addMessage?${query}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(message),
    });

    return doRes;
  } catch (err) {
    console.error("Error handling /api/addMessage:", err);
    return new Response("Bad Request", { status: 400 });
  }
}
		// Handle 404 for unmatched routes
		return new Response("Not found", { status: 404 });
	},
} satisfies ExportedHandler<Env>;
export {MyAgent}; 


/**
 * Handles chat API requests
 */
async function handleChatRequest(
	request: Request,
	env: Env,
): Promise<Response> {
	try {
		// Parse JSON request body
		const { messages = [] } = (await request.json()) as {
			messages: ChatMessage[];
		};

		// Add system prompt if not present
		if (!messages.some((msg) => msg.role === "system")) {
			messages.unshift({ role: "system", content: SYSTEM_PROMPT });
		}

		const response = await env.AI.run(
			MODEL_ID,
			{
				messages,
				max_tokens: 1024,
			},
			{
				returnRawResponse: true,
				// Uncomment to use AI Gateway
				// gateway: {
				//   id: "YOUR_GATEWAY_ID", // Replace with your AI Gateway ID
				//   skipCache: false,      // Set to true to bypass cache
				//   cacheTtl: 3600,        // Cache time-to-live in seconds
				// },
			},
		);

		// Return streaming response
		return response;
	} catch (error) {
		console.error("Error processing chat request:", error);
		return new Response(
			JSON.stringify({ error: "Failed to process request" }),
			{
				status: 500,
				headers: { "content-type": "application/json" },
			},
		);
	}
}

