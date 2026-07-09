import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// Konfigurasi untuk Ollama lokal yang menyediakan OpenAI-compatible endpoint
const ollama = createOpenAI({
  baseURL: 'http://localhost:11434/v1',
  apiKey: 'ollama', // apiKey required by the SDK, but value doesn't matter for local Ollama
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = streamText({
      model: ollama('qwen2.5:7b'), // Ganti dengan nama model Ollama Anda, e.g., 'qwen3:8b' jika ada
      messages,
      system: "Anda adalah LibPoint AI, asisten virtual yang ramah, informatif, dan membantu pengguna sistem perpustakaan LibPoint. Anda dapat menjawab pertanyaan umum maupun pertanyaan tentang buku dan perpustakaan.",
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(JSON.stringify({ error: "Failed to connect to local model. Is Ollama running?" }), { status: 500 });
  }
}
