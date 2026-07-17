const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://epsnpydqkutcizrdkdpp.supabase.co';
const supabaseKey = 'sb_publishable_wWehFIiB9yMzNJ_15CZVPQ_44-8UbK4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  const payload = {
    id: 'f9d3b2a1-e4f5-4c6b-9078-2904be849a94', // Fake UUID
    email: 'test_trigger@example.com',
    role: 'user',
    total_points: 0,
    npm: '2322101955',
    nama_lengkap: 'Nala Nur Hidayatur Rohma',
    nama_panggilan: 'Nala',
    program_studi: 'Rekayasa Kriptografi',
    user_id: '2322101955'
  };
  
  const { data, error } = await supabase.from('profiles').insert([payload]);
  if (error) {
    console.error("Insert Error:", error);
  } else {
    console.log("Insert Success:", data);
  }
}
testInsert();
