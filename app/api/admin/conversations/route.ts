import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { getAllConversations } from '@/app/lib/database';

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

    const conversations = await getAllConversations();

    return NextResponse.json({
      conversations,
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

