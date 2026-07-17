import { streamText, embed } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { supabase } from '@/lib/supabase';

// Konfigurasi untuk Ollama lokal yang menyediakan OpenAI-compatible endpoint
const ollama = createOpenAI({
  baseURL: 'http://127.0.0.1:11434/v1',
  apiKey: 'ollama', // apiKey required by the SDK, but value doesn't matter for local Ollama
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("RECEIVED BODY:", JSON.stringify(body, null, 2));
    const { messages } = body;

    // 1. Dapatkan pesan terakhir dari user sebagai query pencarian
    const lastMessage = messages[messages.length - 1];
    const query = lastMessage.content || (lastMessage.parts && lastMessage.parts[0]?.text) || '';

    let kbContent = '';
    
    try {
      // 2. Vectorize: Buat embedding dari query pengguna
      const { embedding } = await embed({
        model: ollama.embedding('nomic-embed-text'),
        value: query,
      });

      // 3. Search & Retrieve: Cari chunks terdekat di database menggunakan RPC function
      const { data: chunks, error } = await supabase.rpc('match_chunks', {
        query_embedding: embedding,
        match_threshold: 0.3, // Ambang batas kemiripan (semakin dekat ke 1 semakin mirip)
        match_count: 5 // Ambil 5 potongan teks paling relevan
      });

      console.log('Vector match error:', error);
      console.log('Chunks found:', chunks?.length);

      if (error) {
        console.error('Error in match_chunks RPC:', error);
      } else if (chunks && chunks.length > 0) {
        // Gabungkan konten chunk yang ditemukan
        kbContent = chunks.map((chunk: any) => chunk.content).join('\n\n---\n\n');
      }
    } catch (e) {
      console.error('Failed to perform vector search', e);
    }

    // 4. Augment: Gabungkan konteks langsung ke pesan terakhir pengguna
    const formattedMessages = messages.map((m: any, index: number) => {
      let textContent = m.content || (m.parts && m.parts[0]?.text) || '';
      
      // Inject konteks HANYA pada pesan terakhir (pertanyaan terbaru)
      if (index === messages.length - 1 && m.role === 'user') {
        textContent = `Berikut adalah referensi dari dokumen perpustakaan:
---
${kbContent ? kbContent : 'Tidak ada dokumen yang cocok dengan pertanyaan ini.'}
---

TUGAS ANDA:
1. Jawab pertanyaan berikut HANYA berdasarkan informasi di atas.
2. Jika jawabannya tidak ada di atas, Anda WAJIB menjawab: "Maaf, saya belum memiliki informasi mengenai hal tersebut di database perpustakaan saat ini." Jangan pernah menebak atau mengarang!
3. Jawablah dengan bahasa Indonesia yang jelas dan profesional.

Pertanyaan Pengguna: ${textContent}`;
      }

      return {
        role: m.role,
        content: textContent
      };
    });

    const systemPrompt = `Anda adalah LibPoint AI, asisten virtual untuk sistem perpustakaan LibPoint. Tugas Anda adalah memberikan informasi dengan akurat dan ketat HANYA berdasarkan referensi teks yang diberikan oleh pengguna.`;

    // 5. Generate: Buat jawaban (memakai stream untuk UI Chat)
    const result = await streamText({
      model: ollama('qwen2.5:3b'),
      messages: formattedMessages,
      system: systemPrompt,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(JSON.stringify({ error: "Failed to connect to local model. Is Ollama running?", details: error instanceof Error ? error.message : String(error) }), { status: 500 });
  }
}
