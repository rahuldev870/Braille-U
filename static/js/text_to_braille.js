/**
 * ✅ TextToBrailleConverter
 * ✅ Google Mic for voice input (Hindi/English)
 * ✅ Braille conversion on typing
 * ✅ Read Aloud with Android WebView, Backend TTS, Web Speech fallback
 */
class TextToBrailleConverter {
    constructor() {
        this.textInput = document.getElementById('textInput');
        this.readAloudBtn = document.getElementById('readAloudBtn');
        this.micBtn = document.getElementById('micBtn');
        this.brailleOutput = document.getElementById('brailleOutput');
        this.languageRadios = document.querySelectorAll('input[name="language"]');
        this.synth = window.speechSynthesis;
        this.isAndroid = this.checkAndroidWebView();
        this.currentLanguage = 'english';
        this.recognition = null;

        this.setupLanguageSwitch();
        this.setupMic();
        this.attachEvents();
    }

    checkAndroidWebView() {
        return typeof window.AndroidInterface !== 'undefined' && 
               typeof window.AndroidInterface.speakText === 'function';
    }

    setupLanguageSwitch() {
        this.languageRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                this.currentLanguage = radio.value;
                if (this.recognition) {
                    this.recognition.lang = this.currentLanguage === 'hindi' ? 'hi-IN' : 'en-US';
                }
            });
        });
    }

    setupMic() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.lang = this.currentLanguage === 'hindi' ? 'hi-IN' : 'en-US';
            this.recognition.continuous = false;
            this.recognition.interimResults = false;

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript.trim();
                this.textInput.value = transcript;
                this.convertToBraille(transcript);
            };

            this.recognition.onerror = (e) => {
                console.error('Mic Error:', e.error);
                alert('Mic error: ' + e.error);
            };
        } else {
            console.warn('SpeechRecognition not supported.');
            this.micBtn.disabled = true;
        }
    }

    attachEvents() {
        this.textInput.addEventListener('input', () => {
            const text = this.textInput.value.trim();
            this.convertToBraille(text);
        });

        this.readAloudBtn.addEventListener('click', () => {
            const text = this.textInput.value.trim();
            if (text) this.readAloud(text);
        });

        this.micBtn.addEventListener('click', () => {
            if (this.recognition) {
                this.recognition.start();
            }
        });
    }

    convertToBraille(text) {
        if (!text) {
            this.brailleOutput.textContent = '';
            return;
        }

        fetch('/api/text-to-braille', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        })
            .then(res => res.json())
            .then(data => {
                this.brailleOutput.textContent = data.braille || '';
            })
            .catch(err => {
                console.error('Braille API error:', err);
                alert('Braille conversion failed.');
            });
    }

    async readAloud(text) {
        const langCode = this.currentLanguage === 'hindi' ? 'hi-IN' : 'en-US';

        // ✅ Android WebView Native TTS
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
document.addEventListener('DOMContentLoaded', () => new TextToBrailleConverter());
