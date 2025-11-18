import fs from 'fs';
import path from 'path';
import { generateEmbedding } from './openai';

// Calculate cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) {
    return 0;
  }

  return dotProduct / denominator;
}

interface Chunk {
  text: string;
  embedding: number[];
  index: number;
}

let chunks: Chunk[] = [];
let isInitialized = false;

// Simple token estimation (rough approximation)
function estimateTokens(text: string): number {
  return Math.ceil(text.split(/\s+/).length * 1.3);
}

// Chunk text with overlap
function chunkText(text: string, chunkSize: number = 500, overlap: number = 50): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentTokens = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const wordTokens = estimateTokens(word);

    if (currentTokens + wordTokens > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
      
      // Create overlap by keeping last N words
      const overlapWords = currentChunk.slice(-overlap);
      currentChunk = overlapWords;
      currentTokens = estimateTokens(overlapWords.join(' '));
    }

    currentChunk.push(word);
    currentTokens += wordTokens;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  return chunks;
}

// Initialize RAG system by loading and embedding the article
export async function initializeRAG(): Promise<void> {
  if (isInitialized) {
    return;
  }

  const articlePath = path.join(process.cwd(), 'data', 'article.txt');
  
  if (!fs.existsSync(articlePath)) {
    throw new Error(`Article file not found at ${articlePath}`);
  }

  const articleText = fs.readFileSync(articlePath, 'utf-8');
  const textChunks = chunkText(articleText, 500, 50);

  console.log(`Initializing RAG with ${textChunks.length} chunks...`);

  chunks = [];
  for (let i = 0; i < textChunks.length; i++) {
    const chunk = textChunks[i];
    try {
      const embedding = await generateEmbedding(chunk);
      chunks.push({
        text: chunk,
        embedding,
        index: i,
      });
      console.log(`Processed chunk ${i + 1}/${textChunks.length}`);
    } catch (error: any) {
      if (error?.message === 'OPENAI_QUOTA_EXCEEDED') {
        console.error('OpenAI quota exceeded. RAG system will not be available.');
        chunks = [];
        isInitialized = true;
        return;
      }
      console.error(`Error embedding chunk ${i + 1}:`, error);
      throw error;
    }
  }

  isInitialized = true;
  console.log('RAG system initialized successfully');
}

export async function findRelevantChunk(
  query: string,
  threshold: number = 0.7
): Promise<{ text: string; similarity: number } | null> {
  if (!isInitialized) {
    await initializeRAG();
  }

  if (chunks.length === 0) {
    return null;
  }

  try {
    const queryEmbedding = await generateEmbedding(query);

    let bestMatch: { text: string; similarity: number } | null = null;
    let bestSimilarity = -1;

    for (const chunk of chunks) {
      const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = {
          text: chunk.text,
          similarity,
        };
      }
    }

    if (bestMatch && bestMatch.similarity >= threshold) {
      return bestMatch;
    }

    return bestMatch;
  } catch (error: any) {
    if (error?.message === 'OPENAI_QUOTA_EXCEEDED') {
      return null;
    }
    throw error;
  }
}

export async function getSimilarityScore(query: string): Promise<number> {
  try {
    const result = await findRelevantChunk(query, 0);
    return result?.similarity || 0;
  } catch (error: any) {
    if (error?.message === 'OPENAI_QUOTA_EXCEEDED') {
      return 0;
    }
    throw error;
  }
}

