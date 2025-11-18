import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { getAllSettings, setSetting } from '@/app/lib/database';

export const runtime = 'nodejs';

// Simple auth check
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

    const settings = await getAllSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { welcome_message, fallback_message, tone_instructions } = body;

    if (welcome_message !== undefined) {
      await setSetting('welcome_message', welcome_message);
    }
    if (fallback_message !== undefined) {
      await setSetting('fallback_message', fallback_message);
    }
    if (tone_instructions !== undefined) {
      await setSetting('tone_instructions', tone_instructions);
    }

    const updatedSettings = await getAllSettings();
    return NextResponse.json({
      success: true,
      settings: updatedSettings,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

