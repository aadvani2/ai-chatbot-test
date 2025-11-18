import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { getConversationWithReplies } from '@/app/lib/database';

export const runtime = 'nodejs';

async function checkAuth() {
  const session = await auth();
  if (!session) {
    return false;
  }
  return true;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const messages = await getConversationWithReplies(id);

    return NextResponse.json({
      conversation_id: id,
      messages,
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

