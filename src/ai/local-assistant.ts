/**
 * Local AI Assistant Module
 * Uses google/gemma-3-270m-it via @xenova/transformers for CPU-based inference.
 * No external API calls, no paid services.
 */

import { pipeline, type TextGenerationPipeline } from '@xenova/transformers';

const MODEL_ID = 'google/gemma-3-270m-it';

// ── Singleton: load model once, reuse across requests ──────────────────────
let generatorInstance: TextGenerationPipeline | null = null;
let loadingPromise: Promise<TextGenerationPipeline> | null = null;

async function getGenerator(): Promise<TextGenerationPipeline> {
  if (generatorInstance) return generatorInstance;
  if (loadingPromise) return loadingPromise;

  loadingPromise = pipeline('text-generation', MODEL_ID, {
    dtype: 'q4',            // 4-bit quantized for CPU performance
  }).then((gen) => {
    generatorInstance = gen;
    loadingPromise = null;
    console.log(`[local-assistant] Model "${MODEL_ID}" loaded.`);
    return gen;
  });

  return loadingPromise;
}

// ── Preload (call at server start to warm up) ──────────────────────────────
export async function preloadModel(): Promise<void> {
  await getGenerator();
}

// ── Context placeholder — wire to your DB ──────────────────────────────────
/**
 * Fetch relevant product/FAQ/order data for the user's message.
 * Replace the body with your actual database query logic.
 */
export async function getRelevantData(message: string): Promise<string> {
  // TODO: implement real DB lookup (products, FAQs, orders, etc.)
  return [
    'Product: Dried Mangoes — ₱120/pack, in stock.',
    'Shipping: Free delivery within Oriental Mindoro for orders over ₱500.',
    'Returns: Items may be returned within 7 days if unopened.',
    'Payment: We accept COD and GCash.',
  ].join('\n');
}

// ── Core function ──────────────────────────────────────────────────────────
export async function askAssistant(
  message: string,
  context: string,
): Promise<string> {
  const generator = await getGenerator();

  const prompt = buildPrompt(message, context);

  const outputs = await generator(prompt, {
    max_new_tokens: 128,
    temperature: 0.3,
    do_sample: true,
    repetition_penalty: 1.2,
  });

  const raw: string =
    Array.isArray(outputs) && outputs.length > 0
      ? (outputs[0] as { generated_text: string }).generated_text
      : '';

  return extractReply(raw, prompt);
}

// ── Prompt builder ─────────────────────────────────────────────────────────
function buildPrompt(message: string, context: string): string {
  return `<start_of_turn>user
You are a helpful eCommerce customer support assistant for E-Moorm marketplace.
Answer ONLY using the context below. If the answer is not in the context, say exactly: "Sorry, I don't have that information."
Keep your answer to 2–3 sentences maximum.

Context:
${context}

Customer question: ${message}<end_of_turn>
<start_of_turn>model
`;
}

// ── Extract model reply, strip prompt echo ─────────────────────────────────
function extractReply(raw: string, prompt: string): string {
  let reply = raw;

  // Remove the prompt echo if the model returns it
  if (reply.startsWith(prompt)) {
    reply = reply.slice(prompt.length);
  }

  // Strip Gemma turn markers
  reply = reply.replace(/<end_of_turn>/g, '').replace(/<start_of_turn>/g, '').trim();

  // Fallback if empty
  if (!reply) {
    return "Sorry, I don't have that information.";
  }

  return reply;
}
