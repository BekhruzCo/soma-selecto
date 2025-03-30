
import { Order } from "@/hooks/use-cart";

/**
 * Send order notification to a Telegram channel/chat
 */
export async function sendTelegramNotification(order: Order) {
  try {
    // Replace these with your actual bot token and chat ID
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

    // Send message via Telegram API
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
    
    const responseData = await response.json();
    
    if (!response.ok) {
      console.error("Telegram API error:", responseData);
      throw new Error(`Telegram API error: ${response.status} - ${JSON.stringify(responseData)}`);
    }
    
    console.log("Successfully sent notification to Telegram");
    return responseData;
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    // Don't throw the error, just log it to prevent app crashes
    return { ok: false, error: String(error) };
  }
}

/**
 * This function updates the order status via Telegram bot
 */
export async function updateOrderStatusViaTelegram(orderId: string, status: string) {
  try {
    // Replace with your actual bot token and chat ID
    const botToken = "8157470158:AAFePV804kLO3eqMM4yuJ9UDPYXg92MszM0";
    const chatId = "955988843";
    
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
    
    const responseData = await response.json();
    
    if (!response.ok) {
      console.error("Telegram API error:", responseData);
      throw new Error(`Telegram API error: ${response.status} - ${JSON.stringify(responseData)}`);
    }
    
    console.log("Successfully sent status update to Telegram");
    return responseData;
  } catch (error) {
    console.error('Error sending Telegram status update:', error);
    // Don't throw the error, just log it to prevent app crashes
    return { ok: false, error: String(error) };
  }
}

/**
 * This function sends product updates to Telegram
 */
export async function sendProductUpdateToTelegram(action: 'add' | 'edit' | 'delete', product: { id: string, name: string, price: number }) {
  try {
    // Replace with your actual bot token and chat ID
    const botToken = "8157470158:AAFePV804kLO3eqMM4yuJ9UDPYXg92MszM0";
    const chatId = "955988843";
    
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const actionMessages = {
      "add": "добавлен",
      "edit": "изменен",
      "delete": "удален"
    };
    
    const message = `🔄 Товар #${product.id} ${actionMessages[action]}: ${product.name} (${product.price.toLocaleString()} сум)`;
    
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
    
    const responseData = await response.json();
    
    if (!response.ok) {
      console.error("Telegram API error:", responseData);
      throw new Error(`Telegram API error: ${response.status}`);
    }
    
    console.log("Successfully sent product update to Telegram");
    return responseData;
  } catch (error) {
    console.error('Error sending product update to Telegram:', error);
    // Don't throw the error, just log it to prevent app crashes
    return { ok: false, error: String(error) };
  }
}
