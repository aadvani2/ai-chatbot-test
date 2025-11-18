'use client';

import { useEffect, useState } from 'react';
import ChatWidget from '@/app/components/ChatWidget';

export default function ChatPage() {
  const [welcomeMessage, setWelcomeMessage] = useState('Hello! How can I help you today?');

  useEffect(() => {
    fetchWelcomeMessage();
  }, []);

  const fetchWelcomeMessage = async () => {
    try {
      const response = await fetch('/api/admin/welcome');
      if (response.ok) {
        const data = await response.json();
        setWelcomeMessage(data.welcome_message || 'Hello! How can I help you today?');
      }
    } catch (error) {
      console.error('Error fetching welcome message:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Chatbot IPTV
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Welcome! Use the chat widget in the bottom right corner to start a conversation.
        </p>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">About this chatbot</h2>
          <p className="text-gray-700">
            This chatbot can help you with questions about Internet Protocol Television (IPTV).
            You can ask about features, benefits, or how IPTV works.
          </p>
        </div>
      </div>
      <ChatWidget welcomeMessage={welcomeMessage} />
    </div>
  );
}

