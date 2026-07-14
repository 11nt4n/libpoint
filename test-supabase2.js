const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf-8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && val.length) acc[key.trim()] = val.join('=').trim();
  return acc;
}, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  // Test if knowledge_bases has data
  const { data: kb, error: err1 } = await supabase.from('knowledge_bases').select('id, filename');
  console.log("KBs:", kb);
  
  // Test if chunks exist
  const { data: chunks, error: err2 } = await supabase.from('knowledge_chunks').select('id').limit(1);
  console.log("Chunks exist?", chunks?.length > 0);

  // Test match_chunks RPC directly
  const dummyEmbedding = Array(768).fill(0.1);
  const { data: match, error: err3 } = await supabase.rpc('match_chunks', {
    query_embedding: dummyEmbedding,
    match_threshold: 0.1,
    match_count: 5
  });
  console.log("Match error:", err3);
  console.log("Matches found:", match?.length);
}
test();
