package net.cozic.joplin.webview

import android.Manifest
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.os.Build
import android.util.AttributeSet
import android.util.Log
import android.webkit.JavascriptInterface
import android.webkit.MimeTypeMap
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import com.facebook.drawee.backends.pipeline.PipelineDraweeControllerBuilder
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.events.RCTEventEmitter
import java.io.FileInputStream
import java.util.UUID
import kotlin.collections.ArrayList

// Android WebViews disallow the use of certain APIs from file:// URIs.
// To allow using getUserMedia and similar APIs, this WebView handles
// requests to local-content.joplinapp.org, responding with local content
// rather than the actual content of https://local-content.joplinapp.org/.
// Some other domain could also have been chosen.
private const val localContentHost = "local-content.joplinapp.org"

class PluginWebView(private val context: ThemedReactContext): WebView(context) {

    // Legacy message handler only
    private var messageHandlerJs = ""
    private var messageHandlerKey = UUID.randomUUID().toString()

    // JavaScript needs to be re-injected when the WebView reloads. This
    // stores the last injected JS to ensure that the injectedJavaScript prop
    // is persistent
    private var lastInjectedJs = ""

    private fun emitRNEvent(eventName: String, arguments: WritableMap) {
        context.getJSModule(RCTEventEmitter::class.java)
            .receiveEvent(id, eventName, arguments)
    }
    private fun sendMessageEventToRN(data: String?, origin: String) {
        val event = Arguments.createMap().apply {
            putString("data", data)
            putString("origin", origin)
        }
        emitRNEvent("message", event)
    }

    private val localWebViewClient = LocalContentWebViewClient(
        onLoadError = { description ->
            Log.e("PluginWebView", "Load error: $description")
            val event = Arguments.createMap().apply {
                putString("description", description)
            }
            emitRNEvent("error", event)
        },
        onLoadStart = {
            evaluateJavascript(messageHandlerJs, null)
            evaluateJavascript(lastInjectedJs, null)

            Log.i("PluginWebView", "Load start!")
            emitRNEvent("loadStart", Arguments.createMap())
        },
        onLoadFinished = {
            Log.i("PluginWebView", "Load finished!")
            emitRNEvent("loadEnd", Arguments.createMap())
        },
    )

    init {
        webViewClient = localWebViewClient
        webChromeClient = LocalContentChrome(context)
        setWebContentsDebuggingEnabled(false)
        settings.javaScriptEnabled = true
        settings.mediaPlaybackRequiresUserGesture = false
        loadUrl("https://$localContentHost/webview/")

        // The plugin runner WebView is strictly for background content and should be neither
        // visible nor accessible with the keyboard or accessibility tools.
        visibility = INVISIBLE
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            focusable = NOT_FOCUSABLE
        }
        importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS
    }

    // Add support for the ReactNativeWebView.postMessage API:
    private inner class LegacyJSInterface {
        @JavascriptInterface
        fun postMessage(message: String, key: String): Unit {
            if (key != messageHandlerKey) {
                throw RuntimeException("Invalid access key for postMessage: $key")
            }
            sendMessageEventToRN(message, "unknown")
        }
    }
    private val bridgeListener =
        WebViewCompat.WebMessageListener { view, message, sourceOrigin, isMainFrame, replyProxy ->
            sendMessageEventToRN(message.data, sourceOrigin.host ?: "unknown")
        }
    init {
        // It's unclear how widely supported the WEB_MESSAGE_LISTENER feature is. As such,
        // like React Native WebView, we provide a fallback for older WebView versions
        if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            WebViewCompat.addWebMessageListener(
                this,
                "ReactNativeWebView",
                setOf("https://$localContentHost"),
                bridgeListener
            )
        } else {
            fun quoteUuid(key: String): String {
                if (!key.matches(Regex("^[a-z0-9_\\-]+$"))) {
                    throw AssertionError("UUID contains unsupported characters: $key")
                }
                return "'$key'"
            }

            Log.i("PluginWebView", "Falling back to legacy message handler")
            messageHandlerJs = "window.ReactNativeWebView = {" +
                    "  postMessage(message) { " +
                    //   JavaScript interfaces can be accessed from iframes. To prevent plugin background
                    //   pages from accessing the ReactNativeWebView.postMessage function directly, we
                    //   also require an automatically-generated "API key".
                    "    const key = ${quoteUuid(messageHandlerKey)};" +
                    "    ReactNativeWebView_.postMessage(message, key);" +
                    "  }" +
                    "}"
            addJavascriptInterface(LegacyJSInterface(), "ReactNativeWebView_")
        }
    }
    
    fun setInjectedJs(js: String) {
        lastInjectedJs = js
        evaluateJavascript(js, null)
    }

    fun setDefaultResponseHtml(html: String) {
        if (html != localWebViewClient.defaultResponseHtml) {
            localWebViewClient.defaultResponseHtml = html
            reload()
        }
    }

    fun setAllowFileAccessToDirs(dirs: List<String>) {
        localWebViewClient.setAllowFileAccessTo(dirs)
    }

    private var debuggingEnabled = false
    fun setDebuggingEnabled(debugging: Boolean) {
        if (debugging != debuggingEnabled) {
            Log.d("PluginWebView", "Debug mode set to: $debugging")
            setWebContentsDebuggingEnabled(debugging)
        }
    }
}


private class LocalContentWebViewClient(
    private val onLoadError: (description: String)->Unit,
    private val onLoadFinished: ()->Unit,
    private val onLoadStart: ()->Unit
): WebViewClient() {
    var defaultResponseHtml = "Loading!";
    private var allowFileAccessTo = emptyList<String>()

    override fun shouldInterceptRequest(
        view: WebView,
        request: WebResourceRequest
    ): WebResourceResponse? {
        Log.i("PluginWebView", "shouldInterceptRequest: ${request.url.host}/${request.url.encodedPath}")
        val path = request.url.path ?: "/";
        if (request.url.host == localContentHost) {
            if (request.url.path == "/webview/") {
                val data = defaultResponseHtml.byteInputStream()
                return WebResourceResponse(
                    "text/html",
                    "utf-8",
                    data,
                )
            } else if (!path.contains("..") && allowFileAccessTo.any { dir -> path.startsWith(dir) }) {
                val stream = FileInputStream(path)
                val extension = MimeTypeMap.getFileExtensionFromUrl(request.url.toString())
                val response = WebResourceResponse(
                    MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension),
                    "utf-8",
                    stream
                )
                return response
            }

            val errorResult = WebResourceResponse(
                "text/html",
                "utf-8",
                "Not found".byteInputStream(),
            )
            errorResult.setStatusCodeAndReasonPhrase(404, "NOT_FOUND")
            return errorResult
        }
        return super.shouldInterceptRequest(view, request)
    }

    override fun onReceivedError(
        view: WebView,
        request: WebResourceRequest,
        error: WebResourceError
    ) {
        super.onReceivedError(view, request, error)
        onLoadError("Load error: ${error.description}");
    }

    override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
        super.onPageStarted(view, url, favicon)
        onLoadStart()
    }

    override fun onPageFinished(view: WebView?, url: String?) {
        super.onPageFinished(view, url)
        onLoadFinished()
    }

    fun setAllowFileAccessTo(dirs: List<String>) {
        allowFileAccessTo = dirs
    }
}

private class LocalContentChrome(private val context: ThemedReactContext): WebChromeClient() {
    override fun onPermissionRequest(request: PermissionRequest) {
        if (request.origin.host != localContentHost) {
            Log.w("PluginWebView", "Denied permission request from ${request.origin.host}")
            request.deny()
        }
        context.runOnUiQueueThread {
            Log.i("PluginWebView", "request permission: ${request.resources.joinToString()}")
            // See https://github.com/react-native-webview/react-native-webview/pull/1239/files#diff-e9700631fc9fa5600d2e1ee70eb2d28aa2a1fbc695b85f99981972d3904ca485R1214
            val grantedPermissions = ArrayList<String>()
            val desiredPermissions = ArrayList<String>()
            for (requested in request.resources) {
                if (requested == PermissionRequest.RESOURCE_AUDIO_CAPTURE) {
                    if (context.checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
                        grantedPermissions.add(requested)
                    } else {
                        desiredPermissions.add(Manifest.permission.RECORD_AUDIO)
                    }
                }
            }
            Log.i("PluginWebView", "granted permission: ${grantedPermissions.joinToString()}")
            if (desiredPermissions.isEmpty()) {
                request.grant(request.resources)
            } else {
                Log.i("PluginWebView", "missing permission: ${desiredPermissions.joinToString()}")
                request.deny()
            }
        }
    }
}
