/**
 * Enhanced Text to Braille Converter with client-side TTS and multi-language support
 * Supports: Chrome, Android WebView, Hindi/English TTS and Speech Recognition
 */

class TextToBrailleConverter {
    constructor() {
        this.textInput = document.getElementById('textInput');
        this.micButton = document.getElementById('micButton');
        this.readAloudBtn = document.getElementById('readAloudBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.brailleOutput = document.getElementById('brailleOutput');
        this.voiceStatus = document.getElementById('voiceStatus');
        this.statusText = document.getElementById('statusText');
        this.characterMapping = document.getElementById('characterMapping');
        this.mappingDisplay = document.getElementById('mappingDisplay');
        
        // Language support
        this.currentLanguage = 'english';
        this.languageSelector = document.querySelector('input[name="language"]:checked');
        
        // Speech recognition
        this.recognition = null;
        this.isListening = false;
        
        // TTS systems
        this.synth = window.speechSynthesis;
        this.isAndroidWebView = this.detectAndroidWebView();
        
        this.initializeEvents();
        this.setupSpeechRecognition();
        this.setupLanguageSelector();
    }
    
    /**
     * Detect if running in Android WebView
     */
    detectAndroidWebView() {
        return typeof window.AndroidInterface !== 'undefined' && 
               typeof window.AndroidInterface.speakText === 'function';
    }
    
    /**
     * Initialize event listeners
     */
    initializeEvents() {
        this.textInput.addEventListener('input', () => this.convertText());
        this.micButton.addEventListener('click', () => this.toggleVoiceRecognition());
        this.readAloudBtn.addEventListener('click', () => this.readAloud());
        this.clearBtn.addEventListener('click', () => this.clearAll());
    }
    
    /**
     * Setup language selector if available
     */
    setupLanguageSelector() {
        const languageRadios = document.querySelectorAll('input[name="language"]');
        languageRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                this.currentLanguage = radio.value;
                this.updateSpeechRecognitionLanguage();
                this.convertText(); // Re-convert with new language
            });
        });
        
        // Set initial language
        const checkedRadio = document.querySelector('input[name="language"]:checked');
        if (checkedRadio) {
            this.currentLanguage = checkedRadio.value;
        }
    }
    
    /**
     * Setup speech recognition with multi-language support
     */
    setupSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.updateSpeechRecognitionLanguage();
            
            this.recognition.onstart = () => {
                this.isListening = true;
                this.updateMicButton();
                this.showVoiceStatus('Listening... Speak now!');
            };
            
            this.recognition.onresult = (event) => {
                let finalTranscript = '';
                let interimTranscript = '';
                
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }
                
                if (finalTranscript) {
                    this.textInput.value = finalTranscript;
                    this.convertText();
                    this.showVoiceStatus('Voice recognition completed!', 'success');
                } else {
                    this.showVoiceStatus(`Listening... "${interimTranscript}"`);
                }
            };
            
            this.recognition.onerror = (event) => {
                this.isListening = false;
                this.updateMicButton();
                let errorMessage = 'Voice recognition error';
                
                switch (event.error) {
                    case 'no-speech':
                        errorMessage = 'No speech detected. Try again.';
                        break;
                    case 'audio-capture':
                        errorMessage = 'Microphone not available.';
                        break;
                    case 'not-allowed':
                        errorMessage = 'Microphone permission denied.';
                        break;
                    case 'network':
                        errorMessage = 'Network error. Check connection.';
                        break;
                    default:
                        errorMessage = `Error: ${event.error}`;
                }
                
                this.showVoiceStatus(errorMessage, 'danger');
                setTimeout(() => this.hideVoiceStatus(), 3000);
            };
            
            this.recognition.onend = () => {
                this.isListening = false;
                this.updateMicButton();
                setTimeout(() => this.hideVoiceStatus(), 2000);
            };
        } else {
            this.micButton.disabled = true;
            this.micButton.title = 'Voice recognition not supported in this browser';
        }
    }
    
    /**
     * Update speech recognition language based on current selection
     */
    updateSpeechRecognitionLanguage() {
        if (this.recognition) {
            this.recognition.lang = this.currentLanguage === 'hindi' ? 'hi-IN' : 'en-US';
        }
    }
    
    /**
     * Toggle voice recognition
     */
    toggleVoiceRecognition() {
        if (!this.recognition) return;
        
        if (this.isListening) {
            this.recognition.stop();
        } else {
            // Request microphone permission for Android WebView
            if (this.isAndroidWebView && typeof window.AndroidInterface.requestMicrophonePermission === 'function') {
                window.AndroidInterface.requestMicrophonePermission();
            }
            this.recognition.start();
        }
    }
    
    /**
     * Update microphone button appearance
     */
    updateMicButton() {
        if (this.isListening) {
            this.micButton.classList.add('btn-danger');
            this.micButton.classList.remove('btn-outline-primary');
            this.micButton.innerHTML = '<i class="fas fa-stop"></i>';
            this.micButton.title = 'Click to stop listening';
        } else {
            this.micButton.classList.remove('btn-danger');
            this.micButton.classList.add('btn-outline-primary');
            this.micButton.innerHTML = '<i class="fas fa-microphone"></i>';
            this.micButton.title = 'Click to start voice recognition';
        }
    }
    
    /**
     * Show voice status message
     */
    showVoiceStatus(message, type = 'info') {
        this.statusText.textContent = message;
        this.voiceStatus.className = `alert alert-${type}`;
        this.voiceStatus.classList.remove('d-none');
    }
    
    /**
     * Hide voice status message
     */
    hideVoiceStatus() {
        this.voiceStatus.classList.add('d-none');
    }
    
    /**
     * Convert text to Braille using backend API
     */
    async convertText() {
        const text = this.textInput.value.trim();
        
        if (!text) {
            this.brailleOutput.innerHTML = '<span class="text-muted"><i class="fas fa-braille me-2"></i>Braille text will appear here...</span>';
            this.readAloudBtn.disabled = true;
            this.characterMapping.classList.add('d-none');
            return;
        }
        
        try {
            const response = await fetch('/api/convert-text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    language: this.currentLanguage
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.displayBrailleResult(data.braille_text, data.original_text);
                this.readAloudBtn.disabled = false;
            } else {
                this.showError(data.error || 'Failed to convert text');
            }
        } catch (error) {
            console.error('Conversion error:', error);
            this.showError('Failed to convert text. Please try again.');
        }
    }
    
    /**
     * Display Braille conversion result
     */
    displayBrailleResult(brailleText, originalText) {
        this.brailleOutput.innerHTML = `<span class="braille-text">${brailleText}</span>`;
        
        // Show character mapping
        let mappingHtml = '';
        for (let i = 0; i < Math.min(originalText.length, brailleText.length); i++) {
            const char = originalText[i];
            const braille = brailleText[i];
            mappingHtml += `
                <div class="mapping-pair d-inline-block text-center me-3 mb-2">
                    <div class="braille-char">${braille}</div>
                    <div class="text-char">${char === ' ' ? '⎵' : char}</div>
                </div>
            `;
        }
        
        this.mappingDisplay.innerHTML = mappingHtml;
        this.characterMapping.classList.remove('d-none');
    }
    
    /**
     * Enhanced Text-to-Speech with multiple fallback systems
     */
    async readAloud() {
        const text = this.textInput.value.trim();
        if (!text) return;
        
        // Stop any ongoing speech
        this.stopSpeech();
        
        const language = this.currentLanguage === 'hindi' ? 'hi-IN' : 'en-US';
        
        // Try Android WebView interface first
        if (this.isAndroidWebView) {
            try {
                window.AndroidInterface.speakText(text, language);
                this.updateReadAloudButton(true);
                return;
            } catch (error) {
                console.warn('Android TTS failed, falling back to web APIs:', error);
            }
        }
        
        // Try Edge TTS (Microsoft Azure Speech SDK) if available
        if (typeof speechSynthesis !== 'undefined' && this.tryEdgeTTS(text, language)) {
            return;
        }
        
        // Fallback to Web Speech API
        this.useWebSpeechTTS(text, language);
    }
    
    /**
     * Try Edge TTS implementation
     */
    tryEdgeTTS(text, language) {
        // Edge TTS would require the Microsoft Cognitive Services Speech SDK
        // For now, this is a placeholder for future implementation
        // You would need to include the SDK and implement proper authentication
        
        // Example implementation would be:
        // const speechConfig = SpeechConfig.fromSubscription("YourSubscriptionKey", "YourRegion");
        // const synthesizer = new SpeechSynthesizer(speechConfig);
        
        return false; // Not implemented yet
    }
    
    /**
     * Use Web Speech API for TTS
     */
    useWebSpeechTTS(text, language) {
        if (!this.synth) {
            this.showError('Text-to-speech not supported in this browser');
            return;
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language;
        utterance.rate = 0.8;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        utterance.onstart = () => {
            this.updateReadAloudButton(true);
        };
        
        utterance.onend = () => {
            this.updateReadAloudButton(false);
        };
        
        utterance.onerror = (event) => {
            console.error('TTS error:', event.error);
            this.updateReadAloudButton(false);
            this.showError('Text-to-speech failed. Please try again.');
        };
        
        this.synth.speak(utterance);
    }
    
    /**
     * Stop all speech synthesis
     */
    stopSpeech() {
        // Stop Web Speech API
        if (this.synth) {
            this.synth.cancel();
        }
        
        // Stop Android WebView TTS
        if (this.isAndroidWebView && typeof window.AndroidInterface.stopSpeech === 'function') {
            window.AndroidInterface.stopSpeech();
        }
        
        this.updateReadAloudButton(false);
    }
    
    /**
     * Update read aloud button state
     */
    updateReadAloudButton(isSpeaking) {
        if (isSpeaking) {
            this.readAloudBtn.disabled = true;
            this.readAloudBtn.innerHTML = '<i class="fas fa-stop me-2"></i>Speaking...';
        } else {
            this.readAloudBtn.disabled = false;
            this.readAloudBtn.innerHTML = '<i class="fas fa-volume-up me-2"></i>Read Aloud';
        }
    }
    
    /**
     * Clear all input and output
     */
    clearAll() {
        this.textInput.value = '';
        this.brailleOutput.innerHTML = '<span class="text-muted"><i class="fas fa-braille me-2"></i>Braille text will appear here...</span>';
        this.readAloudBtn.disabled = true;
        this.characterMapping.classList.add('d-none');
        this.hideVoiceStatus();
        this.stopSpeech();
    }
    
    /**
     * Show error message
     */
    showError(message) {
        this.brailleOutput.innerHTML = `<span class="text-danger"><i class="fas fa-exclamation-triangle me-2"></i>${message}</span>`;
    }
}

// Initialize the converter when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TextToBrailleConverter();
});