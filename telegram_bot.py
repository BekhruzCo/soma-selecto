
"""
Telegram Bot for Denov Baraka Somsa

This bot integrates with the web application to receive orders
and update order statuses via Telegram.

To run this bot:
1. Install requirements: pip install aiogram python-dotenv
2. Create a .env file with BOT_TOKEN and CHANNEL_ID
3. Run this script: python telegram_bot.py
"""

import asyncio
import json
import logging
from datetime import datetime
import os
from dotenv import load_dotenv
from aiogram import Bot, Dispatcher, Router, types
from aiogram.filters import Command
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)

# Bot token from @BotFather
BOT_TOKEN = os.getenv("BOT_TOKEN", "YOUR_BOT_TOKEN")

# Channel/group ID where orders will be sent
CHANNEL_ID = os.getenv("CHANNEL_ID", "YOUR_CHANNEL_ID")

# Admin IDs who can access admin commands
ADMIN_IDS = [int(id) for id in os.getenv("ADMIN_IDS", "").split(",") if id]

# Main router
router = Router()

# States for adding products
class ProductStates(StatesGroup):
    waiting_for_name = State()
    waiting_for_description = State()
    waiting_for_price = State()
    waiting_for_category = State()
    waiting_for_image = State()

# Store orders in memory (in production, use a database)
orders = {}

# In-memory product storage (in production, use a database)
products = []

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

# Keyboard for admin actions
def get_admin_keyboard():
    keyboard = [
        [
            InlineKeyboardButton(text="📊 Заказы", callback_data="admin_orders"),
            InlineKeyboardButton(text="🛒 Товары", callback_data="admin_products")
        ],
        [
            InlineKeyboardButton(text="➕ Добавить товар", callback_data="add_product"),
            InlineKeyboardButton(text="📈 Статистика", callback_data="admin_stats")
        ]
    ]
    return InlineKeyboardMarkup(inline_keyboard=keyboard)

# Start command handler
@router.message(Command("start"))
async def cmd_start(message: types.Message):
    if message.from_user.id in ADMIN_IDS:
        await message.answer(
            "Привет, администратор! Я бот для управления заказами Denov Baraka Somsa. "
            "Используйте команду /admin для доступа к панели администратора.",
            reply_markup=get_admin_keyboard()
        )
    else:
        await message.answer(
            "Привет! Я бот Denov Baraka Somsa. "
            "Вы можете оформить заказ на нашем сайте и отслеживать его статус здесь."
        )

# Admin command handler
@router.message(Command("admin"))
async def cmd_admin(message: types.Message):
    if message.from_user.id in ADMIN_IDS:
        await message.answer(
            "Панель администратора Denov Baraka Somsa",
            reply_markup=get_admin_keyboard()
        )
    else:
        await message.answer("У вас нет доступа к панели администратора.")

# Help command handler
@router.message(Command("help"))
async def cmd_help(message: types.Message):
    if message.from_user.id in ADMIN_IDS:
        help_text = """
Доступные команды для администратора:
/start - Начать работу с ботом
/admin - Открыть панель администратора
/help - Показать эту справку
/orders - Показать активные заказы
/products - Показать список товаров
/stats - Показать статистику заказов

Вы также можете управлять заказами и товарами через панель администратора.
"""
    else:
        help_text = """
Доступные команды:
/start - Начать работу с ботом
/help - Показать эту справку
/status [номер заказа] - Проверить статус заказа

Оформить заказ можно на нашем сайте.
"""
    await message.answer(help_text)

# Orders command handler
@router.message(Command("orders"))
async def cmd_orders(message: types.Message):
    if message.from_user.id not in ADMIN_IDS:
        await message.answer("У вас нет доступа к этой команде.")
        return
        
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

# Products command handler
@router.message(Command("products"))
async def cmd_products(message: types.Message):
    if message.from_user.id not in ADMIN_IDS:
        await message.answer("У вас нет доступа к этой команде.")
        return
        
    if not products:
        await message.answer("Список товаров пуст.")
        return
    
    for product in products:
        product_text = f"""
🍽 {product["name"]}
📝 {product["description"]}
💰 {product["price"]} сум
🏷 Категория: {product["category"]}
"""
        await message.answer(product_text)

# Statistics command handler
@router.message(Command("stats"))
async def cmd_stats(message: types.Message):
    if message.from_user.id not in ADMIN_IDS:
        await message.answer("У вас нет доступа к этой команде.")
        return
        
    if not orders:
        await message.answer("Нет данных о заказах.")
        return
    
    total_orders = len(orders)
    completed_orders = len([o for o in orders.values() if o["status"] == "completed"])
    cancelled_orders = len([o for o in orders.values() if o["status"] == "cancelled"])
    active_orders = total_orders - completed_orders - cancelled_orders
    
    total_revenue = sum([o["total"] for o in orders.values() if o["status"] == "completed"])
    
    stats_text = f"""
📊 Статистика заказов:

Всего заказов: {total_orders}
Активных заказов: {active_orders}
Выполненных заказов: {completed_orders}
Отмененных заказов: {cancelled_orders}

💰 Общая выручка: {total_revenue} сум
"""
    await message.answer(stats_text)

# Status command handler
@router.message(Command("status"))
async def cmd_status(message: types.Message):
    # Parse order ID from command (e.g., /status 12345)
    command_parts = message.text.split()
    if len(command_parts) != 2:
        await message.answer("Пожалуйста, укажите номер заказа: /status [номер]")
        return
    
    order_id = command_parts[1]
    
    if order_id not in orders:
        await message.answer(f"Заказ #{order_id} не найден.")
        return
    
    order = orders[order_id]
    
    status_texts = {
        "processing": "в обработке",
        "delivering": "доставляется",
        "completed": "доставлен",
        "cancelled": "отменен"
    }
    
    status_text = status_texts.get(order["status"], "неизвестен")
    
    response_text = f"Статус заказа #{order_id}: {status_text}"
    await message.answer(response_text)

# Helper function to get status text
def get_status_text(status):
    status_map = {
        "processing": "В обработке",
        "delivering": "Доставляется",
        "completed": "Доставлено",
        "cancelled": "Отменен"
    }
    return status_map.get(status, status)

# Add product handler
@router.callback_query(lambda c: c.data == "add_product")
async def add_product_start(callback: types.CallbackQuery, state: FSMContext):
    if callback.from_user.id not in ADMIN_IDS:
        await callback.answer("У вас нет доступа к этой функции.")
        return
        
    await callback.message.answer("Введите название товара:")
    await state.set_state(ProductStates.waiting_for_name)
    await callback.answer()

@router.message(ProductStates.waiting_for_name)
async def process_name(message: types.Message, state: FSMContext):
    await state.update_data(name=message.text)
    await message.answer("Введите описание товара:")
    await state.set_state(ProductStates.waiting_for_description)

@router.message(ProductStates.waiting_for_description)
async def process_description(message: types.Message, state: FSMContext):
    await state.update_data(description=message.text)
    await message.answer("Введите цену товара (только число):")
    await state.set_state(ProductStates.waiting_for_price)

@router.message(ProductStates.waiting_for_price)
async def process_price(message: types.Message, state: FSMContext):
    try:
        price = int(message.text)
        await state.update_data(price=price)
        await message.answer("Введите категорию товара:")
        await state.set_state(ProductStates.waiting_for_category)
    except ValueError:
        await message.answer("Пожалуйста, введите корректную цену (только число):")

@router.message(ProductStates.waiting_for_category)
async def process_category(message: types.Message, state: FSMContext):
    await state.update_data(category=message.text)
    await message.answer("Пришлите изображение товара (или отправьте 'пропустить' чтобы пропустить этот шаг):")
    await state.set_state(ProductStates.waiting_for_image)

@router.message(ProductStates.waiting_for_image)
async def process_image(message: types.Message, state: FSMContext):
    data = await state.get_data()
    
    if message.photo:
        # In a real app, you would save the photo or its file_id
        image = message.photo[-1].file_id
    else:
        image = None
    
    new_product = {
        "id": f"p{len(products) + 1}",
        "name": data["name"],
        "description": data["description"],
        "price": data["price"],
        "category": data["category"],
        "image": image
    }
    
    products.append(new_product)
    
    await message.answer(f"Товар '{data['name']}' успешно добавлен!")
    await state.clear()

# Callback query handler for order actions
@router.callback_query(lambda c: c.data.startswith(("accept_", "deliver_", "complete_", "cancel_")))
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

# Callback query handler for admin menu
@router.callback_query(lambda c: c.data.startswith("admin_"))
async def admin_menu_actions(callback: types.CallbackQuery):
    if callback.from_user.id not in ADMIN_IDS:
        await callback.answer("У вас нет доступа к этой функции.")
        return
        
    action = callback.data.split("_")[1]
    
    if action == "orders":
        await cmd_orders(callback.message)
    elif action == "products":
        await cmd_products(callback.message)
    elif action == "stats":
        await cmd_stats(callback.message)
    else:
        await callback.answer("Функция в разработке")
    
    await callback.answer()

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
    global bot
    bot = Bot(token=BOT_TOKEN)
    
    # Set up storage and dispatcher
    storage = MemoryStorage()
    dp = Dispatcher(storage=storage)
    
    # Register router
    dp.include_router(router)
    
    # Skip pending updates and start polling
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)

if __name__ == "__main__":
    logging.info("Starting bot...")
    asyncio.run(main())
