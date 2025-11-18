import { NextRequest, NextResponse } from 'next/server';
import { getConversationHistory } from '@/app/lib/database';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const conversationId = id;

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    const { getConversationWithReplies } = await import('@/app/lib/database');
    const messages = await getConversationWithReplies(conversationId);

    return NextResponse.json({
      conversation_id: conversationId,
      messages: messages,
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

