import urllib.request
import urllib.parse
import json
import time

BOT_TOKEN = '8238539689:AAEhOb3jSI-dItikxeBcd5ZH9PycjXhX9EM'
WEBHOOK_URL = 'http://localhost:8000/api/notifications/telegram/webhook/'
OFFSET = None

# Delete webhook first
print("Deleting webhook...")
try:
    urllib.request.urlopen(f'https://api.telegram.org/bot{BOT_TOKEN}/deleteWebhook').read()
    print("Webhook deleted successfully.")
except Exception as e:
    print(f"Error deleting webhook: {e}")

print(f"Polling Telegram for updates and forwarding to {WEBHOOK_URL}...")

while True:
    try:
        url = f'https://api.telegram.org/bot{BOT_TOKEN}/getUpdates?timeout=30'
        if OFFSET:
            url += f'&offset={OFFSET}'
            
        req = urllib.request.Request(url)
        response = urllib.request.urlopen(req)
        data = json.loads(response.read().decode('utf-8'))
        
        if data.get('ok') and data.get('result'):
            for update in data['result']:
                update_id = update['update_id']
                OFFSET = update_id + 1
                
                print(f"Received update {update_id}, forwarding to Django...")
                
                # Forward to local Django instance
                try:
                    forward_req = urllib.request.Request(
                        WEBHOOK_URL,
                        data=json.dumps(update).encode('utf-8'),
                        headers={'Content-Type': 'application/json'}
                    )
                    django_resp = urllib.request.urlopen(forward_req)
                    print(f"Forwarded successfully. Status: {django_resp.status}")
                except Exception as e:
                    print(f"Failed to forward update to Django: {e}")
                    
    except Exception as e:
        print(f"Error polling: {e}")
        time.sleep(2)
        
    time.sleep(1)
