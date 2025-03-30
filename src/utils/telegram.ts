
import { Order } from "@/hooks/use-cart";

/**
 * Send order notification to a Telegram channel/chat
 */
export async function sendTelegramNotification(order: Order) {
  // You should replace these with your actual bot token and chat ID
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

  try {
    // Only attempt to send if we have proper credentials
    if (botToken !== "8157470158:AAFePV804kLO3eqMM4yuJ9UDPYXg92MszM0" && chatId !== "955988843") {
      const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      
      const response = await fetch(telegramApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.status}`);
      }
      
      console.log("Successfully sent notification to Telegram");
      return await response.json();
    } else {
      console.log("Would send to Telegram (simulation):", message);
      return { ok: true, simulated: true };
    }
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    throw error;
  }
}

/**
 * This function updates the order status via Telegram bot
 * In a real implementation, this would communicate with your bot's API
 */
export async function updateOrderStatusViaTelegram(orderId: string, status: string) {
  // You should replace these with your actual bot token and chat ID
  const botToken = "YOUR_BOT_TOKEN";
  const chatId = "YOUR_CHAT_ID";
  
  try {
    // Only attempt to send if we have proper credentials
    if (botToken !== "YOUR_BOT_TOKEN" && chatId !== "YOUR_CHAT_ID") {
      const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      
      const statusMessages = {
        "processing": "принят в обработку",
        "delivering": "передан в доставку",
        "completed": "доставлен",
        "cancelled": "отменен"
      };
      
      const message = `Статус заказа #${orderId.slice(-5)} изменен: ${statusMessages[status as keyof typeof statusMessages]}`;
      
      const response = await fetch(telegramApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.status}`);
      }
      
      console.log("Successfully sent status update to Telegram");
      return await response.json();
    } else {
      console.log(`Would send to Telegram: Status update for order #${orderId} - ${status}`);
      return { ok: true, simulated: true };
    }
  } catch (error) {
    console.error('Error sending Telegram status update:', error);
    throw error;
  }
}
