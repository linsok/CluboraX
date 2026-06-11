import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

def get_telegram_api_url(method):
    token = getattr(settings, 'TELEGRAM_BOT_TOKEN', '')
    if not token:
        logger.warning("TELEGRAM_BOT_TOKEN is not set in settings.")
        return None
    return f"https://api.telegram.org/bot{token}/{method}"

def send_telegram_message(chat_id, text, reply_markup=None):
    """
    Send a message to a Telegram chat.
    reply_markup is an optional dict containing inline keyboards.
    """
    url = get_telegram_api_url("sendMessage")
    if not url:
        return False
        
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML"
    }
    
    if reply_markup:
        payload["reply_markup"] = reply_markup
        
    try:
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        return True
    except Exception as e:
        logger.error(f"Failed to send Telegram message: {e}")
        if hasattr(e, 'response') and e.response is not None:
            logger.error(f"Telegram API response: {e.response.text}")
        return False

def send_telegram_photo(chat_id, photo_file, caption=None, reply_markup=None):
    """
    Send a photo to a Telegram chat.
    photo_file should be a Django File object or an open file pointer.
    """
    url = get_telegram_api_url("sendPhoto")
    if not url:
        return False
        
    data = {
        "chat_id": chat_id,
        "parse_mode": "HTML"
    }
    
    if caption:
        data["caption"] = caption
        
    if reply_markup:
        import json
        data["reply_markup"] = json.dumps(reply_markup)
        
    try:
        photo_file.seek(0)
        files = {"photo": photo_file}
        response = requests.post(url, data=data, files=files, timeout=30)
        response.raise_for_status()
        return True
    except Exception as e:
        logger.error(f"Failed to send Telegram photo: {e}")
        if 'response' in locals() and hasattr(response, 'text'):
            logger.error(f"Telegram API Response: {response.text}")
        return False

def edit_telegram_message_text(chat_id, message_id, text, reply_markup=None):
    """
    Edit a previously sent message.
    """
    url = get_telegram_api_url("editMessageText")
    if not url:
        return False
        
    payload = {
        "chat_id": chat_id,
        "message_id": message_id,
        "text": text,
        "parse_mode": "HTML"
    }
    
    if reply_markup is not None:
        payload["reply_markup"] = reply_markup
        
    try:
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        return True
    except Exception as e:
        logger.error(f"Failed to edit Telegram message: {e}")
        return False

def edit_telegram_message_caption(chat_id, message_id, caption, reply_markup=None):
    """
    Edit a previously sent message's caption (for media messages).
    """
    url = get_telegram_api_url("editMessageCaption")
    if not url:
        return False
        
    payload = {
        "chat_id": chat_id,
        "message_id": message_id,
        "caption": caption,
        "parse_mode": "HTML"
    }
    
    if reply_markup is not None:
        payload["reply_markup"] = reply_markup
        
    try:
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        return True
    except Exception as e:
        logger.error(f"Failed to edit Telegram message caption: {e}")
        if hasattr(e, 'response') and e.response is not None:
            logger.error(f"Telegram API response: {e.response.text}")
        return False

def answer_callback_query(callback_query_id, text=None, show_alert=False):
    """
    Answer a callback query (when user clicks an inline button)
    to remove the loading state from the button.
    """
    url = get_telegram_api_url("answerCallbackQuery")
    if not url:
        return False
        
    payload = {
        "callback_query_id": callback_query_id,
    }
    if text:
        payload["text"] = text
        payload["show_alert"] = show_alert
        
    try:
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        return True
    except Exception as e:
        logger.error(f"Failed to answer Telegram callback query: {e}")
        if hasattr(e, 'response') and e.response is not None:
            logger.error(f"Telegram API response: {e.response.text}")
        return False

def set_webhook(webhook_url):
    """
    Set the webhook URL for the Telegram bot.
    """
    url = get_telegram_api_url("setWebhook")
    if not url:
        return False
        
    payload = {
        "url": webhook_url
    }
    try:
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        logger.info(f"Telegram webhook set to {webhook_url}")
        return True
    except Exception as e:
        logger.error(f"Failed to set Telegram webhook: {e}")
        return False
