import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { marked } from "marked";

// Configurer marked pour le rendu sécurisé
marked.setOptions({
  breaks: true,
  gfm: true,
});

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatBotProps {
  docId: string;
}

export default function ChatBot({ docId }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          docId,
          message: userMessage,
          history: messages,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi du message");
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Bouton flottant pour ouvrir le chat */}
      <button
        onClick={() => setIsOpen(true)}
        className="chatbot-toggle position "
        aria-label="Ouvrir le chat IA"
        title="Poser une question sur le document"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <path d="M8 10h.01" />
          <path d="M12 10h.01" />
          <path d="M16 10h.01" />
        </svg>
      </button>

      {/* Modal du chat */}
      {isOpen && createPortal(
        <div className="chatbot-overlay" onClick={() => setIsOpen(false)}>
          <div className="chatbot-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="chatbot-header">
              <div className="chatbot-header-info">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
                <span>Assistant Document IA</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="chatbot-close"
                aria-label="Fermer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="chatbot-messages">
              {messages.length === 0 && (
                <div className="chatbot-welcome">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <h3>Posez une question sur ce document</h3>
                  <p>
                    L'assistant IA peut vous aider à comprendre, résumer ou
                    analyser le contenu de ce document.
                  </p>
                  <div className="chatbot-suggestions">
                    <button
                      onClick={() => {
                        setInput("Peux-tu me résumer ce document ?");
                      }}
                    >
                      📝 Résumer le document
                    </button>
                    <button
                      onClick={() => {
                        setInput("Quels sont les points clés de ce document ?");
                      }}
                    >
                      🎯 Points clés
                    </button>
                    <button
                      onClick={() => {
                        setInput("De quoi parle ce document ?");
                      }}
                    >
                      ❓ Sujet du document
                    </button>
                  </div>
                </div>
              )}

              {messages.map((msg, index) => (
                <div key={index} className={`chatbot-message ${msg.role}`}>
                  <div className="message-avatar">
                    {msg.role === "user" ? "👤" : "🤖"}
                  </div>
                  {msg.role === "assistant" ? (
                    <div
                      className="message-content markdown-content"
                      dangerouslySetInnerHTML={{
                        __html: marked.parse(msg.content) as string,
                      }}
                    />
                  ) : (
                    <div className="message-content">{msg.content}</div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="chatbot-message assistant">
                  <div className="message-avatar">🤖</div>
                  <div className="message-content loading">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                </div>
              )}

              {error && <div className="chatbot-error">{error}</div>}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="chatbot-input-container">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Posez votre question..."
                disabled={isLoading}
                rows={1}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="chatbot-send"
                aria-label="Envoyer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        .chatbot-toggle {
          /* Position gérée par le parent (FloatingControls) */
          /* position: fixed; */
          /* bottom: 2rem; */
          /* right: 2rem; */
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
          transition: transform 0.2s, box-shadow 0.2s;
          z-index: 1000;
        }

        .chatbot-toggle:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
        }

        .chatbot-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1001;
          padding: 1rem;
        }

        .chatbot-modal {
          background: var(--bg-color, #fff);
          color: var(--text-color, #1a1a1a);
          border-radius: 16px;
          width: 100%;
          max-width: 500px;
          height: 600px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
        }

        .chatbot-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.25rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .chatbot-header-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
        }

        .chatbot-close {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .chatbot-close:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .chatbot-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .chatbot-welcome {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 2rem;
          color: var(--text-color, #666);
          height: 100%;
        }

        .chatbot-welcome svg {
          opacity: 0.3;
          margin-bottom: 1rem;
        }

        .chatbot-welcome h3 {
          margin: 0 0 0.5rem;
          font-size: 1.1rem;
        }

        .chatbot-welcome p {
          margin: 0 0 1.5rem;
          font-size: 0.9rem;
          opacity: 0.7;
        }

        .chatbot-suggestions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          width: 100%;
        }

        .chatbot-suggestions button {
          background: rgba(102, 126, 234, 0.1);
          border: 1px solid rgba(102, 126, 234, 0.2);
          color: var(--text-color, #333);
          padding: 0.75rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          text-align: left;
          transition: background 0.2s;
        }

        .chatbot-suggestions button:hover {
          background: rgba(102, 126, 234, 0.2);
        }

        .chatbot-message {
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
        }

        .chatbot-message.user {
          flex-direction: row-reverse;
        }

        .message-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          flex-shrink: 0;
        }

        .message-content {
          background: rgba(102, 126, 234, 0.1);
          padding: 0.75rem 1rem;
          border-radius: 12px;
          max-width: 80%;
          line-height: 1.5;
          font-size: 0.95rem;
        }

        .message-content.markdown-content {
          white-space: normal;
        }

        .message-content.markdown-content p {
          margin: 0 0 0.5rem;
        }

        .message-content.markdown-content p:last-child {
          margin-bottom: 0;
        }

        .message-content.markdown-content ul,
        .message-content.markdown-content ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }

        .message-content.markdown-content li {
          margin-bottom: 0.25rem;
        }

        .message-content.markdown-content code {
          background: rgba(0, 0, 0, 0.1);
          padding: 0.1rem 0.3rem;
          border-radius: 3px;
          font-size: 0.85em;
        }

        .message-content.markdown-content pre {
          background: rgba(0, 0, 0, 0.1);
          padding: 0.75rem;
          border-radius: 6px;
          overflow-x: auto;
          margin: 0.5rem 0;
        }

        .message-content.markdown-content pre code {
          background: none;
          padding: 0;
        }

        .message-content.markdown-content strong {
          font-weight: 600;
        }

        .message-content.markdown-content h1,
        .message-content.markdown-content h2,
        .message-content.markdown-content h3,
        .message-content.markdown-content h4 {
          margin: 0.75rem 0 0.5rem;
          font-weight: 600;
        }

        .message-content.markdown-content h1 { font-size: 1.2em; }
        .message-content.markdown-content h2 { font-size: 1.1em; }
        .message-content.markdown-content h3 { font-size: 1.05em; }

        .message-content.markdown-content blockquote {
          border-left: 3px solid #667eea;
          padding-left: 0.75rem;
          margin: 0.5rem 0;
          opacity: 0.9;
        }

        .chatbot-message.user .message-content {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          white-space: pre-wrap;
        }

        .message-content.loading {
          display: flex;
          gap: 4px;
          padding: 1rem;
        }

        .dot {
          width: 8px;
          height: 8px;
          background: #667eea;
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }

        .dot:nth-child(1) { animation-delay: -0.32s; }
        .dot:nth-child(2) { animation-delay: -0.16s; }

        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }

        .chatbot-error {
          background: #fef2f2;
          color: #dc2626;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          font-size: 0.9rem;
          text-align: center;
        }

        .chatbot-input-container {
          display: flex;
          gap: 0.5rem;
          padding: 1rem;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
          background: var(--bg-color, #fff);
        }

        .chatbot-input-container textarea {
          flex: 1;
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          padding: 0.75rem 1rem;
          font-size: 0.95rem;
          resize: none;
          font-family: inherit;
          background: var(--bg-color, #fff);
          color: var(--text-color, #1a1a1a);
        }

        .chatbot-input-container textarea:focus {
          outline: none;
          border-color: #667eea;
        }

        .chatbot-send {
          width: 44px;
          height: 44px;
          border-radius: 8px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.2s;
        }

        .chatbot-send:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .chatbot-send:not(:disabled):hover {
          opacity: 0.9;
        }

        @media (max-width: 768px) {
          .chatbot-modal {
            max-height: 100vh;
            height: 100%;
            border-radius: 0;
          }

          .chatbot-overlay {
            padding: 0;
          }

          .chatbot-toggle {
            bottom: 1rem;
            right: 1rem;
          }
        }
      `}</style>
    </>
  );
}
