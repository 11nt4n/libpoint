const fs = require('fs');
fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/?apikey=' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  .then(res => res.json())
  .then(data => {
    fs.writeFileSync('schema.json', JSON.stringify(data, null, 2));
    console.log("Wrote schema to schema.json");
  });
