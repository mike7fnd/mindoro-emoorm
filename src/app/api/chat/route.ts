/**
 * POST /api/chat — Local AI assistant endpoint.
 * Uses the gemma-3-270m-it model running locally via @xenova/transformers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { askAssistant, getRelevantData } from '@/ai/local-assistant';

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "message" field.' },
        { status: 400 },
      );
    }

    // Fetch context from your database (replace placeholder as needed)
    const context = await getRelevantData(message);

    // Run local inference
    const reply = await askAssistant(message, context);

    return NextResponse.json({ reply });
  } catch (err: unknown) {
    console.error('[api/chat] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 },
    );
  }
}
