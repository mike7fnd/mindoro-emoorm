// Utility to send an automated message to the seller when an order is placed
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface SendOrderAutoMessageParams {
  buyerId: string;
  sellerId: string;
  storeName: string;
  orderId: string;
}

export async function sendOrderAutoMessage({ buyerId, sellerId, storeName, orderId }: SendOrderAutoMessageParams) {
  if (!buyerId || !sellerId || !storeName || !orderId) return;
  // Find or create conversation between buyer and seller
  let { data: conversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('userId', buyerId)
    .eq('id', sellerId)
    .single();

  if (!conversation) {
    // Create conversation if not exists
    const { data: newConv } = await supabase
      .from('conversations')
      .insert({ id: sellerId, userId: buyerId, name: storeName })
      .select()
      .single();
    conversation = newConv;
  }

  // Send message
  await supabase.from('messages').insert({
    conversationId: sellerId,
    senderId: buyerId,
    recipientId: sellerId,
    content: `Hi! I just placed an order (Order ID: ${orderId}) at ${storeName}. Looking forward to your confirmation!`,
    createdAt: new Date().toISOString(),
  });
}
