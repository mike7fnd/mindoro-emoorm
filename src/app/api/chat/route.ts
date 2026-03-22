/**
 * POST /api/chat — AI assistant endpoint.
 * Uses Qwen2.5-72B-Instruct via HuggingFace Inference API (free).
 * Works both locally and in deployment — just needs HF_TOKEN env var.
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

    // Fetch relevant context from Supabase
    const context = await getRelevantData(message);

    // Call HuggingFace Inference API
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
