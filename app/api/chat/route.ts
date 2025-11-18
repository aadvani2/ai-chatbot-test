import { NextRequest, NextResponse } from 'next/server';
import { findRelevantChunk, getSimilarityScore } from '@/app/lib/rag';
import { generateChatResponse } from '@/app/lib/openai';
import { saveConversation, getSetting, conversationNeedsHumanIntervention } from '@/app/lib/database';

export const runtime = 'nodejs';

const SIMILARITY_THRESHOLD = 0.7;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversation_id } = body;

    if (!message || !conversation_id) {
      return NextResponse.json(
        { error: 'Message and conversation_id are required' },
        { status: 400 }
      );
    }

    const needsHuman = await conversationNeedsHumanIntervention(conversation_id);
    if (needsHuman) {
      await saveConversation(conversation_id, message, '', false);
      return NextResponse.json({
        response: '',
        needs_human: true,
        message: 'This conversation requires human intervention. Please wait for an admin to respond.',
      });
    }

    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('refund') || lowerMessage.includes('money back')) {
      await saveConversation(conversation_id, message, '', true);
      return NextResponse.json({
        response: '',
        needs_human: true,
      });
    }

    const toneInstructions = await getSetting('tone_instructions') || 
      'Respond in a friendly and helpful tone in English.';
    const fallbackMessage = await getSetting('fallback_message') || 
      'I apologize, but I don\'t have enough information to answer this question. Please contact support for further assistance.';

    let response: string;

    try {
      const relevantChunk = await findRelevantChunk(message, SIMILARITY_THRESHOLD);
      const similarity = await getSimilarityScore(message);

      if (relevantChunk && similarity >= SIMILARITY_THRESHOLD) {
        try {
          const prompt = `Context: ${relevantChunk.text}\n\nUser question: ${message}\n\nAnswer the question using the information from the context.`;
          response = await generateChatResponse(prompt, toneInstructions);
        } catch (error: any) {
          if (error?.message === 'OPENAI_QUOTA_EXCEEDED') {
            response = fallbackMessage;
          } else {
            throw error;
          }
        }
      } else {
        response = fallbackMessage;
      }
    } catch (error: any) {
      if (error?.message === 'OPENAI_QUOTA_EXCEEDED') {
        response = fallbackMessage;
      } else {
        throw error;
      }
    }

    await saveConversation(conversation_id, message, response, false);

    return NextResponse.json({
      response,
      needs_human: false,
    });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

