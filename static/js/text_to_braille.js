/**
 * ✅ TextToBrailleConverter with Hindi/English Read Aloud & Microphone
 * ✅ Works on Android WebView and browser
 */
class TextToBrailleConverter {
    constructor() {
        this.textInput = document.getElementById('textInput');
        this.readAloudBtn = document.getElementById('readAloudBtn');
        this.micButton = document.getElementById('micButton');
        this.languageRadios = document.querySelectorAll('input[name="language"]');
        this.synth = window.speechSynthesis;
        this.isAndroidWebView = this.detectAndroidWebView();
        this.currentLanguage = 'english';

        this.setupLanguageSelector();
        this.setupSpeechRecognition();
        this.initializeEvents();
    }

    detectAndroidWebView() {
        return typeof window.AndroidInterface !== 'undefined' &&
               typeof window.AndroidInterface.speakText === 'function';
    }

    setupLanguageSelector() {
        this.languageRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                this.currentLanguage = radio.value;
                this.updateRecognitionLanguage();
            });
        });
    }

    setupSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.updateRecognitionLanguage();

            this.recognition.onresult = (event) => {
                let transcript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript;
                }
                this.textInput.value = transcript;
                this.convertTextToBraille();
            };

            this.recognition.onerror = (e) => console.error('Microphone Error:', e.error);
        } else {
            console.warn('SpeechRecognition not supported.');
            this.micButton.disabled = true;
        }
    }

    updateRecognitionLanguage() {
        if (this.recognition) {
            this.recognition.lang = this.currentLanguage === 'hindi' ? 'hi-IN' : 'en-US';
        }
    }

    initializeEvents() {
        this.readAloudBtn.addEventListener('click', () => this.readAloud());
        this.micButton.addEventListener('click', () => this.toggleMic());
        this.textInput.addEventListener('input', () => this.convertTextToBraille());
    }

    toggleMic() {
        if (this.recognition) {
            this.recognition.start();
        }
    }

    async readAloud() {
        const text = this.textInput.value.trim();
        const langCode = this.currentLanguage === 'hindi' ? 'hi-IN' : 'en-US';

        if (!text) return;

        // ✅ Android WebView Native TTS
        if (this.isAndroidWebView) {
            try {
                window.AndroidInterface.speakText(text, langCode);
                return;
            } catch (e) {
                console.warn('Android TTS failed:', e);
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
        } catch (e) {
            console.warn('Backend TTS failed:', e);
        }

        // ✅ Web Speech API Fallback
        if (this.synth) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = langCode;
            this.synth.speak(utterance);
        }
    }

    convertTextToBraille() {
        const text = this.textInput.value.trim();
        if (!text) return;

        fetch('/api/text-to-braille', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
        })
            .then(res => res.json())
            .then(data => {
                document.getElementById('brailleOutput').textContent = data.braille || '';
                this.displayDetailedMapping(data.detailed_mapping || []);
            })
            .catch(err => console.error('Braille API error:', err));
    }

    displayDetailedMapping(mapping) {
        const table = document.getElementById('detailedMapping');
        table.innerHTML = '';
        if (!mapping.length) return;

        mapping.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${item.original}</td><td>${item.braille}</td>`;
            table.appendChild(row);
        });
    }
}
document.addEventListener('DOMContentLoaded', () => new TextToBrailleConverter());
