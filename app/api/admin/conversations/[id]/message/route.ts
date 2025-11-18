import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { addAdminMessage, conversationNeedsHumanIntervention } from '@/app/lib/database';

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
    const { admin_message } = body;

    if (!admin_message || !admin_message.trim()) {
      return NextResponse.json(
        { error: 'admin_message is required' },
        { status: 400 }
      );
    }

    const needsHuman = await conversationNeedsHumanIntervention(id);
    if (!needsHuman) {
      return NextResponse.json(
        { error: 'This conversation does not require human intervention' },
        { status: 400 }
      );
    }

    await addAdminMessage(id, admin_message.trim());

    return NextResponse.json({
      success: true,
      message: 'Admin message added successfully',
    });
  } catch (error) {
    console.error('Error adding admin message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

