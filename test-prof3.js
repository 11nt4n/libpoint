const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data: allData, error: allE } = await supabase.from('profiles').select('*');
  console.log("TOTAL PROFILES:", allData);
}
check();
