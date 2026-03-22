// 🌟 AI Assistant Module – Super Friendly Version 🌟
// Uses Qwen2.5-72B-Instruct via HuggingFace Inference API (free tier, po)
// Make sure HF_TOKEN is set in .env.local, po

import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from '@/supabase/config';

const MODEL_ID = 'Qwen/Qwen2.5-72B-Instruct';
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
  context: string
): Promise<string> {
  const token = process.env.HF_TOKEN;
  if (!token) {
    console.error('[ai-assistant] HF_TOKEN is missing, po.');
    return "Sorry po, I'm having a little trouble right now. Please try again later, po!";
  }

  const systemPrompt = `You are E-Moorm Bot, a friendly, warm, and super smart shopping assistant for E-Moorm, a local eCommerce marketplace in Oriental Mindoro, Philippines, po.
Answer ONLY using the context below, po. If the answer is not in the context, politely say: "Sorry po, I don't have that information. You can message Customer Support for more help, po."
Keep your answer warm, helpful, and clear in 10-20 sentences, po.
Do NOT use asterisks (*) anywhere in your answer.

Context:
${context}`;

  try {
    const res = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL_ID,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 1000,
        temperature: 0.3
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[ai-assistant] HF API error ${res.status}, po:`, errText);
      return "Sorry po, I'm having a tiny hiccup right now. It's all on me, po. Please try again later, po!";
    }

    const data = await res.json();
    let reply = data?.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      console.error('[ai-assistant] Empty response from model, po:', JSON.stringify(data));
      return "Sorry po, I don't have that information. You can message Customer Support for more help, po!";
    }

    // Remove all asterisks to ensure plain text
    reply = reply.replace(/\*/g, '');

    return reply;
  } catch (err) {
    console.error('[ai-assistant] Request failed, po:', err);
    return "Sorry po, something went wrong. Please try again later, po!";
  }
}
