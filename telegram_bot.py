
"""
Telegram Bot for Denov Baraka Somsa

This bot integrates with the web application to receive orders
and update order statuses via Telegram.

To run this bot:
1. Install requirements: pip install aiogram python-dotenv requests
2. Create a .env file with BOT_TOKEN, CHANNEL_ID, and API_URL
3. Run this script: python telegram_bot.py
"""

import asyncio
import json
import logging
import os
import requests
from datetime import datetime
from dotenv import load_dotenv
from aiogram import Bot, Dispatcher, Router, types
from aiogram.filters import Command
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, FSInputFile
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)

# Bot token from @BotFather
BOT_TOKEN = os.getenv("BOT_TOKEN", "8157470158:AAFePV804kLO3eqMM4yuJ9UDPYXg92MszM0")

# Channel/group ID where orders will be sent
CHANNEL_ID = os.getenv("CHANNEL_ID", "955988843")

# REST API URL
API_URL = os.getenv("API_URL", "http://localhost:8000")

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
    waiting_for_popular = State()

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

# Helper function to get products from API
def get_products_from_api():
    try:
        response = requests.get(f"{API_URL}/products")
        if response.status_code == 200:
            return response.json()
        return []
    except Exception as e:
        logging.error(f"Error fetching products from API: {e}")
        return []

# Helper function to get orders from API
def get_orders_from_api():
    try:
        response = requests.get(f"{API_URL}/orders")
        if response.status_code == 200:
            return response.json()
        return []
    except Exception as e:
        logging.error(f"Error fetching orders from API: {e}")
        return []

# Helper function to update order status
def update_order_status_api(order_id, status):
    try:
        response = requests.put(f"{API_URL}/orders/{order_id}", params={"status": status})
        if response.status_code == 200:
            return response.json()
        return None
    except Exception as e:
        logging.error(f"Error updating order status: {e}")
        return None

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
    
    orders = get_orders_from_api()
    if not orders:
        await message.answer("Нет активных заказов или ошибка соединения с API.")
        return
    
    active_orders = [order for order in orders 
                    if order["status"] not in ["completed", "cancelled"]]
    
    if not active_orders:
        await message.answer("Нет активных заказов.")
        return
    
    for order in active_orders:
        order_id = order["id"]
        order_text = f"""
Заказ #{order_id[-5:] if len(order_id) > 5 else order_id}
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
    
    products = get_products_from_api()
    if not products:
        await message.answer("Список товаров пуст или ошибка соединения с API.")
        return
    
    for product in products:
        product_text = f"""
🍽 {product["name"]}
📝 {product["description"]}
💰 {product["price"]} сум
🏷 Категория: {product["category"]}
"""
        # If product has an image, send it with the message
        if product.get("image"):
            try:
                image_url = f"{API_URL}{product['image']}"
                # Try to send the image with caption
                await message.answer_photo(
                    photo=image_url,
                    caption=product_text
                )
            except Exception as e:
                logging.error(f"Error sending product image: {e}")
                await message.answer(product_text)
        else:
            await message.answer(product_text)

# Statistics command handler
@router.message(Command("stats"))
async def cmd_stats(message: types.Message):
    if message.from_user.id not in ADMIN_IDS:
        await message.answer("У вас нет доступа к этой команде.")
        return
    
    orders = get_orders_from_api()
    if not orders:
        await message.answer("Нет данных о заказах или ошибка соединения с API.")
        return
    
    total_orders = len(orders)
    completed_orders = len([o for o in orders if o["status"] == "completed"])
    cancelled_orders = len([o for o in orders if o["status"] == "cancelled"])
    active_orders = total_orders - completed_orders - cancelled_orders
    
    total_revenue = sum([o["total"] for o in orders if o["status"] == "completed"])
    
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
    
    # Try to get order from API
    try:
        response = requests.get(f"{API_URL}/orders/{order_id}")
        if response.status_code == 200:
            order = response.json()
            
            status_texts = {
                "processing": "в обработке",
                "delivering": "доставляется",
                "completed": "доставлен",
                "cancelled": "отменен"
            }
            
            status_text = status_texts.get(order["status"], "неизвестен")
            
            response_text = f"Статус заказа #{order_id}: {status_text}"
            await message.answer(response_text)
        else:
            await message.answer(f"Заказ #{order_id} не найден.")
    except Exception as e:
        logging.error(f"Error getting order status: {e}")
        await message.answer("Ошибка при получении статуса заказа. Попробуйте позже.")

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
        price = float(message.text)
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
    if message.photo:
        # Get the largest photo (best quality)
        photo = message.photo[-1]
        file_id = photo.file_id
        
        # Download the photo
        file = await bot.get_file(file_id)
        file_path = file.file_path
        
        # Save the file ID for now, we'll handle the image upload to API later
        await state.update_data(image=file_path)
        
        # Ask if product is popular
        await message.answer("Это популярный товар? (да/нет):")
        await state.set_state(ProductStates.waiting_for_popular)
    elif message.text and message.text.lower() == "пропустить":
        await state.update_data(image=None)
        # Ask if product is popular
        await message.answer("Это популярный товар? (да/нет):")
        await state.set_state(ProductStates.waiting_for_popular)
    else:
        await message.answer("Это не изображение. Пришлите изображение или отправьте 'пропустить':")

@router.message(ProductStates.waiting_for_popular)
async def process_popular(message: types.Message, state: FSMContext):
    popular = message.text.lower() in ["да", "yes", "y", "true", "1"]
    data = await state.get_data()
    
    # Prepare the product data
    product_data = {
        "name": data["name"],
        "description": data["description"],
        "price": data["price"],
        "category": data["category"],
        "popular": popular
    }
    
    # If we have an image, download it and prepare for sending to API
    if data.get("image"):
        try:
            # Download file from Telegram
            file_path = data["image"]
            downloaded_file = await bot.download_file(file_path)
            
            # Create a temporary file
            temp_file_path = f"temp_{message.from_user.id}.jpg"
            with open(temp_file_path, 'wb') as f:
                f.write(downloaded_file.read())
            
            # Send to API as multipart/form-data
            files = {'image': open(temp_file_path, 'rb')}
            
            response = requests.post(
                f"{API_URL}/products", 
                data=product_data,
                files=files
            )
            
            # Remove temp file
            os.remove(temp_file_path)
            
        except Exception as e:
            logging.error(f"Error uploading product with image: {e}")
            await message.answer(f"Ошибка при загрузке товара: {e}")
            await state.clear()
            return
    else:
        # Send to API without image
        try:
            response = requests.post(f"{API_URL}/products", data=product_data)
        except Exception as e:
            logging.error(f"Error uploading product: {e}")
            await message.answer(f"Ошибка при загрузке товара: {e}")
            await state.clear()
            return
    
    # Check response
    if response.status_code == 200:
        new_product = response.json()
        
        success_message = f"Товар '{data['name']}' успешно добавлен!"
        
        # If the product has an image, send it with confirmation
        if new_product.get("image"):
            try:
                image_url = f"{API_URL}{new_product['image']}"
                await message.answer_photo(
                    photo=image_url,
                    caption=success_message
                )
            except Exception as e:
                logging.error(f"Error sending confirmation image: {e}")
                await message.answer(success_message)
        else:
            await message.answer(success_message)
    else:
        await message.answer(f"Ошибка при добавлении товара: {response.text}")
    
    await state.clear()

# Callback query handler for order actions
@router.callback_query(lambda c: c.data.startswith(("accept_", "deliver_", "complete_", "cancel_")))
async def order_actions(callback: types.CallbackQuery):
    if callback.from_user.id not in ADMIN_IDS:
        await callback.answer("У вас нет доступа к этой функции.")
        return
        
    data = callback.data
    
    # Parse action and order_id from callback data
    if "_" in data:
        action, order_id = data.split("_", 1)
        
        # Map actions to statuses
        status_mapping = {
            "accept": "processing",
            "deliver": "delivering",
            "complete": "completed",
            "cancel": "cancelled"
        }
        
        status = status_mapping.get(action)
        if not status:
            await callback.answer("Неизвестное действие.")
            return
        
        # Update order status in API
        result = update_order_status_api(order_id, status)
        
        if result:
            status_text_mapping = {
                "processing": "принят в обработку",
                "delivering": "передан в доставку",
                "completed": "доставлен",
                "cancelled": "отменен"
            }
            
            status_text = status_text_mapping.get(status, status)
            
            await callback.answer(f"Заказ #{order_id[-5:] if len(order_id) > 5 else order_id} {status_text}")
            
            # Update message text
            order = result.get("order", {})
            order_text = f"""
Заказ #{order_id[-5:] if len(order_id) > 5 else order_id}
Статус: {get_status_text(status)}
Клиент: {order["customer"]["name"]}
Телефон: {order["customer"]["phone"]}
Адрес: {order["customer"]["address"]}
Сумма: {order["total"]} сум
"""
            await callback.message.edit_text(order_text, reply_markup=get_order_keyboard(order_id))
        else:
            await callback.answer("Ошибка при обновлении статуса заказа.")

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
            logging.error("Invalid order data format")
            return
        
        order_id = order_data["id"][-5:] if len(order_data["id"]) > 5 else order_data["id"]
        
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
                reply_markup=get_order_keyboard(order_data["id"])
            )
        
        # Save order to API
        try:
            # Add createdAt if not present
            if "createdAt" not in order_data:
                order_data["createdAt"] = datetime.now().isoformat()
            
            # Add status if not present
            if "status" not in order_data:
                order_data["status"] = "processing"
                
            response = requests.post(f"{API_URL}/orders", json=order_data)
            if response.status_code != 200:
                logging.error(f"Error saving order to API: {response.text}")
        except Exception as e:
            logging.error(f"Error saving order to API: {e}")
        
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
