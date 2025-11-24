# Focus Buddy Chat Application

A simple, responsive study guide chat application template powered by Cloudflare Workers AI. This app is designed to help students ask questions, save chats for every new topic, and receive encouragement while studying.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/llm-chat-app-template)

<!-- dash-content-start -->

## Features

- 💬 AI study assistant that provides informative, concise, and encouraging responses
- 🔄 Persistent chat history that is stored in Cloudflare Durable Objects, allowing users to resume conversations across old and current chats
- 🧠 A New Chat button that allows users to start a new conversation for each study topic
- 📱 Responsive UI that displays a sidebar for chat history and a main chat window, optimized for desktop and mobile
- 🔎 Lightweight frontend built with vanilla HTML, CSS, and TypeScript
- 🛠️ Built with TypeScript and Cloudflare Workers

<!-- dash-content-end -->

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- A Cloudflare account with Workers AI access

### Installation

1. Clone this repository:

   ```bash
   git clone https://github.com/yourusername/focus-buddy.git
   cd focus-buddy
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Generate Worker type definitions:
   ```bash
   npm run cf-typegen
   ```

### Development

Start a local development server:

```bash
npm run dev
```

This will start a local server at http://localhost:8787.

Note: Using Workers AI accesses your Cloudflare account even during local development, which will incur usage charges.

### Deployment

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

### Monitor

View real-time logs associated with any deployed Worker:

```bash
npm wrangler tail
```

## Project Structure

```
/
├── public/             # Static assets
│   ├── index.html      # Chat UI HTML
│   └── chat.js         # Chat UI frontend script
├── src/
│   ├── index.ts        # Main Worker entry point
│   └── types.ts        # TypeScript type definitions
├── test/               # Test files
├── wrangler.jsonc      # Cloudflare Worker configuration
├── tsconfig.json       # TypeScript configuration
└── README.md           # This documentation
```

## How It Works

### Tech Stack
- Frontend: HTML, CSS, TypeScript
- Backend: Cloudflare Workers, Durable Objects, KV storage
- AI Model: @cf/meta/llama-3.3-70b-instruct-fp8-fast via Cloudflare Workers AI
- Communication: REST API endpoints for chat management and messages

### Backend

The backend is built with Cloudflare Workers and uses the Workers AI platform to generate responses. The main components are:

1. **API Endpoint** (`/api/chat`): Accepts POST requests with chat messages and streams responses
2. **Streaming**: Uses Server-Sent Events (SSE) for real-time streaming of AI responses
3. **Workers AI Binding**: Connects to Cloudflare's AI service via the Workers AI binding

### Frontend

The frontend is a simple HTML/CSS/JavaScript application that:

1. Presents a chat interface
2. Sends user messages to the API
3. Processes streaming responses in real-time
4. Maintains chat history on the client side

## Customization

### Changing the Model

To use a different AI model, update the `MODEL_ID` constant in `src/index.ts`. You can find available models in the [Cloudflare Workers AI documentation](https://developers.cloudflare.com/workers-ai/models/).

### Using AI Gateway

The template includes commented code for AI Gateway integration, which provides additional capabilities like rate limiting, caching, and analytics.

To enable AI Gateway:

1. [Create an AI Gateway](https://dash.cloudflare.com/?to=/:account/ai/ai-gateway) in your Cloudflare dashboard
2. Uncomment the gateway configuration in `src/index.ts`
3. Replace `YOUR_GATEWAY_ID` with your actual AI Gateway ID
4. Configure other gateway options as needed:
   - `skipCache`: Set to `true` to bypass gateway caching
   - `cacheTtl`: Set the cache time-to-live in seconds

Learn more about [AI Gateway](https://developers.cloudflare.com/ai-gateway/).

### System Prompt

The current system prompt is "You are an informative, friendly, encouraging study buddy. Provide concise and accurate responses in a quick manner." This can be changed by updating the `SYSTEM_PROMPT` constant in `src/index.ts`.

### Styling

- Light color palette with clear distinction between user and AI messages.
- Sidebar for session history and main chat window adapts to desktop and mobile.
- Active chat highlighted, hover effects on chat list, typing indicator for AI responses.
- Custom font (Lora) and soft color palette to reduce eye strain during study sessions.

## Future Improvements
- Real-time streaming responses via Server-Sent Events (SSE)
- Rich text formatting and math support
- Multi-device login with session sync
- User authentication and personalized AI prompts

## License
MIT License © 2025
