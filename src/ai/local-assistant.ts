// 🌟 AI Assistant Module – Super Friendly Version 🌟
// Uses HuggingFace Inference API (free tier)
// Make sure HF_TOKEN is set in .env.local

import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from '@/supabase/config';

// Primary and fallback models — fallback is smaller and always available
const MODELS = [
  'Qwen/Qwen2.5-72B-Instruct',
  'mistralai/Mistral-7B-Instruct-v0.3',
];
const HF_API_URL = 'https://router.huggingface.co/v1/chat/completions';

// ── Supabase server client (singleton, super reliable, po) ────────────────
function getServerSupabase() {
  return createClient(supabaseConfig.url, supabaseConfig.anonKey);
}

// ── Context: gently pull the most relevant data from Supabase, po ─────────
export async function getRelevantData(message: string): Promise<string> {
  const sb = getServerSupabase();
  const lines: string[] = [];

  // Always include friendly marketplace FAQ context, po
  lines.push(
    'E-Moorm is a warm and hyperlocal digital marketplace in Oriental Mindoro, Philippines, po.',
    'Payment methods: Cash on Delivery (COD) and GCash, po.',
    'Free delivery within Oriental Mindoro for orders over ₱500, po!',
    'Returns: Items may be returned within 7 days if unopened, po.',
    'Categories: Vegetables, Fruits, Seafood, Meat, Snacks, Rice & Grains, Beverages, Condiments, po.',
    'For order issues, please kindly reach out to Customer Support through the Messages tab, po.'
  );

  try {
    const keywords = message
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 2)
      .slice(0, 3);

    if (keywords.length > 0) {
      const searchTerm = `%${keywords.join('%')}%`;
      const { data: products } = await sb
        .from('facilities')
        .select('name, category, price, stock, description, status, sold')
        .or(keywords.map(k => `name.ilike.%${k}%,description.ilike.%${k}%,category.ilike.%${k}%`).join(','))
        .limit(5);

      if (products && products.length > 0) {
        lines.push('\n✨ Smartly recommended products just for you, po:');
        for (const p of products) {
          const inStock = (p.stock ?? 0) > 0 ? 'In stock' : 'Out of stock';
          lines.push(`- ${p.name} (${p.category}) — ₱${p.price} — ${inStock}${p.description ? '. ' + p.description.slice(0, 80) : ''}`);
        }
      }

      const { data: stores } = await sb
        .from('stores')
        .select('name, description, city, category')
        .or(keywords.map(k => `name.ilike.%${k}%,description.ilike.%${k}%,category.ilike.%${k}%`).join(','))
        .limit(3);

      if (stores && stores.length > 0) {
        lines.push('\n🏪 Friendly stores that might interest you, po:');
        for (const s of stores) {
          lines.push(`- ${s.name} in ${s.city} (${s.category})${s.description ? ': ' + s.description.slice(0, 60) : ''}`);
        }
      }
    }
  } catch (err) {
    console.error('[getRelevantData] Oops, DB error, po:', err);
  }

  return lines.join('\n');
}

// ── Core function: ask our super smart and kind assistant, po ──────────────
export async function askAssistant(
  message: string,
  context: string,
  language: string = 'english'
): Promise<string> {
  const token = process.env.HF_TOKEN;
  if (!token) {
    console.error('[ai-assistant] HF_TOKEN env var is not set');
    return language === 'tagalog'
      ? "Pasensya na po, may problema ako ngayon. Subukan ulit mamaya po!"
      : "Sorry po, I'm having a little trouble right now. Please try again later!";
  }

  const langInstruction = language === 'tagalog'
    ? 'IMPORTANT: You MUST respond entirely in Tagalog/Filipino. Use natural conversational Tagalog. Keep the warm and friendly tone.'
    : 'Respond in English.';

  const systemPrompt = `You are Moormy Bot, a friendly, warm, and super smart shopping assistant for E-Moorm, a local eCommerce marketplace in Oriental Mindoro, Philippines.
Answer ONLY using the context below. If the answer is not in the context, politely say you don't have that information and suggest contacting Customer Support.
Keep your answer warm, helpful, and clear. Maximum 10 sentences.
Do NOT use asterisks (*) anywhere in your answer.
${langInstruction}

Context:
${context}`;

  // Try each model until one works
  for (const model of MODELS) {
    try {
      const res = await fetch(HF_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          max_tokens: 512,
          temperature: 0.3
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[ai-assistant] ${model} returned ${res.status}:`, errText);
        continue; // try next model
      }

      const data = await res.json();
      let reply = data?.choices?.[0]?.message?.content?.trim();

      if (!reply) {
        console.error(`[ai-assistant] Empty response from ${model}:`, JSON.stringify(data));
        continue; // try next model
      }

      // Remove all asterisks to ensure plain text
      reply = reply.replace(/\*/g, '');
      return reply;
    } catch (err) {
      console.error(`[ai-assistant] ${model} request failed:`, err);
      continue; // try next model
    }
  }

  // All models failed
  return language === 'tagalog'
    ? "Pasensya na po, may problema ako ngayon. Subukan ulit mamaya po!"
    : "Sorry po, I'm having a little trouble right now. Please try again later!";
}
