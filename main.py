import os
import json
import requests
from flask import Flask, request

app = Flask(__name__)

TOKEN = os.getenv("BOT_TOKEN")
API_URL = f"https://api.telegram.org/bot{TOKEN}"

# Память в оперативке — можно заменить на базу
user_data = {}

def send_message(chat_id, text):
    url = f"{API_URL}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML"
    }
    requests.post(url, json=payload)

@app.route('/', methods=['POST'])
def webhook():
    data = request.get_json()

    if "message" in data:
        chat_id = data["message"]["chat"]["id"]
        message_text = data["message"].get("text", "").lower()

        if message_text.startswith("день"):
            try:
                day_number = int(message_text.split()[1])
                user_data[chat_id] = day_number
                send_message(chat_id, f"✅ День {day_number} сохранён!")
            except:
                send_message(chat_id, "⚠️ Напиши так: <code>день 1</code>, <code>день 7</code> и т.д.")
        
        elif "сброс" in message_text:
            user_data[chat_id] = 0
            send_message(chat_id, "🔄 Счётчик сброшен. Начни с <code>день 1</code>")

        elif "статистика" in message_text:
            day = user_data.get(chat_id, 0)
            send_message(chat_id, f"📊 Сейчас у тебя <b>{day} день(ей)</b>")

        elif "помощь" in message_text or "команды" in message_text:
            send_message(chat_id, """📘 <b>Доступные команды:</b>

• <code>день 1</code> — сохранить день
• <code>статистика</code> — показать прогресс
• <code>сброс</code> — обнулить счётчик
• <code>помощь</code> — справка

Бот работает в режиме учёта прогресса по дням 💪""")

        else:
            send_message(chat_id, "🤖 Напиши <code>помощь</code>, чтобы увидеть команды.")

    return "ok"

@app.route('/')
def index():
    return "Бот работает 💻"
