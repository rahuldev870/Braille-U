/**
 * ✅ ImageToBrailleConverter
 * ✅ OCR language detection (Hindi/English)
 * ✅ Read Aloud auto in selected language
 * ✅ Android WebView, Backend TTS, Web Speech fallback
 */
class ImageToBrailleConverter {
    constructor() {
        this.imageInput = document.getElementById('imageInput');
        this.previewImg = document.getElementById('previewImg');
        this.readBtn = document.getElementById('readBtn');
        this.extractedText = document.getElementById('extractedText');
        this.brailleOutput = document.getElementById('brailleOutput');
        this.languageSelect = document.getElementById('languageSelect');
        this.synth = window.speechSynthesis;
        this.isAndroid = this.checkAndroidWebView();
        this.currentLanguage = 'english';

        this.attachEvents();
    }

    checkAndroidWebView() {
        return typeof window.AndroidInterface !== 'undefined' &&
               typeof window.AndroidInterface.speakText === 'function';
    }

    attachEvents() {
        this.languageSelect.addEventListener('change', (e) => {
            this.currentLanguage = e.target.value;
        });

        this.imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.previewImg.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

        this.readBtn.addEventListener('click', () => {
            const text = this.extractedText.textContent.trim();
            if (text) this.readAloud(text);
        });

        document.getElementById('uploadForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.uploadImage();
        });
    }

    uploadImage() {
        const file = this.imageInput.files[0];
        if (!file) {
            alert('Please select an image.');
            return;
        }

        const formData = new FormData();
        formData.append('image', file);
        formData.append('language', this.currentLanguage);

        fetch('/api/image-to-text', {
            method: 'POST',
            body: formData
        })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                    return;
                }
                this.extractedText.textContent = data.text;
                this.brailleOutput.textContent = data.braille;
            })
            .catch(err => {
                console.error('Image OCR error:', err);
                alert('Failed to process image.');
            });
    }

    async readAloud(text) {
        const langCode = this.currentLanguage === 'hindi' ? 'hi-IN' : 'en-US';

        // ✅ Android WebView TTS
        if (this.isAndroid) {
            try {
                window.AndroidInterface.speakText(text, langCode);
                return;
            } catch (err) {
                console.warn('Android TTS failed:', err);
            }
        }

        // ✅ Backend TTS API
        try {
            const res = await fetch('/api/text-to-speech', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, language: this.currentLanguage })
            });
            const data = await res.json();
            if (data.audio_url) {
                const audio = new Audio(data.audio_url);
                await audio.play();
                return;
            }
        } catch (err) {
            console.warn('Backend TTS failed:', err);
        }

        // ✅ Web Speech API fallback
        if (this.synth) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = langCode;
            this.synth.speak(utterance);
        }
    }
}
document.addEventListener('DOMContentLoaded', () => new ImageToBrailleConverter());
