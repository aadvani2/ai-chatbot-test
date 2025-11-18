import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { saveAdminReply } from '@/app/lib/database';

export const runtime = 'nodejs';

async function checkAuth() {
  const session = await auth();
  if (!session) {
    return false;
  }
  return true;
}

export async function POST(
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
    const body = await request.json();
    const { message_id, admin_reply } = body;

    if (!message_id || !admin_reply) {
      return NextResponse.json(
        { error: 'message_id and admin_reply are required' },
        { status: 400 }
      );
    }

    await saveAdminReply(id, message_id, admin_reply);

    return NextResponse.json({
      success: true,
      message: 'Reply saved successfully',
    });
  } catch (error) {
    console.error('Error saving admin reply:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

