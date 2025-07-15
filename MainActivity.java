package com.example.brailleworld;

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.content.pm.PackageManager;
import android.Manifest;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import android.util.Log;
import android.view.WindowManager;

/**
 * MainActivity for Braille World Android WebView App
 * Handles WebView setup, permissions, and JavaScript interface
 */
public class MainActivity extends AppCompatActivity {
    
    public WebView webView;
    private WebAppInterface webAppInterface;
    public static final int MICROPHONE_PERMISSION_REQUEST_CODE = 1001;
    private static final String TAG = "MainActivity";
    
    // Your web app URL - replace with your actual deployed URL
    private static final String WEB_APP_URL = "https://your-app-url.com";
    // For local development, you can use: "file:///android_asset/index.html"
    // or "http://10.0.2.2:5000" for local server
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        // Keep screen on while using the app
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        
        // Initialize WebView
        webView = findViewById(R.id.webview);
        setupWebView();
        
        // Initialize WebApp Interface
        webAppInterface = new WebAppInterface(this, this);
        
        // Add JavaScript interface
        webView.addJavascriptInterface(webAppInterface, "AndroidInterface");
        
        // Load the web app
        webView.loadUrl(WEB_APP_URL);
        
        Log.d(TAG, "WebView initialized and loading: " + WEB_APP_URL);
    }
    
    /**
     * Setup WebView with proper settings for the Braille World app
     */
    private void setupWebView() {
        WebSettings webSettings = webView.getSettings();
        
        // Enable JavaScript
        webSettings.setJavaScriptEnabled(true);
        
        // Enable DOM storage
        webSettings.setDomStorageEnabled(true);
        
        // Enable local storage
        webSettings.setDatabaseEnabled(true);
        
        // Enable app cache
        webSettings.setAppCacheEnabled(true);
        
        // Set user agent for better compatibility
        webSettings.setUserAgentString(webSettings.getUserAgentString() + " BrailleWorldApp");
        
        // Enable mixed content (HTTP/HTTPS)
        webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        
        // Enable file access
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowFileAccessFromFileURLs(true);
        webSettings.setAllowUniversalAccessFromFileURLs(true);
        
        // Set up WebViewClient
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                Log.d(TAG, "Page loaded: " + url);
                
                // Inject JavaScript to handle WebView-specific functionality
                String jsCode = "window.isAndroidWebView = true;";
                webView.evaluateJavascript(jsCode, null);
            }
            
            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                super.onReceivedError(view, errorCode, description, failingUrl);
                Log.e(TAG, "WebView error: " + description + " (Code: " + errorCode + ")");
            }
        });
        
        // Set up WebChromeClient for permissions and file uploads
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> {
                    String[] requestedResources = request.getResources();
                    for (String resource : requestedResources) {
                        if (resource.equals(PermissionRequest.RESOURCE_AUDIO_CAPTURE)) {
                            if (ContextCompat.checkSelfPermission(MainActivity.this, 
                                Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
                                request.grant(requestedResources);
                            } else {
                                // Request permission
                                ActivityCompat.requestPermissions(MainActivity.this,
                                    new String[]{Manifest.permission.RECORD_AUDIO},
                                    MICROPHONE_PERMISSION_REQUEST_CODE);
                            }
                            return;
                        }
                    }
                    request.deny();
                });
            }
            
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                super.onProgressChanged(view, newProgress);
                // You can add a progress bar here if needed
            }
        });
    }
    
    /**
     * Handle permission request results
     */
    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        
        if (requestCode == MICROPHONE_PERMISSION_REQUEST_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                Log.d(TAG, "Microphone permission granted");
                // Notify web app that permission was granted
                webView.evaluateJavascript(
                    "if (window.onMicrophonePermissionGranted) window.onMicrophonePermissionGranted();", 
                    null
                );
            } else {
                Log.d(TAG, "Microphone permission denied");
                // Notify web app that permission was denied
                webView.evaluateJavascript(
                    "if (window.onMicrophonePermissionDenied) window.onMicrophonePermissionDenied();", 
                    null
                );
            }
        }
    }
    
    /**
     * Handle back button press
     */
    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
    
    /**
     * Cleanup when activity is destroyed
     */
    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (webAppInterface != null) {
            webAppInterface.cleanup();
        }
        if (webView != null) {
            webView.destroy();
        }
    }
    
    /**
     * Pause WebView when activity is paused
     */
    @Override
    protected void onPause() {
        super.onPause();
        if (webView != null) {
            webView.onPause();
        }
    }
    
    /**
     * Resume WebView when activity is resumed
     */
    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) {
            webView.onResume();
        }
    }
}