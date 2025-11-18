import { NextResponse } from 'next/server';
import { initializeDatabase, createUser } from '@/app/lib/database';
import { initializeRAG } from '@/app/lib/rag';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

export async function POST() {
  try {
    // Initialize database
    await initializeDatabase();

    // Create default admin user
    const defaultUsername = process.env.ADMIN_USERNAME || 'admin';
    const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';

    try {
      const passwordHash = await bcrypt.hash(defaultPassword, 10);
      await createUser(defaultUsername, passwordHash);
    } catch (error: any) {
      // User might already exist, that's okay
      if (!error.message?.includes('UNIQUE constraint')) {
        throw error;
      }
    }

    // Initialize RAG (this might take a while)
    await initializeRAG();

    return NextResponse.json({
      success: true,
      message: 'System initialized successfully',
      admin: {
        username: defaultUsername,
        password: defaultPassword,
      },
    });
  } catch (error) {
    console.error('Initialization error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

