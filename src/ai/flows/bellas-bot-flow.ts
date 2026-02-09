'use server';

/**
 * @fileOverview Bella's Bot - An AI concierge for Bella's Paradise Farm Resort.
 * 
 * This flow uses Genkit to provide helpful information to guests about 
 * accommodations, amenities, and resort policies.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const BellasBotInputSchema = z.object({
  message: z.string().describe('The message from the guest.'),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).optional().describe('Previous conversation history for context.'),
});
export type BellasBotInput = z.infer<typeof BellasBotInputSchema>;

const BellasBotOutputSchema = z.object({
  reply: z.string().describe('The AI concierge\'s helpful response.'),
});
export type BellasBotOutput = z.infer<typeof BellasBotOutputSchema>;

export async function bellasBot(input: BellasBotInput): Promise<BellasBotOutput> {
  return bellasBotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'bellasBotPrompt',
  input: { schema: BellasBotInputSchema },
  output: { schema: BellasBotOutputSchema },
  prompt: `You are Bella's Bot, the friendly and sophisticated AI concierge for Bella's Paradise Farm Resort in Bongabong, Oriental Mindoro, Philippines.

Your goal is to assist guests with their inquiries about the resort in a warm, welcoming, and helpful manner.

Information about Bella's Paradise Farm Resort:
- Location: Balahid, Hagan, Bongabong, Oriental Mindoro.
- Vibe: A "Paradise Farm" where guests can experience nature and freshwater. Relaxing, family-friendly, and sophisticated.
- Accommodations:
  - Kubos (Traditional bamboo huts, including "Kubo sa Ilog")
  - Cabanas (Luxury garden stays)
  - A-House (Modern triangular house for 4 guests)
  - Function Hall (For events and gatherings up to 20 guests)
  - Tents (For outdoor enthusiasts)
  - Rooms (Standard resort rooms)
- Amenities: Beautiful swimming pool (great for kids), freshwater surroundings, farm views, and lush nature.

Guidelines:
1. Always be polite and professional.
2. Use a touch of Filipino hospitality in your tone.
3. If you don't know the answer to a specific question (like current real-time availability for a specific date), suggest they message "Resort Support" to talk to a human staff member.
4. Keep responses relatively concise but thorough enough to be helpful.

Guest Message: {{{message}}}

{{#if history}}
Previous Context:
{{#each history}}
- {{role}}: {{{content}}}
{{/each}}
{{/if}}

Provide your reply in JSON format with a "reply" field.`,
});

const bellasBotFlow = ai.defineFlow(
  {
    name: 'bellasBotFlow',
    inputSchema: BellasBotInputSchema,
    outputSchema: BellasBotOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
