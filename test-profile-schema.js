const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://epsnpydqkutcizrdkdpp.supabase.co';
const supabaseKey = 'sb_publishable_wWehFIiB9yMzNJ_15CZVPQ_44-8UbK4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  if (error) {
    console.error("Error:", error);
  } else {
    if (data.length > 0) {
      for (const key of Object.keys(data[0])) {
        console.log(`${key}: ${typeof data[0][key]} - ${data[0][key]}`);
      }
    }
  }
}
check();
