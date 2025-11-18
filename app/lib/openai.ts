import OpenAI from 'openai';

let openaiInstance: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (openaiInstance === null) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiInstance;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const openai = getOpenAI();
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });
    return response.data[0].embedding;
  } catch (error: any) {
    if (error?.code === 'insufficient_quota' || error?.status === 429) {
      throw new Error('OPENAI_QUOTA_EXCEEDED');
    }
    throw error;
  }
}

export async function generateChatResponse(
  prompt: string,
  toneInstructions: string
): Promise<string> {
  try {
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: toneInstructions,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content || 'I was unable to generate a response.';
  } catch (error: any) {
    if (error?.code === 'insufficient_quota' || error?.status === 429) {
      throw new Error('OPENAI_QUOTA_EXCEEDED');
    }
    throw error;
  }
}

