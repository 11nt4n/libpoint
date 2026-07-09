const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://epsnpydqkutcizrdkdpp.supabase.co';
const supabaseKey = 'sb_publishable_wWehFIiB9yMzNJ_15CZVPQ_44-8UbK4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
  console.log('Mencoba mendaftarkan admin...');
  // We can't signup the same email again if it succeeded, but let's try
  // If the auth succeeded but profile insert failed, the user exists in auth.users
  // Let's just try to insert the profile directly using the ID we got from the logs: 670e2a1e-d975-41ba-8832-33bc777346dc
  
  const { error: insertError } = await supabase.from('profiles').insert([
    {
      id: '670e2a1e-d975-41ba-8832-33bc777346dc',
      user_id: 'admin',
      nama_lengkap: 'Administrator',
      email: 'admin@libpoint.com',
      npm: 'admin',
      role: 'admin'
    }
  ]);

  if (insertError) {
    console.error('Gagal insert profile admin:', insertError.message);
  } else {
    console.log('Berhasil insert profile admin!');
  }
}

createAdmin();
