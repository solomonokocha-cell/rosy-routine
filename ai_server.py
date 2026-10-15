import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.error import HTTPError, URLError
from urllib.parse import quote, parse_qs, urlparse
from urllib.request import Request, urlopen

ROOT = os.path.dirname(os.path.abspath(__file__))


def load_env():
    values = {}
    env_path = os.path.join(ROOT, '.env')
    try:
        with open(env_path, encoding='utf-8') as env_file:
            for line in env_file:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    values[key.strip()] = value.strip().strip('"\'')
    except FileNotFoundError:
        pass
    return values


ENV = load_env()
API_KEY = os.getenv('GEMINI_API_KEY') or ENV.get('GEMINI_API_KEY', '')
MODEL = os.getenv('GEMINI_MODEL') or ENV.get('GEMINI_MODEL', 'gemini-2.5-flash')
TEMPERATURE = float(os.getenv('GEMINI_TEMPERATURE') or ENV.get('GEMINI_TEMPERATURE', '0.7'))
MAX_OUTPUT_TOKENS = int(os.getenv('GEMINI_MAX_OUTPUT_TOKENS') or ENV.get('GEMINI_MAX_OUTPUT_TOKENS', '600'))

SYSTEM_PROMPT = """You are Rosy, a friendly, bubbly female study buddy inside Rosy Routine.
Be warm, encouraging, concise, and a little girly without being distracting. You can answer general questions, explain school topics, make quizzes and study plans, and answer questions about the Rosy Routine app. Never pretend to know private user information. Encourage breaks and realistic study sessions. Use the user's notes when provided. Respond in plain text with helpful formatting."""


def gemini_reply(message, notes, history):
    if not API_KEY:
        raise RuntimeError('GEMINI_API_KEY is missing from .env')
    conversation = []
    for item in history[-8:]:
        role = 'model' if item.get('role') == 'assistant' else 'user'
        content = str(item.get('content', '')).strip()
        if content:
            conversation.append({'role': role, 'parts': [{'text': content}]})
    context = f"\n\nThe student's saved notes are:\n{notes}" if notes else ''
    conversation.append({'role': 'user', 'parts': [{'text': message + context}]})
    payload = json.dumps({
        'system_instruction': {'parts': [{'text': SYSTEM_PROMPT}]},
        'contents': conversation,
        'generationConfig': {'temperature': TEMPERATURE, 'maxOutputTokens': MAX_OUTPUT_TOKENS},
    }).encode('utf-8')
    endpoint = f'https://generativelanguage.googleapis.com/v1beta/models/{quote(MODEL)}:generateContent?key={API_KEY}'
    request = Request(endpoint, data=payload, headers={'Content-Type': 'application/json'}, method='POST')
    try:
        with urlopen(request, timeout=45) as response:
            result = json.loads(response.read().decode('utf-8'))
    except HTTPError as error:
        detail = error.read().decode('utf-8', errors='replace')
        raise RuntimeError(f'Gemini returned HTTP {error.code}: {detail[:300]}') from error
    except URLError as error:
        raise RuntimeError('Could not reach Gemini. Check your internet connection.') from error
    candidates = result.get('candidates', [])
    if not candidates:
        raise RuntimeError('Gemini returned no answer.')
    parts = candidates[0].get('content', {}).get('parts', [])
    answer = ''.join(part.get('text', '') for part in parts).strip()
    if not answer:
        raise RuntimeError('Gemini returned an empty answer.')
    return answer


class Handler(BaseHTTPRequestHandler):
    def cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')

    def send_json(self, status, body):
        encoded = json.dumps(body).encode('utf-8')
        self.send_response(status)
        self.cors()
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def do_OPTIONS(self):
        self.send_response(204)
        self.cors()
        self.end_headers()

    def do_GET(self):
        if urlparse(self.path).path == '/health':
            self.send_json(200, {'ok': True, 'configured': bool(API_KEY), 'model': MODEL})
        else:
            self.send_json(404, {'reply': 'Rosy AI endpoint not found.'})

    def do_POST(self):
        if urlparse(self.path).path != '/api/study-chat':
            self.send_json(404, {'reply': 'Rosy AI endpoint not found.'})
            return
        try:
            length = int(self.headers.get('Content-Length', '0'))
            body = json.loads(self.rfile.read(length).decode('utf-8'))
            message = str(body.get('message', '')).strip()
            if not message:
                self.send_json(400, {'reply': 'Tell Rosy what you would like help with.'})
                return
            answer = gemini_reply(message, str(body.get('notes', '')), body.get('history', []))
            self.send_json(200, {'reply': answer})
        except Exception as error:
            print(f'AI request error: {error}')
            self.send_json(500, {'reply': 'Rosy could not answer right now. Check the AI server terminal for the setup error.'})

    def log_message(self, format_string, *args):
        print(f'[Rosy AI] {format_string % args}')


if __name__ == '__main__':
    port = int(os.getenv('PORT', '5001'))
    print(f'Rosy AI server running at http://127.0.0.1:{port}')
    print(f'Gemini configured: {bool(API_KEY)} | model: {MODEL}')
    ThreadingHTTPServer(('127.0.0.1', port), Handler).serve_forever()
