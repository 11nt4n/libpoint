import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import fs from 'fs/promises';
import path from 'path';

// Konfigurasi untuk Ollama lokal yang menyediakan OpenAI-compatible endpoint
const ollama = createOpenAI({
  baseURL: 'http://localhost:11434/v1',
  apiKey: 'ollama', // apiKey required by the SDK, but value doesn't matter for local Ollama
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    let kbContent = '';
    try {
      const kbPath = path.join(process.cwd(), '.knowledge.txt');
      kbContent = await fs.readFile(kbPath, 'utf-8');
    } catch (e) {
      // File tidak ada, abaikan
    }

    const systemPrompt = `Anda adalah LibPoint AI, asisten virtual yang ramah, informatif, dan membantu pengguna sistem perpustakaan LibPoint. Anda dapat menjawab pertanyaan umum maupun pertanyaan tentang buku dan perpustakaan.
    
${kbContent ? `Gunakan informasi referensi berikut untuk menjawab pertanyaan pengguna jika relevan:\n\n${kbContent}` : ''}`;

    const result = await streamText({
      model: ollama('qwen2.5:3b'),
      messages,
      system: systemPrompt,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(JSON.stringify({ error: "Failed to connect to local model. Is Ollama running?", details: error instanceof Error ? error.message : String(error) }), { status: 500 });
  }
}
