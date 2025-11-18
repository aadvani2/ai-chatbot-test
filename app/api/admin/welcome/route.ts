import { NextRequest, NextResponse } from 'next/server';
import { getSetting } from '@/app/lib/database';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const welcomeMessage = await getSetting('welcome_message');
    return NextResponse.json({
      welcome_message: welcomeMessage || 'Hello! How can I help you today?',
    });
  } catch (error) {
    console.error('Error fetching welcome message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

