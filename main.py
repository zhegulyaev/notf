import os
import logging
from flask import Flask, request
import requests

TOKEN = os.environ.get("BOT_TOKEN")
CHAT_ID_LOG = os.environ.get("LOG_CHAT_ID")  # по желанию: куда слать уведомления

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

URL = f"https://api.telegram.org/bot{TOKEN}/"

def send_message(chat_id, text):
    data = {"chat_id": chat_id, "text": text}
    requests.post(URL + "sendMessage", data=data)

@app.route(f"/{TOKEN}", methods=["POST"])
def webhook():
    data = request.get_json()
    logging.info(f"Received: {data}")
    if "message" in data:
        chat_id = data["message"]["chat"]["id"]
        text = data["message"].get("text", "")

        if text.lower() in ["/start", "старт"]:
            send_message(chat_id, "Привет! Веди отчёты по воздержанию и отслеживай прогресс.")
        elif "день" in text.lower():
            send_message(chat_id, f"Записал: {text}")
        elif text.lower() == "/help":
send_message(chat_id, """Доступные команды:
— День 1
— Старт
— #чек
— /стоп
— /помощь
""")
        else:
           send_message(chat_id, """Доступные команды:
— День 1
— Старт
— #чек
— /стоп
— /помощь
""")
    return "ok"

@app.route("/", methods=["GET"])
def index():
    return "Бот работает!"
