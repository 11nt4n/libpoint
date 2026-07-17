const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('point_history').insert({ user_id: '7744f984-d318-4b78-8930-e9307b318ec1', activity: 'Testing points', points: 1 }).select();
  console.log("INSERT RES:", { data, error });
}
check();
