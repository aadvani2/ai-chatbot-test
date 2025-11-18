import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Mini AI Chatbot System
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          RAG-based chatbot system with admin panel and human operator escalation.
        </p>
        <div className="space-y-4">
          <Link
            href="/chat"
            className="block bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 text-center font-medium"
          >
            Open Chat
          </Link>
          <Link
            href="/admin/login"
            className="block bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 text-center font-medium"
          >
            Admin Panel
          </Link>
        </div>
      </div>
    </div>
  );
}
