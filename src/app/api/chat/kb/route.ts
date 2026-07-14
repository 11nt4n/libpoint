import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { embedMany } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// Konfigurasi untuk Ollama lokal
const ollama = createOpenAI({
  baseURL: 'http://localhost:11434/v1',
  apiKey: 'ollama',
});

// Fungsi pemecah teks (Chunking) Berbasis Kata (Word-based Chunking)
// Lebih baik dari pemotongan per-karakter karena tidak memotong kata di tengah-tengah
function chunkText(text: string, wordsPerChunk = 150, overlap = 30) {
  const words = text.replace(/\s+/g, ' ').trim().split(' ');
  const chunks = [];
  let i = 0;
  
  // Jika teks sangat pendek, jadikan 1 chunk saja
  if (words.length <= wordsPerChunk) return [words.join(' ')];

  while (i < words.length) {
    const chunkWords = words.slice(i, i + wordsPerChunk);
    chunks.push(chunkWords.join(' '));
    
    // Geser index dengan memperhitungkan overlap
    i += wordsPerChunk - overlap;
  }
  return chunks;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let text = '';
    
    // Parse PDF or Text
    if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
      try {
        const pdfParse = require('pdf-parse/lib/pdf-parse.js');
        const pdfData = await pdfParse(buffer);
        text = pdfData.text;
      } catch (err: any) {
        console.error("PDF Parsing Error:", err);
        return NextResponse.json({ error: 'Failed to parse PDF file. Ensure it is a valid PDF.' }, { status: 400 });
      }
    } else {
      text = await file.text();
    }

    // 1. Upload file to Supabase Storage
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const { data: storageData, error: storageError } = await supabase.storage
      .from('knowledge_base')
      .upload(fileName, buffer, {
        contentType: file.type || 'application/pdf',
        upsert: false
      });

    if (storageError) {
      console.error('Storage upload error:', storageError);
      return NextResponse.json({ error: 'Failed to upload file to Supabase Storage' }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage.from('knowledge_base').getPublicUrl(fileName);

    // 2. Insert extracted text and file URL to Database (knowledge_bases)
    const { data: kbData, error: dbError } = await supabase
      .from('knowledge_bases')
      .insert({
        filename: file.name,
        content: text,
        file_url: publicUrl
      })
      .select('id')
      .single();

    if (dbError || !kbData) {
      console.error('Database insert error:', dbError);
      return NextResponse.json({ error: 'Failed to save knowledge base to database' }, { status: 500 });
    }

    // 3. Proses Chunking
    // Membersihkan teks dari spasi ganda dan baris kosong
    const cleanText = text.replace(/\s+/g, ' ').trim();
    const chunks = chunkText(cleanText);

    if (chunks.length > 0) {
      // 4. Generate Embeddings (Vectorize) menggunakan model lokal (Ollama)
      try {
        const { embeddings } = await embedMany({
          model: ollama.embedding('nomic-embed-text'),
          values: chunks,
        });

        // 5. Store to knowledge_chunks (Vector Database)
        const chunkRecords = chunks.map((chunk, i) => ({
          kb_id: kbData.id,
          content: chunk,
          embedding: embeddings[i],
        }));

        const { error: chunkError } = await supabase
          .from('knowledge_chunks')
          .insert(chunkRecords);

        if (chunkError) {
          console.error('Database chunk insert error:', chunkError);
          return NextResponse.json({ error: 'Failed to save chunks to database' }, { status: 500 });
        }
      } catch (embedError) {
        console.error('Embedding generation error:', embedError);
        return NextResponse.json({ error: 'Failed to generate embeddings. Ensure Ollama and nomic-embed-text model is running.' }, { status: 500 });
      }
    }
    
    return NextResponse.json({ success: true, message: 'Knowledge base updated and vectorized successfully in Supabase' });
  } catch (error) {
    console.error('KB upload error:', error);
    return NextResponse.json({ error: 'Failed to upload knowledge base' }, { status: 500 });
  }
}
