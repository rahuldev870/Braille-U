package com.example.brailleworld;

import android.content.Context;
import android.webkit.JavascriptInterface;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.Manifest;
import android.content.pm.PackageManager;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import android.util.Log;
import java.util.Locale;

/**
 * Android WebView interface for Braille World web app
 * Provides native TTS and microphone permission handling
 */
public class WebAppInterface {
    private Context mContext;
    private TextToSpeech tts;
    private MainActivity mainActivity;
    private static final String TAG = "WebAppInterface";
    
    public WebAppInterface(Context context, MainActivity activity) {
        mContext = context;
        mainActivity = activity;
        initializeTTS();
    }
    
    /**
     * Initialize Text-to-Speech engine
     */
    private void initializeTTS() {
        tts = new TextToSpeech(mContext, new TextToSpeech.OnInitListener() {
            @Override
            public void onInit(int status) {
                if (status == TextToSpeech.SUCCESS) {
                    // Set up utterance progress listener
                    tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                        @Override
                        public void onStart(String utteranceId) {
                            Log.d(TAG, "TTS started: " + utteranceId);
                        }
                        
                        @Override
                        public void onDone(String utteranceId) {
                            Log.d(TAG, "TTS finished: " + utteranceId);
                            // Notify web app that speech is complete
                            mainActivity.runOnUiThread(() -> {
                                mainActivity.webView.evaluateJavascript(
                                    "if (window.onTTSComplete) window.onTTSComplete();", 
                                    null
                                );
                            });
                        }
                        
                        @Override
                        public void onError(String utteranceId) {
                            Log.e(TAG, "TTS error: " + utteranceId);
                            // Notify web app of error
                            mainActivity.runOnUiThread(() -> {
                                mainActivity.webView.evaluateJavascript(
                                    "if (window.onTTSError) window.onTTSError('" + utteranceId + "');", 
                                    null
                                );
                            });
                        }
                    });
                    
                    Log.d(TAG, "TTS initialized successfully");
                } else {
                    Log.e(TAG, "TTS initialization failed");
                }
            }
        });
    }
    
    /**
     * Speak text with specified language
     * Called from JavaScript
     */
    @JavascriptInterface
    public void speakText(String text, String language) {
        if (tts != null) {
            try {
                // Set language based on parameter
                Locale locale;
                if ("hi-IN".equals(language) || "hindi".equals(language)) {
                    locale = new Locale("hi", "IN");
                } else {
                    locale = Locale.US;
                }
                
                int result = tts.setLanguage(locale);
                
                if (result == TextToSpeech.LANG_MISSING_DATA || 
                    result == TextToSpeech.LANG_NOT_SUPPORTED) {
                    Log.w(TAG, "Language not supported: " + language + ", using default");
                    tts.setLanguage(Locale.US);
                }
                
                // Set speech parameters
                tts.setSpeechRate(0.8f);
                tts.setPitch(1.0f);
                
                // Speak the text
                tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "tts_" + System.currentTimeMillis());
                
                Log.d(TAG, "Speaking text: " + text.substring(0, Math.min(50, text.length())));
                
            } catch (Exception e) {
                Log.e(TAG, "Error in speakText: " + e.getMessage());
            }
        } else {
            Log.e(TAG, "TTS not initialized");
        }
    }
    
    /**
     * Stop speech synthesis
     * Called from JavaScript
     */
    @JavascriptInterface
    public void stopSpeech() {
        if (tts != null) {
            tts.stop();
            Log.d(TAG, "Speech stopped");
        }
    }
    
    /**
     * Check if TTS is available
     * Called from JavaScript
     */
    @JavascriptInterface
    public boolean isTTSAvailable() {
        return tts != null;
    }
    
    /**
     * Request microphone permission
     * Called from JavaScript
     */
    @JavascriptInterface
    public void requestMicrophonePermission() {
        if (ContextCompat.checkSelfPermission(mContext, Manifest.permission.RECORD_AUDIO) 
            != PackageManager.PERMISSION_GRANTED) {
            
            ActivityCompat.requestPermissions(mainActivity, 
                new String[]{Manifest.permission.RECORD_AUDIO}, 
                MainActivity.MICROPHONE_PERMISSION_REQUEST_CODE);
            
            Log.d(TAG, "Requesting microphone permission");
        } else {
            Log.d(TAG, "Microphone permission already granted");
        }
    }
    
    /**
     * Check microphone permission status
     * Called from JavaScript
     */
    @JavascriptInterface
    public boolean hasMicrophonePermission() {
        return ContextCompat.checkSelfPermission(mContext, Manifest.permission.RECORD_AUDIO) 
               == PackageManager.PERMISSION_GRANTED;
    }
    
    /**
     * Get device language
     * Called from JavaScript
     */
    @JavascriptInterface
    public String getDeviceLanguage() {
        return Locale.getDefault().getLanguage();
    }
    
    /**
     * Show toast message
     * Called from JavaScript for debugging
     */
    @JavascriptInterface
    public void showToast(String message) {
        mainActivity.runOnUiThread(() -> {
            android.widget.Toast.makeText(mContext, message, android.widget.Toast.LENGTH_SHORT).show();
        });
    }
    
    /**
     * Cleanup resources
     */
    public void cleanup() {
        if (tts != null) {
            tts.stop();
            tts.shutdown();
            tts = null;
        }
    }
}