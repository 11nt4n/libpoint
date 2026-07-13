import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();
    const kbPath = path.join(process.cwd(), '.knowledge.txt');
    
    await fs.writeFile(kbPath, text, 'utf-8');
    
    return NextResponse.json({ success: true, message: 'Knowledge base updated' });
  } catch (error) {
    console.error('KB upload error:', error);
    return NextResponse.json({ error: 'Failed to upload knowledge base' }, { status: 500 });
  }
}
