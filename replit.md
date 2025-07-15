# Braille World - Project Documentation

## Overview
A comprehensive Flask-based Braille accessibility web application with text-to-Braille, image-to-Braille, and speech recognition features. The application supports both English and Hindi languages with advanced client-side TTS and Android WebView compatibility.

## Recent Changes (July 2025)

### Enhanced JavaScript Architecture
- **Created standalone JavaScript modules**: `text_to_braille.js` and `image_to_braille.js`
- **Implemented multi-language support**: Dynamic switching between English (`en-US`) and Hindi (`hi-IN`)
- **Added client-side TTS**: Removed backend dependency for Text-to-Speech functionality
- **Microphone support**: Voice input available in text-to-braille service only
- **Android WebView compatibility**: Native TTS and microphone permission handling

### Key Features Implemented
1. **Client-Side TTS System**:
   - Android WebView native TTS (primary)
   - Web Speech API fallback
   - Placeholder for Edge TTS (Microsoft Azure Speech SDK)
   - Multi-language support (English/Hindi)

2. **Enhanced Speech Recognition**:
   - Google Web Speech API integration
   - Dynamic language switching
   - Improved error handling and user feedback
   - Android WebView permission management

3. **Microphone Support in Text Service**:
   - Voice input for text processing (text-to-braille service only)
   - Language-aware speech recognition
   - Visual feedback for voice status
   - Seamless integration with existing UI

### Technical Architecture

#### Frontend (JavaScript)
- **text_to_braille.js**: Text input with voice recognition and TTS
- **image_to_braille.js**: Image processing with added voice input capability
- **Android WebView Interface**: Native Java bridge for TTS and permissions

#### Backend (Python/Flask)
- **Braille conversion API**: `/api/convert-text` and `/api/upload-image`
- **OCR processing**: Tesseract with Hindi/English support
- **Enhanced Hindi Braille mapping**: Comprehensive support for matras and compound characters

#### Android Integration
- **WebAppInterface.java**: Native TTS and permission handling
- **MainActivity.java**: WebView setup with proper permissions
- **Cross-platform compatibility**: Works on Chrome, mobile browsers, and Android WebView

### User Experience Improvements
- **Enhanced navigation**: Back buttons with browser history support
- **Improved text visibility**: Fixed extracted text display issues
- **Language-specific TTS**: Proper pronunciation for Hindi and English
- **Responsive design**: Mobile-friendly interface
- **Error handling**: Comprehensive error messages and fallbacks

### Deployment Configuration
- **Render.com ready**: `render.yaml` and `Procfile` configured
- **VS Code compatibility**: Proper `main.py` structure
- **Android APK ready**: WebView interface for native app conversion
- **Cross-platform deployment**: Heroku, Render, and local development support

## Architecture Components

### Language Support
- **English**: Full speech recognition and TTS
- **Hindi**: Comprehensive Braille mapping with matras support
- **Dynamic switching**: Runtime language selection

### TTS Priority System
1. Android WebView native TTS (best quality)
2. Web Speech API (browser fallback)
3. Edge TTS (future implementation)

### Speech Recognition
- **Google Web Speech API**: webkitSpeechRecognition
- **Multi-language**: `en-US` and `hi-IN` support
- **Error handling**: Comprehensive error messages
- **Permission management**: Android WebView integration

## User Preferences
- **Navigation**: Enhanced back buttons with browser history
- **Text visibility**: Dark, readable text for extracted content
- **Language support**: Seamless Hindi/English switching
- **Mobile compatibility**: Responsive design for all devices

## Development Status
- ✅ Core functionality working
- ✅ Client-side TTS implemented
- ✅ Multi-language support added
- ✅ Android WebView compatibility
- ✅ Enhanced navigation system
- ✅ Deployment configuration complete

## Next Steps
- Integration with Edge TTS for premium voice quality
- Advanced OCR preprocessing for better text extraction
- Offline functionality for Android app
- Voice command navigation
- Additional language support (other Indian languages)

## Technical Notes
- Uses Flask 3.0+ with modern JavaScript ES6+
- Tesseract OCR for text extraction
- Bootstrap 5 for responsive UI
- Font Awesome for icons
- Comprehensive error handling throughout