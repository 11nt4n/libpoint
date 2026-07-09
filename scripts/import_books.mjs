import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import readline from 'readline';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrl = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
const supabaseKey = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
const supabase = createClient(supabaseUrl, supabaseKey);

// Basic CSV parser for "val1","val2" format
function parseCsvLine(text) {
  const re = /(?:"([^"]*)")|([^,]+)/g;
  const result = [];
  let match;
  while ((match = re.exec(text)) !== null) {
    if (match[1] !== undefined) {
      result.push(match[1]); // Quoted value
    } else if (match[2] !== undefined) {
      result.push(match[2]); // Unquoted value
    }
    // Advance past comma if it exists after the match
    if (re.lastIndex < text.length && text[re.lastIndex] === ',') {
      re.lastIndex++;
    }
  }
  return result;
}

async function importData() {
  const fileStream = fs.createReadStream('senayan_item_export.csv');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let headers = [];
  let isFirstLine = true;
  let batch = [];
  let totalImported = 0;

  console.log('Mulai membaca file CSV...');

  for await (const line of rl) {
    if (!line.trim()) continue;

    const row = parseCsvLine(line);
    
    if (isFirstLine) {
      headers = row;
      isFirstLine = false;
      continue;
    }

    const record = {};
    headers.forEach((header, index) => {
      if (header) {
        record[header] = row[index] || '';
      }
    });

    // Only map the 6 fields we need
    if (record.item_code && record.title) {
      batch.push({
        item_code: record.item_code,
        title: record.title,
        item_status_name: record.item_status_name || 'Available',
        call_number: record.call_number || '',
        coll_type_name: record.coll_type_name || 'Book',
        location_name: record.location_name || '',
      });
    }

    if (batch.length >= 500) {
      console.log(`Mengirim batch ${batch.length} baris...`);
      const { error } = await supabase.from('books').upsert(batch, { onConflict: 'item_code', ignoreDuplicates: true });
      if (error) {
        console.error('Error saat insert batch:', error.message);
      } else {
        totalImported += batch.length;
        console.log(`Berhasil import ${totalImported} data buku.`);
      }
      batch = [];
    }
  }

  // Insert remaining
  if (batch.length > 0) {
    console.log(`Mengirim batch terakhir ${batch.length} baris...`);
    const { error } = await supabase.from('books').upsert(batch, { onConflict: 'item_code', ignoreDuplicates: true });
    if (error) {
      console.error('Error saat insert batch terakhir:', error.message);
    } else {
      totalImported += batch.length;
      console.log(`Berhasil import ${totalImported} data buku.`);
    }
  }

  console.log('Selesai!');
}

importData().catch(console.error);
