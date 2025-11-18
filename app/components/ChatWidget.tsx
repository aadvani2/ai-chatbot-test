'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant' | 'admin';
  content: string;
  needsHuman?: boolean;
  adminReply?: string;
}

interface ChatWidgetProps {
  welcomeMessage: string;
}

export default function ChatWidget({ welcomeMessage }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const [humanEscalated, setHumanEscalated] = useState(false);
  const [showEscalationMessage, setShowEscalationMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const storedId = localStorage.getItem('conversation_id');
    if (storedId) {
      setConversationId(storedId);
      loadConversationHistory(storedId);
    } else {
      const newId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setConversationId(newId);
      localStorage.setItem('conversation_id', newId);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkForAdminReplies = useCallback(async () => {
    if (!conversationId || !humanEscalated) return;
    
    try {
      const response = await fetch(`/api/conversation/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        const updatedMessages: Message[] = [];
        
        data.messages.forEach((msg: any) => {
          if (!msg.message && msg.admin_reply) {
            updatedMessages.push({
              role: 'admin' as const,
              content: msg.admin_reply,
              needsHuman: msg.needs_human === 1,
            });
          } else {
            if (msg.message) {
              updatedMessages.push({ role: 'user' as const, content: msg.message });
            }
            if (msg.response && msg.response.trim()) {
              updatedMessages.push({
                role: 'assistant' as const,
                content: msg.response,
                needsHuman: msg.needs_human === 1,
              });
            }
            if (msg.admin_reply && msg.message) {
              updatedMessages.push({
                role: 'admin' as const,
                content: msg.admin_reply,
                needsHuman: msg.needs_human === 1,
              });
            }
          }
        });
        
        setMessages(updatedMessages);
      }
    } catch (error) {
      console.error('Error checking for admin replies:', error);
    }
  }, [conversationId, humanEscalated]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (humanEscalated && conversationId) {
      pollingIntervalRef.current = setInterval(() => {
        checkForAdminReplies();
      }, 3000);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    } else {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
  }, [humanEscalated, conversationId, checkForAdminReplies]);

  const loadConversationHistory = async (id: string) => {
    try {
      const response = await fetch(`/api/conversation/${id}`);
      if (response.ok) {
        const data = await response.json();
        const history: Message[] = [];
        
        data.messages.forEach((msg: any) => {
          if (!msg.message && msg.admin_reply) {
            history.push({
              role: 'admin' as const,
              content: msg.admin_reply,
              needsHuman: msg.needs_human === 1,
            });
          } else {
            if (msg.message) {
              history.push({ role: 'user' as const, content: msg.message });
            }
            if (msg.response && msg.response.trim()) {
              history.push({
                role: 'assistant' as const,
                content: msg.response,
                needsHuman: msg.needs_human === 1,
              });
            }
            if (msg.admin_reply && msg.message) {
              history.push({
                role: 'admin' as const,
                content: msg.admin_reply,
                needsHuman: msg.needs_human === 1,
              });
            }
          }
        });
        
        setMessages(history);
        const hasHumanEscalation = data.messages.some((msg: any) => msg.needs_human === 1);
        if (hasHumanEscalation) {
          setHumanEscalated(true);
          setShowEscalationMessage(true);
        }
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversation_id: conversationId,
        }),
      });

      const data = await response.json();

      if (data.needs_human) {
        setHumanEscalated(true);
        setShowEscalationMessage(true);
        await loadConversationHistory(conversationId);
      } else if (data.response && data.response.trim()) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.response },
        ]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'An error occurred. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 flex items-center justify-center z-50"
          aria-label="Open chat"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
          <div className="bg-indigo-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <h3 className="font-semibold">Support Chat</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200"
              aria-label="Close chat"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-gray-600 text-sm">{welcomeMessage}</div>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : msg.role === 'admin'
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : msg.needsHuman
                      ? 'bg-red-100 text-red-800 border border-red-300'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {msg.role === 'admin' && (
                    <div className="text-xs font-semibold mb-1 text-green-700">Admin Reply:</div>
                  )}
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-200">
            {showEscalationMessage && (
              <div className="text-sm text-red-600 text-center py-2 mb-2 bg-red-50 rounded-md px-2">
               AI a oprit. Un colegva prelua conversatia.
              </div>
            )}
            <form onSubmit={handleSend} className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

