# Mini AI Chatbot System

A RAG-based chatbot built with Next.js, NextAuth, and OpenAI. Includes an admin panel for managing settings and automatic escalation to human agents when needed.

## What's Inside

- **RAG implementation** - Vector search to find relevant info from the knowledge base
- **Chat widget** - Floating chat UI component
- **Admin panel** - Manage welcome messages, fallback responses, and AI tone
- **Human escalation** - Automatically flags conversations when users mention "refund" or "money back"
- **Conversation history** - Everything stored in SQLite
- **NextAuth** - Secure admin authentication

## Project Structure

```
/app
  /api
    /chat              - Main chat endpoint
    /conversation      - Get conversation history
    /admin
      /settings        - Admin settings CRUD
      /welcome         - Welcome message endpoint
    /auth              - NextAuth routes
    /init              - Initialize system
  /admin
    /login             - Admin login page
    /settings          - Admin settings (protected)
  /chat                - Chat page with widget
  /components
    ChatWidget.tsx     - The chat widget component
  /lib
    database.ts        - SQLite helpers
    rag.ts             - RAG logic (chunking, embeddings, similarity)
    openai.ts          - OpenAI client
    auth.ts            - NextAuth config
/data
  article.txt          - Knowledge base (Wikipedia article about IPTV)
  chatbot.db           - SQLite database (auto-generated)
```

## Getting Started

You'll need Node.js 18+ and an OpenAI API key.

1. **Install dependencies**
```bash
npm install
```

2. **Set up environment variables**

Create a `.env.local` file in the root:

```env
OPENAI_API_KEY=your_openai_api_key_here
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# Optional - default admin credentials are admin/admin123
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

Generate a secret for NextAuth:
```bash
openssl rand -base64 32
```

3. **Initialize the system**

Run the init script:
```bash
npm run init
```

Or hit the init endpoint after starting the server:
```bash
curl -X POST http://localhost:3000/api/init
```

Note: The RAG initialization takes a few minutes since it generates embeddings for all chunks in the article.

4. **Start the dev server**
```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Usage

### Chat Interface

Go to `/chat` and you'll see a floating chat button in the bottom right. Click it to start chatting. The bot answers questions about IPTV based on the Wikipedia article in the knowledge base.

### Admin Panel

Head to `/admin/login` and sign in (default: `admin` / `admin123`). From the settings page you can configure:

- **Welcome message** - Shown when users open the chat
- **Fallback message** - Used when the AI can't find relevant info
- **Tone instructions** - How the AI should respond (friendly, formal, etc.)

### Human Escalation

If a user mentions "refund" or "money back", the system automatically:
- Detects the keywords
- Returns `needs_human: true`
- Shows: "AI a oprit. Un coleg va prelua conversația."
- Disables the chat for that user

## API Endpoints

### POST /api/chat

Send a message to the chatbot.

```json
{
  "message": "What is IPTV?",
  "conversation_id": "conv_123456"
}
```

Response:
```json
{
  "response": "AI response here...",
  "needs_human": false
}
```

If escalation is needed:
```json
{
  "response": "",
  "needs_human": true
}
```

### GET /api/conversation/[id]

Get conversation history.

Returns an array of messages with timestamps.

### GET /api/admin/settings

Get all admin settings (requires auth).

### POST /api/admin/settings

Update admin settings (requires auth).

```json
{
  "welcome_message": "New welcome message",
  "fallback_message": "New fallback message",
  "tone_instructions": "New tone instructions"
}
```

## How RAG Works

The system chunks the article into ~500 token pieces with 50 token overlap. Each chunk gets embedded using OpenAI's `text-embedding-ada-002`. When a user sends a message:

1. The message gets embedded
2. Cosine similarity is calculated against all chunks
3. The most relevant chunk is selected
4. If similarity is below 0.7, the fallback message is used instead

## Database

SQLite database with three tables:
- `conversations` - Stores all messages and responses
- `settings` - Admin settings
- `users` - Admin users for NextAuth

The database file is created automatically at `/data/chatbot.db` on first run.

## Development

Backend logic lives in `/app/lib`, API routes in `/app/api`, React components in `/app/components`, and pages in `/app`.

To add new features, just follow the existing patterns. The codebase is pretty straightforward.

## Production

Before deploying:
- Set proper environment variables
- Generate a secure `NEXTAUTH_SECRET`
- Change the default admin credentials
- Run `npm run build` then `npm start`

## Demo Checklist

For the demo video, show:
1. Admin login
2. Configuring settings (welcome message, fallback, tone)
3. Using the chat widget with IPTV questions
4. Testing human escalation with "refund" or "money back"
5. Viewing conversation history
