import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { getTotalConversations, getTotalMessages, getHumanEscalations } from '@/app/lib/database';

export const runtime = 'nodejs';

async function checkAuth() {
  const session = await auth();
  if (!session) {
    return false;
  }
  return true;
}

export async function GET(request: NextRequest) {
  try {
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const [totalConversations, totalMessages, humanEscalations] = await Promise.all([
      getTotalConversations(),
      getTotalMessages(),
      getHumanEscalations(),
    ]);

    return NextResponse.json({
      totalConversations,
      totalMessages,
      humanEscalations,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

