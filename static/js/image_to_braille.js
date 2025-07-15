/**
 * Enhanced Image to Braille Converter with client-side TTS
 * Supports: Chrome, Android WebView, Hindi/English TTS
 */

class ImageToBrailleConverter {
    constructor() {
        this.uploadArea = document.getElementById('uploadArea');
        this.imageInput = document.getElementById('imageInput');
        this.uploadPrompt = document.getElementById('uploadPrompt');
        this.imagePreview = document.getElementById('imagePreview');
        this.previewImg = document.getElementById('previewImg');
        this.fileName = document.getElementById('fileName');
        this.processBtn = document.getElementById('processBtn');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.resultsSection = document.getElementById('resultsSection');
        this.extractedText = document.getElementById('extractedText');
        this.readExtractedBtn = document.getElementById('readExtractedBtn');
        this.brailleOutput = document.getElementById('brailleOutput');
        this.characterMapping = document.getElementById('characterMapping');
        this.mappingDisplay = document.getElementById('mappingDisplay');
        this.errorDisplay = document.getElementById('errorDisplay');
        this.errorMessage = document.getElementById('errorMessage');
        
        // Language support
        this.currentLanguage = 'english';
        
        // TTS systems
        this.synth = window.speechSynthesis;
        this.isAndroidWebView = this.detectAndroidWebView();
        this.selectedFile = null;
        
        this.initializeEvents();
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
        // Upload area events
        this.uploadArea.addEventListener('click', () => {
            this.imageInput.click();
        });
        
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        
        // File input change
        this.imageInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Process button
        this.processBtn.addEventListener('click', () => this.processImage());
        
        // Read aloud button
        this.readExtractedBtn.addEventListener('click', () => this.readExtractedText());
    }
    
    /**
     * Setup language selector
     */
    setupLanguageSelector() {
        const languageRadios = document.querySelectorAll('input[name="language"]');
        languageRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                this.currentLanguage = radio.value;
            });
        });
        
        // Set initial language
        const checkedRadio = document.querySelector('input[name="language"]:checked');
        if (checkedRadio) {
            this.currentLanguage = checkedRadio.value;
        }
    }
    

    

    
    /**
     * Handle drag over event
     */
    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('border-primary');
    }
    
    /**
     * Handle drop event
     */
    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('border-primary');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.handleFile(files[0]);
        }
    }
    
    /**
     * Handle file selection
     */
    handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            this.handleFile(files[0]);
        }
    }
    
    /**
     * Handle file validation and preview
     */
    handleFile(file) {
        // Validate file type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/bmp', 'image/tiff'];
        if (!allowedTypes.includes(file.type)) {
            this.showError('Invalid file type. Please upload an image file.');
            return;
        }
        
        // Validate file size (16MB)
        if (file.size > 16 * 1024 * 1024) {
            this.showError('File too large. Maximum size is 16MB.');
            return;
        }
        
        this.selectedFile = file;
        this.showImagePreview(file);
        this.processBtn.disabled = false;
        this.hideError();
        this.hideResults();
    }
    
    /**
     * Show image preview
     */
    showImagePreview(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.previewImg.src = e.target.result;
            this.fileName.textContent = file.name;
            this.uploadPrompt.classList.add('d-none');
            this.imagePreview.classList.remove('d-none');
        };
        reader.readAsDataURL(file);
    }
    
    /**
     * Process uploaded image
     */
    async processImage() {
        if (!this.selectedFile) return;
        
        this.showLoading();
        this.hideError();
        this.hideResults();
        
        const formData = new FormData();
        formData.append('image', this.selectedFile);
        formData.append('language', this.currentLanguage);
        
        try {
            const response = await fetch('/api/upload-image', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.displayResults(data);
            } else {
                this.showError(data.error || 'Failed to process image');
            }
        } catch (error) {
            console.error('Processing error:', error);
            this.showError('Failed to process image. Please try again.');
        } finally {
            this.hideLoading();
        }
    }
    
    /**
     * Display image processing results
     */
    displayResults(data) {
        // Clear any placeholder text and display extracted text with proper styling
        this.extractedText.innerHTML = '';
        this.extractedText.style.color = '#212529';
        this.extractedText.style.fontWeight = '500';
        this.extractedText.textContent = data.extracted_text;
        this.readExtractedBtn.disabled = false;
        
        // Display Braille output with enhanced visibility
        this.brailleOutput.innerHTML = `<span class="braille-text" style="color: #007bff; font-size: 24px; font-weight: bold;">${data.braille_text}</span>`;
        
        // Show character mapping
        this.displayCharacterMapping(data.extracted_text, data.braille_text);
        
        // Show results section
        this.resultsSection.classList.remove('d-none');
    }
    
    /**
     * Display character mapping
     */
    displayCharacterMapping(originalText, brailleText) {
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
    }
    
    /**
     * Enhanced Text-to-Speech with multiple fallback systems
     */
    async readExtractedText() {
        const text = this.extractedText.textContent.trim();
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
        return false;
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
            this.readExtractedBtn.disabled = true;
            this.readExtractedBtn.innerHTML = '<i class="fas fa-stop me-2"></i>Speaking...';
        } else {
            this.readExtractedBtn.disabled = false;
            this.readExtractedBtn.innerHTML = '<i class="fas fa-volume-up me-2"></i>Read Aloud';
        }
    }
    
    /**
     * Show loading state
     */
    showLoading() {
        this.loadingSpinner.classList.remove('d-none');
        this.processBtn.disabled = true;
    }
    
    /**
     * Hide loading state
     */
    hideLoading() {
        this.loadingSpinner.classList.add('d-none');
        this.processBtn.disabled = false;
    }
    
    /**
     * Show error message
     */
    showError(message) {
        this.errorMessage.textContent = message;
        this.errorDisplay.classList.remove('d-none');
    }
    
    /**
     * Hide error message
     */
    hideError() {
        this.errorDisplay.classList.add('d-none');
    }
    
    /**
     * Hide results section
     */
    hideResults() {
        this.resultsSection.classList.add('d-none');
    }
}

// Initialize the converter when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ImageToBrailleConverter();
});