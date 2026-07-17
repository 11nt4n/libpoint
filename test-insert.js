const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('profiles').insert([
    {
      id: 'd8fd7ada-e298-4479-9078-2904be849a95', // fake uuid
      user_id: 'test',
      nama_lengkap: 'Test',
      npm: 'test',
      email: 'test@test.com',
      role: 'user',
      total_points: 0
    }
  ]);
  console.log("INSERT PROFILES RES:", data, error);
}
check();
