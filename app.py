import os
import logging
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from werkzeug.utils import secure_filename
from PIL import Image
import pytesseract
import io
import base64

# Configure logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "braille-world-secret-key-2024")

# Configure for different deployment environments
if 'DYNO' in os.environ:  # Heroku
    app.config['SERVER_NAME'] = None
elif 'RENDER' in os.environ:  # Render
    app.config['SERVER_NAME'] = None
else:  # Local development
    app.config['SERVER_NAME'] = None

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

# Hindi to Braille mapping (comprehensive implementation with matras)
HINDI_BRAILLE_MAP = {
    # Vowels (स्वर)
    'अ': '⠁', 'आ': '⠜', 'इ': '⠊', 'ई': '⠔', 'उ': '⠥', 'ऊ': '⠳', 
    'ए': '⠑', 'ऐ': '⠌', 'ओ': '⠕', 'औ': '⠪', 'ऋ': '⠐⠗',
    
    # Consonants (व्यंजन) - Ka group
    'क': '⠅', 'ख': '⠨⠅', 'ग': '⠛', 'घ': '⠨⠛', 'ङ': '⠰⠛',
    
    # Cha group
    'च': '⠉', 'छ': '⠨⠉', 'ज': '⠚', 'झ': '⠨⠚', 'ञ': '⠰⠚',
    
    # Ta group (retroflex)
    'ट': '⠞', 'ठ': '⠨⠞', 'ड': '⠙', 'ढ': '⠨⠙', 'ण': '⠰⠙',
    
    # Ta group (dental)
    'त': '⠞', 'थ': '⠹', 'द': '⠙', 'ध': '⠮', 'न': '⠝',
    
    # Pa group
    'प': '⠏', 'फ': '⠋', 'ब': '⠃', 'भ': '⠨⠃', 'म': '⠍',
    
    # Ya group
    'य': '⠽', 'र': '⠗', 'ल': '⠇', 'व': '⠧',
    
    # Sha group
    'श': '⠩', 'ष': '⠯', 'स': '⠎', 'ह': '⠓',
    
    # Additional consonants
    'क्ष': '⠅⠩', 'त्र': '⠞⠗', 'ज्ञ': '⠚⠰⠝',
    
    # Matras (vowel signs)
    'ा': '⠜', 'ि': '⠊', 'ी': '⠔', 'ु': '⠥', 'ू': '⠳', 
    'े': '⠑', 'ै': '⠌', 'ो': '⠕', 'ौ': '⠪', 'ृ': '⠐⠗',
    
    # Special characters
    'ं': '⠰⠍', 'ः': '⠰⠓', '्': '⠈', 'ँ': '⠐⠍',
    
    # Numbers
    '०': '⠚', '१': '⠁', '२': '⠃', '३': '⠉', '४': '⠙',
    '५': '⠑', '६': '⠋', '७': '⠛', '८': '⠓', '९': '⠊',
    
    # Punctuation
    ' ': '⠀', '।': '⠲', ',': '⠂', '.': '⠲', '?': '⠦', 
    '!': '⠖', ':': '⠒', ';': '⠆', '-': '⠤', '"': '⠐⠦',
    '(': '⠐⠣', ')': '⠐⠜', '[': '⠨⠣', ']': '⠨⠜'
}

def allowed_file(filename):
    """Check if uploaded file has allowed extension"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def text_to_braille(text, language='english'):
    """Convert text to Braille Unicode"""
    if not text:
        return ""
    
    braille_text = ""
    
    if language == 'english':
        text = text.lower()
        for char in text:
            braille_text += BRAILLE_MAP.get(char, char)
    else:  # Hindi
        # Process Hindi text character by character, preserving original case
        i = 0
        while i < len(text):
            char = text[i]
            
            # Check for compound characters first (क्ष, त्र, ज्ञ)
            if i < len(text) - 2:
                three_char = text[i:i+3]
                if three_char in HINDI_BRAILLE_MAP:
                    braille_text += HINDI_BRAILLE_MAP[three_char]
                    i += 3
                    continue
            
            # Check for two-character combinations
            if i < len(text) - 1:
                two_char = text[i:i+2]
                if two_char in HINDI_BRAILLE_MAP:
                    braille_text += HINDI_BRAILLE_MAP[two_char]
                    i += 2
                    continue
            
            # Single character mapping
            if char in HINDI_BRAILLE_MAP:
                braille_text += HINDI_BRAILLE_MAP[char]
            else:
                # If character not found, preserve it
                braille_text += char
            i += 1
    
    return braille_text

def extract_text_from_image(image_path, language='eng'):
    """Extract text from image using OCR"""
    try:
        # Configure tesseract language
        lang_code = 'hin' if language == 'hindi' else 'eng'
        
        # Open and process image
        image = Image.open(image_path)
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Extract text using pytesseract
        extracted_text = pytesseract.image_to_string(image, lang=lang_code)
        
        return extracted_text.strip()
    except Exception as e:
        app.logger.error(f"OCR Error: {str(e)}")
        return None

@app.route('/')
def index():
    """Homepage"""
    return render_template('index.html')

@app.route('/text-to-braille')
def text_to_braille_page():
    """Text to Braille service page"""
    return render_template('text_to_braille.html')

@app.route('/image-to-braille')
def image_to_braille_page():
    """Image to Braille service page"""
    return render_template('image_to_braille.html')

@app.route('/braille-image-to-text')
def braille_image_to_text():
    """Redirect to external Braille Image to Text tool"""
    return redirect('https://braille-speech-converter.onrender.com')

@app.route('/about')
def about():
    """About Us page"""
    return render_template('about.html')

@app.route('/api/convert-text', methods=['POST'])
def convert_text_api():
    """API endpoint to convert text to Braille"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        language = data.get('language', 'english')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        braille_result = text_to_braille(text, language)
        
        return jsonify({
            'success': True,
            'original_text': text,
            'braille_text': braille_result,
            'language': language
        })
    
    except Exception as e:
        app.logger.error(f"Text conversion error: {str(e)}")
        return jsonify({'error': 'Failed to convert text to Braille'}), 500

@app.route('/api/upload-image', methods=['POST'])
def upload_image_api():
    """API endpoint to process uploaded image and convert to Braille"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        language = request.form.get('language', 'english')
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if file.filename and not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Please upload an image file.'}), 400
        
        # Save uploaded file
        if file.filename:
            filename = secure_filename(file.filename)
        else:
            filename = 'uploaded_image.png'
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Extract text from image
        extracted_text = extract_text_from_image(filepath, language)
        
        # Clean up uploaded file
        try:
            os.remove(filepath)
        except:
            pass
        
        if extracted_text is None:
            return jsonify({'error': 'Failed to extract text from image. Please ensure the image contains clear text.'}), 500
        
        if not extracted_text:
            return jsonify({'error': 'No text found in the image. Please upload an image with readable text.'}), 400
        
        # Convert extracted text to Braille
        braille_result = text_to_braille(extracted_text, language)
        
        return jsonify({
            'success': True,
            'extracted_text': extracted_text,
            'braille_text': braille_result,
            'language': language
        })
    
    except Exception as e:
        app.logger.error(f"Image processing error: {str(e)}")
        return jsonify({'error': 'Failed to process image. Please try again.'}), 500

@app.errorhandler(413)
def too_large(e):
    """Handle file too large error"""
    return jsonify({'error': 'File too large. Maximum size is 16MB.'}), 413

@app.errorhandler(404)
def not_found(e):
    """Handle 404 errors"""
    return render_template('index.html'), 404

@app.errorhandler(500)
def internal_error(e):
    """Handle internal server errors"""
    app.logger.error(f"Internal server error: {str(e)}")
    return render_template('index.html'), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
