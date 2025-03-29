
"""
Telegram Bot for Denov Baraka Somsa

This bot integrates with the web application to receive orders
and update order statuses via Telegram.

To run this bot:
1. Install requirements: pip install aiogram
2. Set up the BOT_TOKEN (get from @BotFather)
3. Run this script: python telegram_bot.py
"""

import asyncio
import json
import logging
from aiogram import Bot, Dispatcher, Router, types
from aiogram.filters import Command
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)

# Bot token from @BotFather
BOT_TOKEN = "YOUR_BOT_TOKEN"

# Channel/group ID where orders will be sent
CHANNEL_ID = "YOUR_CHANNEL_ID"

# Main router
router = Router()

# Store orders in memory (in production, use a database)
orders = {}

# Keyboard for order status actions
def get_order_keyboard(order_id):
    keyboard = [
        [
            InlineKeyboardButton(text="✅ Принять", callback_data=f"accept_{order_id}"),
        ],
        [
            InlineKeyboardButton(text="🚚 Доставка", callback_data=f"deliver_{order_id}"),
            InlineKeyboardButton(text="✓ Завершить", callback_data=f"complete_{order_id}")
        ],
        [
            InlineKeyboardButton(text="❌ Отменить", callback_data=f"cancel_{order_id}")
        ]
    ]
    return InlineKeyboardMarkup(inline_keyboard=keyboard)

# Start command handler
@router.message(Command("start"))
async def cmd_start(message: types.Message):
    await message.answer(
        "Привет! Я бот для управления заказами Denov Baraka Somsa. "
        "Используйте команду /help для получения списка доступных команд."
    )

# Help command handler
@router.message(Command("help"))
async def cmd_help(message: types.Message):
    help_text = """
Доступные команды:
/start - Начать работу с ботом
/help - Показать эту справку
/orders - Показать активные заказы

Статусы заказов обновляются через кнопки под сообщениями о заказах.
"""
    await message.answer(help_text)

# Orders command handler
@router.message(Command("orders"))
async def cmd_orders(message: types.Message):
    if not orders:
        await message.answer("Нет активных заказов.")
        return
    
    active_orders = {id: order for id, order in orders.items() 
                     if order["status"] not in ["completed", "cancelled"]}
    
    if not active_orders:
        await message.answer("Нет активных заказов.")
        return
    
    for order_id, order in active_orders.items():
        order_text = f"""
Заказ #{order_id}
Статус: {get_status_text(order["status"])}
Клиент: {order["customer"]["name"]}
Телефон: {order["customer"]["phone"]}
Адрес: {order["customer"]["address"]}
Сумма: {order["total"]} сум
"""
        await message.answer(order_text, reply_markup=get_order_keyboard(order_id))

# Helper function to get status text
def get_status_text(status):
    status_map = {
        "processing": "В обработке",
        "delivering": "Доставляется",
        "completed": "Доставлено",
        "cancelled": "Отменен"
    }
    return status_map.get(status, status)

# Callback query handler for order actions
@router.callback_query()
async def order_actions(callback: types.CallbackQuery):
    data = callback.data
    
    # Parse action and order_id from callback data
    if "_" in data:
        action, order_id = data.split("_", 1)
        
        if order_id not in orders:
            await callback.answer("Заказ не найден.")
            return
        
        order = orders[order_id]
        
        if action == "accept":
            order["status"] = "processing"
            status_text = "принят в обработку"
        elif action == "deliver":
            order["status"] = "delivering"
            status_text = "передан в доставку"
        elif action == "complete":
            order["status"] = "completed"
            status_text = "доставлен"
        elif action == "cancel":
            order["status"] = "cancelled"
            status_text = "отменен"
        else:
            await callback.answer("Неизвестное действие.")
            return
        
        # Update order status
        orders[order_id] = order
        
        # Update message with new keyboard
        order_text = f"""
Заказ #{order_id}
Статус: {get_status_text(order["status"])}
Клиент: {order["customer"]["name"]}
Телефон: {order["customer"]["phone"]}
Адрес: {order["customer"]["address"]}
Сумма: {order["total"]} сум
"""
        await callback.message.edit_text(order_text, reply_markup=get_order_keyboard(order_id))
        await callback.answer(f"Заказ #{order_id} {status_text}")

# Webhook handler for receiving orders from the website
@router.message()
async def handle_webhook_data(message: types.Message):
    # Only process messages with JSON data
    if message.from_user.is_bot or not message.text.startswith("{"):
        return
    
    try:
        # Parse the order data from JSON
        order_data = json.loads(message.text)
        
        # Validate order data
        if not isinstance(order_data, dict) or "id" not in order_data:
            return
        
        order_id = order_data["id"][-5:]  # Last 5 digits
        
        # Store the order
        orders[order_id] = order_data
        
        # Format items text
        items_text = "\n".join([
            f"- {item['name']} x {item['quantity']} = {item['price'] * item['quantity']} сум"
            for item in order_data["items"]
        ])
        
        # Calculate delivery
        delivery_text = "Бесплатно" if order_data.get("freeDelivery") else "15,000 сум"
        total_with_delivery = order_data["total"]
        if not order_data.get("freeDelivery"):
            total_with_delivery += 15000
        
        # Format order message
        order_text = f"""
🆕 Новый заказ #{order_id}!

👤 Клиент: {order_data["customer"]["name"]}
📞 Телефон: {order_data["customer"]["phone"]}
🏠 Адрес: {order_data["customer"]["address"]}

🛒 Товары:
{items_text}

💰 Сумма товаров: {order_data["total"]} сум
🚚 Доставка: {delivery_text}
💵 Итого: {total_with_delivery} сум
"""
        # Send to channel/group
        if CHANNEL_ID:
            await bot.send_message(
                CHANNEL_ID,
                order_text,
                reply_markup=get_order_keyboard(order_id)
            )
        
        # Reply to the webhook
        await message.answer(f"Заказ #{order_id} принят.")
    
    except json.JSONDecodeError:
        # Not JSON data, ignore
        pass
    except Exception as e:
        logging.error(f"Error processing order: {e}")

async def main():
    # Initialize Bot instance with a default parse mode
    bot = Bot(token=BOT_TOKEN)
    
    # Create a dispatcher
    dp = Dispatcher()
    
    # Register router
    dp.include_router(router)
    
    # Skip pending updates and start polling
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)

if __name__ == "__main__":
    logging.info("Starting bot...")
    asyncio.run(main())
