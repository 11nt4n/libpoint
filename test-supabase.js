require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('knowledge_chunks').select('id, content').limit(3);
  if (error) console.error("Error reading chunks:", error);
  else console.log("Chunks found:", data?.length);
}
test();
