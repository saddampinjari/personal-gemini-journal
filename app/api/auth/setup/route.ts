import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId } = body;

    if (!apiKey || !projectId) {
      return NextResponse.json(
        { error: 'API Key and Project ID are required.' },
        { status: 400 }
      );
    }

    const envPath = path.join(process.cwd(), '.env.local');
    const existingContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

    const lines = [
      `NEXT_PUBLIC_FIREBASE_API_KEY="${apiKey.trim()}"`,
      `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="${(authDomain || `${projectId.trim()}.firebaseapp.com`).trim()}"`,
      `NEXT_PUBLIC_FIREBASE_PROJECT_ID="${projectId.trim()}"`,
      `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="${(storageBucket || `${projectId.trim()}.appspot.com`).trim()}"`,
      `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="${(messagingSenderId || '1234567890').trim()}"`,
      `NEXT_PUBLIC_FIREBASE_APP_ID="${(appId || '1:1234567890:web:abcdef').trim()}"`,
      `GOOGLE_CLOUD_PROJECT="${projectId.trim()}"`,
    ];

    // Preserve any existing GEMINI_API_KEY
    const geminiMatch = existingContent.match(/GEMINI_API_KEY="?([^"\n\r]+)"?/);
    if (geminiMatch && geminiMatch[1]) {
      lines.unshift(`GEMINI_API_KEY="${geminiMatch[1]}"`);
    }

    fs.writeFileSync(envPath, lines.join('\n') + '\n', 'utf8');

    return NextResponse.json({
      success: true,
      message: 'Firebase configuration saved successfully to .env.local. Dev server will use these credentials.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save configuration';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
