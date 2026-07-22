import { useState, type FormEvent } from "react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

function createInitialMessages(): ChatMessage[] {
  return [
    {
      id: crypto.randomUUID(),
      role: "assistant",
      text: "This is a placeholder chat — it doesn't call a real model yet.",
    },
  ];
}

/**
 * UI-only stub: no model calls yet. Exists to validate the three-column
 * layout; real agent wiring is a separate, later decision.
 */
export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>(
    createInitialMessages,
  );
  const [draft, setDraft] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", text },
    ]);
    setDraft("");
  }

  return (
    <aside className="chat-panel" aria-label="Chat">
      <div className="chat-messages">
        {messages.map((message) => (
          <p
            key={message.id}
            className={`chat-message chat-message--${message.role}`}
          >
            {message.text}
          </p>
        ))}
      </div>
      <form className="chat-input" onSubmit={handleSubmit}>
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Message the agent (not wired up yet)"
        />
        <button type="submit">Send</button>
      </form>
    </aside>
  );
}
