'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/app/components/AdminLayout';

interface Settings {
  welcome_message: string;
  fallback_message: string;
  tone_instructions: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    welcome_message: '',
    fallback_message: '',
    tone_instructions: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await response.json();
      setSettings({
        welcome_message: data.welcome_message || '',
        fallback_message: data.fallback_message || '',
        tone_instructions: data.tone_instructions || '',
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage({ type: 'error', text: 'Error loading settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Error saving settings');
      }

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Error saving settings' });
    } finally {
      setSaving(false);
    }
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

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">

            {message && (
              <div
                className={`mb-4 p-4 rounded-md ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="welcome_message"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Welcome Message
                </label>
                <textarea
                  id="welcome_message"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={settings.welcome_message}
                  onChange={(e) =>
                    setSettings({ ...settings, welcome_message: e.target.value })
                  }
                  placeholder="Message shown when user opens the chat"
                />
              </div>

              <div>
                <label
                  htmlFor="fallback_message"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Fallback Message
                </label>
                <textarea
                  id="fallback_message"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={settings.fallback_message}
                  onChange={(e) =>
                    setSettings({ ...settings, fallback_message: e.target.value })
                  }
                  placeholder="Message shown when AI cannot find relevant information"
                />
              </div>

              <div>
                <label
                  htmlFor="tone_instructions"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Tone Instructions
                </label>
                <textarea
                  id="tone_instructions"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={settings.tone_instructions}
                  onChange={(e) =>
                    setSettings({ ...settings, tone_instructions: e.target.value })
                  }
                  placeholder="Instructions for the tone and style of AI responses"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

