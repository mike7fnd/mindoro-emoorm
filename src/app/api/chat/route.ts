/**
 * POST /api/chat — AI assistant endpoint.
 * Uses Qwen2.5-72B-Instruct via HuggingFace Inference API (free).
 * Works both locally and in deployment — just needs HF_TOKEN env var.
 */

import { NextRequest, NextResponse } from 'next/server';
import { askAssistant, getRelevantData } from '@/ai/local-assistant';

export async function POST(req: NextRequest) {
  try {
    let message = '';
    let language = 'english';

    try {
      const body = await req.json();
      message = body.message || '';
      language = body.language || 'english';
    } catch {
      return NextResponse.json({ reply: "Sorry, I couldn't understand that request." });
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ reply: "Please type a message to get started!" });
    }

    // Fetch relevant context from Supabase
    let context = '';
    try {
      context = await getRelevantData(message);
    } catch (e) {
      console.error('[api/chat] getRelevantData failed:', e);
      // Continue without context rather than failing
    }

    // Call HuggingFace Inference API
    const reply = await askAssistant(message, context, language);

    return NextResponse.json({ reply });
  } catch (err: unknown) {
    console.error('[api/chat] Unexpected error:', err);
    // Always return 200 with a reply so the frontend shows it in chat
    return NextResponse.json({
      reply: "Sorry, I'm experiencing a temporary issue. Please try again in a moment!"
    });
  }
}
