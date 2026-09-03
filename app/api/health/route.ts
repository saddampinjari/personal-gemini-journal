import { NextResponse } from 'next/server';
import { getGeminiApiKey } from '@/lib/secrets/secret-manager';

export async function GET() {
  try {
    let secretStatus = 'uninitialized';
    try {
      const secret = await getGeminiApiKey();
      secretStatus = secret.source;
    } catch {
      secretStatus = 'missing-key';
    }

    return NextResponse.json({
      status: 'healthy',
      service: 'personal-gemini-journal',
      runtime: 'Google Cloud Run',
      challengeLabel: 'dev-tutorial=cloud-run-ai-challenge',
      timestamp: new Date().toISOString(),
      secretManagement: secretStatus,
      ladderSteps: ['gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.7-flash'],
    });
  } catch (err) {
    return NextResponse.json(
      { status: 'unhealthy', error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
