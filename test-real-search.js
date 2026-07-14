const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf-8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && val.length) acc[key.trim()] = val.join('=').trim();
  return acc;
}, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const res = await fetch('http://127.0.0.1:11434/api/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'nomic-embed-text',
      prompt: 'apa itu machine learning'
    })
  });
  
  const { embedding } = await res.json();
  
  if (!embedding) {
    console.error("Failed to get embedding");
    return;
  }
  
  const { data: match, error: err3 } = await supabase.rpc('match_chunks', {
    query_embedding: embedding,
    match_threshold: 0.3,
    match_count: 5
  });
  console.log("Match error:", err3);
  console.log("Matches found:", match?.length);
  if (match?.length > 0) {
    console.log("First match content:", match[0].content.substring(0, 100));
    console.log("Similarity:", match[0].similarity);
  }
}
test();
