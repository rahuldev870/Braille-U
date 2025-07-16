import os
import logging
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from werkzeug.utils import secure_filename
from PIL import Image
import pytesseract
import io
import base64

# Import TTS module
from utils.speech_processor import text_to_speech

# Configure logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "braille-world-secret-key-2024")

# Configure upload settings
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Create uploads directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Braille Unicode mapping for English characters
BRAILLE_MAP = {
    'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑', 'f': '⠋', 'g': '⠛',
    'h': '⠓', 'i': '⠊', 'j': '⠚', 'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝',
    'o': '⠕', 'p': '⠏', 'q': '⠟', 'r': '⠗', 's': '⠎', 't': '⠞', 'u': '⠥',
    'v': '⠧', 'w': '⠺', 'x': '⠭', 'y': '⠽', 'z': '⠵',
    '1': '⠁', '2': '⠃', '3': '⠉', '4': '⠙', '5': '⠑', '6': '⠋', '7': '⠛',
    '8': '⠓', '9': '⠊', '0': '⠚',
    ' ': '⠀', '.': '⠲', ',': '⠂', '?': '⠦', '!': '⠖', ':': '⠒', ';': '⠆',
    '-': '⠤', '(': '⠐⠣', ')': '⠐⠜', '"': '⠐⠦'
}

# Hindi Braille mapping
HINDI_BRAILLE_MAP = {
    # (shortened here - keep full mapping from your previous code)
    'अ': '⠁', 'आ': '⠜', 'इ': '⠊', 'ई': '⠔', 'उ': '⠥', 'ऊ': '⠳',
    ' ': '⠀', '।': '⠲', ',': '⠂', '.': '⠲', '?': '⠦', '!': '⠖'
    # Add remaining mappings...
}

def allowed_file(filename):
    """Check if uploaded file has allowed extension"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def text_to_braille(text, language='english'):
    """Convert text to Braille Unicode"""
    braille_text = ""
    if language == 'english':
        for char in text.lower():
            braille_text += BRAILLE_MAP.get(char, char)
    else:
        for char in text:
            braille_text += HINDI_BRAILLE_MAP.get(char, char)
    return braille_text

def extract_text_from_image(image_path, language='eng'):
    """Extract text from image using OCR"""
    try:
        lang_code = 'hin' if language == 'hindi' else 'eng'
        image = Image.open(image_path)
        if image.mode != 'RGB':
            image = image.convert('RGB')
        return pytesseract.image_to_string(image, lang=lang_code).strip()
    except Exception as e:
        app.logger.error(f"OCR Error: {str(e)}")
        return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/text-to-braille')
def text_to_braille_page():
    return render_template('text_to_braille.html')

@app.route('/image-to-braille')
def image_to_braille_page():
    return render_template('image_to_braille.html')

@app.route('/api/convert-text', methods=['POST'])
def convert_text_api():
    try:
        data = request.get_json()
        text = data.get('text', '')
        language = data.get('language', 'english')
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        braille_result = text_to_braille(text, language)
        return jsonify({'success': True, 'braille_text': braille_result})
    except Exception as e:
        app.logger.error(f"Text conversion error: {str(e)}")
        return jsonify({'error': 'Failed to convert text'}), 500

@app.route('/api/upload-image', methods=['POST'])
def upload_image_api():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file'}), 400
        file = request.files['image']
        language = request.form.get('language', 'english')
        if not file or file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type'}), 400
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        extracted_text = extract_text_from_image(filepath, language)
        os.remove(filepath)
        if not extracted_text:
            return jsonify({'error': 'No text found in image'}), 400
        braille_result = text_to_braille(extracted_text, language)
        return jsonify({'success': True, 'extracted_text': extracted_text, 'braille_text': braille_result})
    except Exception as e:
        app.logger.error(f"Image processing error: {str(e)}")
        return jsonify({'error': 'Failed to process image'}), 500

@app.route('/api/text-to-speech', methods=['POST'])
def convert_text_to_speech():
    """API endpoint to convert text to speech"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        language = data.get('language', 'english')
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        audio_url = text_to_speech(text, language)
        return jsonify({'audio_url': audio_url})
    except Exception as e:
        app.logger.error(f"TTS Error: {str(e)}")
        return jsonify({'error': 'Failed to generate audio'}), 500

@app.errorhandler(413)
def too_large(e):
    return jsonify({'error': 'File too large. Max 16MB'}), 413

@app.errorhandler(404)
def not_found(e):
    return render_template('index.html'), 404

@app.errorhandler(500)
def internal_error(e):
    app.logger.error(f"Internal server error: {str(e)}")
    return render_template('index.html'), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
