
import { Order } from "@/hooks/use-cart";

/**
 * Send order notification to a Telegram channel/chat
 * In production, you should replace the botToken and chatId with actual values
 */
export async function sendTelegramNotification(order: Order) {
  // You would need to replace these values with your actual bot token and chat ID
  const botToken = "8157470158:AAFePV804kLO3eqMM4yuJ9UDPYXg92MszM0";
  const chatId = "955988843";
  
  // Format message
  const items = order.items.map(item => 
    `${item.name} x ${item.quantity} = ${(item.price * item.quantity).toLocaleString()} сум`
  ).join('\n');
  
  const deliveryCost = order.freeDelivery ? 0 : 15000;
  const totalWithDelivery = order.total + (order.freeDelivery ? 0 : deliveryCost);
  
  const message = `
🆕 Новый заказ #${order.id.slice(-5)}!

👤 Клиент: ${order.customer.name}
📞 Телефон: ${order.customer.phone}
🏠 Адрес: ${order.customer.address}

🛒 Товары:
${items}

💰 Сумма товаров: ${order.total.toLocaleString()} сум
🚚 Доставка: ${order.freeDelivery ? 'Бесплатно' : '15,000 сум'}
💵 Итого: ${totalWithDelivery.toLocaleString()} сум
`;

  // For demonstration purposes, we'll log it
  console.log("Would send to Telegram:", message);
  
  // Now let's actually try to send it if the token is provided
  if (botToken !== "8157470158:AAFePV804kLO3eqMM4yuJ9UDPYXg92MszM0" && chatId !== "955988843") {
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    try {
      const response = await fetch(telegramApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error sending Telegram notification:', error);
      throw error;
    }
  }
  
  return { ok: true, simulated: true };
}
