import logging
from flask import Flask
import telebot
from datetime import datetime
import json
import os

# === НАСТРОЙКИ ===
TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN'
DATA_FILE = 'user_data.json'
ADMIN_ID = YOUR_ADMIN_TELEGRAM_ID  # замените на свой Telegram ID

# === ИНИЦИАЛИЗАЦИЯ ===
bot = telebot.TeleBot(TOKEN)
app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

# === ЗАГРУЗКА / СОХРАНЕНИЕ ДАННЫХ ===
def load_data():
    if not os.path.exists(DATA_FILE):
        return {}
    with open(DATA_FILE, 'r') as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f)

users = load_data()

# === КОМАНДЫ ===
@bot.message_handler(commands=['start'])
def start(message):
    uid = str(message.from_user.id)
    if uid not in users:
        users[uid] = {
            'start_date': datetime.today().strftime('%Y-%m-%d'),
            'best_streak': 0,
            'current_streak': 0,
            'relapses': 0,
            'last_report': None
        }
        save_data(users)
    bot.send_message(message.chat.id, 'Привет! Бот начал отслеживание твоего пути воздержания. Пиши "День 1", "День 2" и т.д.')

@bot.message_handler(commands=['help'])
def help_cmd(message):
    bot.send_message(message.chat.id, "Доступные команды:
/start - начать путь
/my - показать прогресс
/restart - начать заново
/help - список команд")

@bot.message_handler(commands=['my'])
def my_status(message):
    uid = str(message.from_user.id)
    if uid not in users:
        return bot.send_message(message.chat.id, "Сначала напиши /start")
    user = users[uid]
    bot.send_message(message.chat.id, f"🧠 День: {user['current_streak']}
📈 Лучший результат: {user['best_streak']}
❌ Срывов: {user['relapses']}")

@bot.message_handler(commands=['restart'])
def restart(message):
    uid = str(message.from_user.id)
    if uid in users:
        users[uid]['current_streak'] = 0
        users[uid]['start_date'] = datetime.today().strftime('%Y-%m-%d')
        users[uid]['last_report'] = None
        save_data(users)
    bot.send_message(message.chat.id, "🔁 Прогресс обнулён. Начни заново!")

@bot.message_handler(commands=['adminlog'])
def admin_log(message):
    if message.from_user.id != ADMIN_ID:
        return
    report = ""
    for uid, data in users.items():
        report += f"ID: {uid}, День: {data['current_streak']}, Лучший: {data['best_streak']}, Срывы: {data['relapses']}
"
    bot.send_message(message.chat.id, report or "Нет данных")

# === ОБРАБОТКА ТЕКСТА ===
@bot.message_handler(func=lambda m: True)
def catch_text(message):
    uid = str(message.from_user.id)
    text = message.text.lower().strip()
    if 'сорвался' in text:
        if uid in users:
            users[uid]['relapses'] += 1
            users[uid]['current_streak'] = 0
            save_data(users)
            return bot.send_message(message.chat.id, "😢 Срыв зафиксирован. Главное — не сдаваться.")
    elif 'день' in text:
        digits = ''.join([c for c in text if c.isdigit()])
        if digits:
            day = int(digits)
            if uid in users:
                users[uid]['current_streak'] = day
                users[uid]['best_streak'] = max(users[uid]['best_streak'], day)
                users[uid]['last_report'] = datetime.today().strftime('%Y-%m-%d')
                save_data(users)
                return bot.send_message(message.chat.id, f"✅ День {day} зафиксирован.")
    else:
        bot.send_message(message.chat.id, "Я пока понимаю только сообщения типа «День 3» или «Я сорвался»")

# === FLASK ДЛЯ RENDER ===
@app.route('/', methods=['GET', 'HEAD'])
def index():
    return 'ok'

if __name__ == '__main__':
    bot.polling()
