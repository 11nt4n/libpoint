const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data: user1, error: e1 } = await supabase.from('profiles').select('*').eq('id', 'b8fd7ada-e298-4479-9078-2904be849a94').single();
  console.log("FETCH BY ID:", user1, e1);
  
  const { data: allData, error: allE } = await supabase.from('profiles').select('*');
  console.log("TOTAL PROFILES:", allData?.length);
}
check();
