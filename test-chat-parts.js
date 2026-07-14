fetch('http://127.0.0.1:3000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    messages: [{ 
      role: 'user', 
      parts: [{ type: 'text', text: 'apa itu machine learning' }] 
    }] 
  })
}).then(async (r) => {
  console.log("Status:", r.status);
  console.log("Body:", await r.text());
}).catch(console.error);
