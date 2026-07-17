const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  console.log("AUTH USERS:", users?.map(u => ({ id: u.id, email: u.email })), authError);
}
check();
