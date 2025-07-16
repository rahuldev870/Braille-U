
import os
import uuid
import asyncio
from edge_tts import Communicate

# Directory to save audio files
AUDIO_DIR = "static/audio"
os.makedirs(AUDIO_DIR, exist_ok=True)

# Map language to voice
VOICE_MAP = {
    "english": "en-US-JennyNeural",
    "hindi": "hi-IN-SwaraNeural"
}

async def generate_audio(text, voice, filename):
    communicate = Communicate(text, voice)
    await communicate.save(filename)

def text_to_speech(text, language='english'):
    try:
        voice = VOICE_MAP.get(language.lower(), VOICE_MAP['english'])
        filename = f"{uuid.uuid4().hex}.mp3"
        filepath = os.path.join(AUDIO_DIR, filename)

        asyncio.run(generate_audio(text, voice, filepath))

        return f"/static/audio/{filename}"
    except Exception as e:
        print(f"[TTS Error] {str(e)}")
        raise e
