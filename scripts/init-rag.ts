import { initializeRAG } from '../app/lib/rag';

async function init() {
  console.log('Initializing RAG system...');
  try {
    await initializeRAG();
    console.log('RAG system initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to initialize RAG system:', error);
    process.exit(1);
  }
}

init();

