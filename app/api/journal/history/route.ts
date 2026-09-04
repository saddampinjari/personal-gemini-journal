import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken, getUserInteractions } from '@/lib/firebase/admin';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const user = await verifyAuthToken(authHeader);

    const items = await getUserInteractions(user.uid);

    return NextResponse.json({
      success: true,
      userId: user.uid,
      count: items.length,
      items,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch history';
    return NextResponse.json(
      { error: message, items: [] },
      { status: 500 }
    );
  }
}
