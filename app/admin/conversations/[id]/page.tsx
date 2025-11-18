'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/app/components/AdminLayout';

interface Message {
  id: number;
  message: string;
  response: string;
  needs_human: number;
  admin_reply: string | null;
  timestamp: string;
}

export default function ConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminMessage, setAdminMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (conversationId) {
      fetchConversation();
    }
  }, [conversationId]);

  const fetchConversation = async () => {
    try {
      const response = await fetch(`/api/admin/conversations/${conversationId}`);
      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminMessage.trim() || saving) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/conversations/${conversationId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          admin_message: adminMessage,
        }),
      });

      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add message');
      }

      await fetchConversation();
      setAdminMessage('');
    } catch (error: any) {
      console.error('Error adding admin message:', error);
      alert(error.message || 'Failed to add message. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  const needsHumanMessages = messages.filter((m) => m.needs_human === 1);
  const conversationNeedsHuman = needsHumanMessages.length > 0;

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Conversation Details</h1>
            <p className="text-sm text-gray-600 mt-1 font-mono">{conversationId}</p>
          </div>
          <Link
            href="/admin/conversations"
            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
          >
            ← Back to Conversations
          </Link>
        </div>

        {conversationNeedsHuman && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-red-800 font-medium">
                {needsHumanMessages.length} message{needsHumanMessages.length > 1 ? 's' : ''} require{needsHumanMessages.length === 1 ? 's' : ''} human intervention. You can add a message at the end of this conversation.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((msg, idx) => {
            const isAdminOnlyMessage = !msg.message && msg.admin_reply;
            
            return (
              <div key={msg.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    {isAdminOnlyMessage ? (
                      <>
                        <div className="mb-3">
                          <span className="text-xs font-medium text-gray-500">Admin Message</span>
                          <p className="text-gray-900 bg-green-50 rounded-md p-3 mt-1 border border-green-200">
                            {msg.admin_reply}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">{formatDate(msg.timestamp)}</p>
                      </>
                    ) : (
                      <>
                        <div className="mb-3">
                          <div className="flex items-center mb-2">
                            <span className="text-xs font-medium text-gray-500">User Message</span>
                            {msg.needs_human === 1 && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                Needs Human
                              </span>
                            )}
                          </div>
                          <p className="text-gray-900 bg-gray-50 rounded-md p-3">{msg.message}</p>
                        </div>

                        <div className="mb-3">
                          <span className="text-xs font-medium text-gray-500">AI Response</span>
                          <p className="text-gray-700 bg-blue-50 rounded-md p-3 mt-1">{msg.response || '(No response)'}</p>
                        </div>

                        {msg.admin_reply && (
                          <div className="mb-3">
                            <span className="text-xs font-medium text-gray-500">Admin Reply</span>
                            <p className="text-gray-900 bg-green-50 rounded-md p-3 mt-1 border border-green-200">
                              {msg.admin_reply}
                            </p>
                          </div>
                        )}

                        <p className="text-xs text-gray-500 mt-2">{formatDate(msg.timestamp)}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {conversationNeedsHuman && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6 border-t-4 border-indigo-600">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Admin Message</h3>
            <form onSubmit={handleAddMessage} className="space-y-4">
              <textarea
                value={adminMessage}
                onChange={(e) => setAdminMessage(e.target.value)}
                placeholder="Type your message..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                disabled={saving}
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving || !adminMessage.trim()}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {saving ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

