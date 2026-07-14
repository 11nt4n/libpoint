-- 1. Mengaktifkan ekstensi vector untuk vector database
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Membuat tabel knowledge_chunks untuk menyimpan potongan teks (chunks) dan vektor embedding-nya
-- Catatan: Dimensi vector(768) disesuaikan dengan output dimensi dari model `nomic-embed-text` Ollama.
-- Jika Anda menggunakan model OpenAI `text-embedding-3-small`, ubah menjadi `vector(1536)`.
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id SERIAL PRIMARY KEY,
  kb_id INT REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(768)
);

-- 3. Membuat fungsi (RPC) pencarian kemiripan vektor (Semantic Search) menggunakan Cosine Similarity
CREATE OR REPLACE FUNCTION match_chunks (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id int,
  kb_id int,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    knowledge_chunks.id,
    knowledge_chunks.kb_id,
    knowledge_chunks.content,
    1 - (knowledge_chunks.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks
  WHERE 1 - (knowledge_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY knowledge_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
