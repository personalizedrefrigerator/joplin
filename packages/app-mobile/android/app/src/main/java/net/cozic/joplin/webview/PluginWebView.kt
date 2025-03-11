package net.cozic.joplin.webview

import android.Manifest
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.util.Log
import android.webkit.MimeTypeMap
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.webkit.WebViewCompat
import com.facebook.drawee.backends.pipeline.PipelineDraweeControllerBuilder
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.events.RCTEventEmitter
import java.io.FileInputStream
import kotlin.collections.ArrayList

private class LocalContentWebViewClient(
    private val onLoadError: (description: String)->Unit,
    private val onLoadFinished: ()->Unit,
    private val onLoadStart: ()->Unit
): WebViewClient() {
    var defaultResponseHtml = "Test!";
    private var allowFileAccessTo = emptyList<String>()

    override fun shouldInterceptRequest(
        view: WebView,
        request: WebResourceRequest
    ): WebResourceResponse? {
        Log.i("PluginWebView", "shouldInterceptRequest: ${request.url.host}/${request.url.encodedPath}")
        val path = request.url.path ?: "/";
        if (request.url.host == "local-content.joplinapp.org") {
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

class PluginWebView(
    private val context: ThemedReactContext,
    newDraweeControllerBuilder: PipelineDraweeControllerBuilder,
    callerContext: ReactApplicationContext,
): WebView(context) {
    private var lastInjectedJs = ""
    private val localWebViewClient = LocalContentWebViewClient(
        onLoadError = { description ->
            Log.i("PluginWebView", "Load error! ${description}")
            val event = Arguments.createMap().apply {
                putString("description", description)
            }
            context.getJSModule(RCTEventEmitter::class.java)
                .receiveEvent(id, "error", event)
        },
        onLoadStart = {
            evaluateJavascript(lastInjectedJs, null)

            Log.i("PluginWebView", "Load start!")
            val event = Arguments.createMap()
            context.getJSModule(RCTEventEmitter::class.java)
                .receiveEvent(id, "loadStart", event)
        },
        onLoadFinished = {
            Log.i("PluginWebView", "Load finished!")
            val event = Arguments.createMap()
            context.getJSModule(RCTEventEmitter::class.java)
                .receiveEvent(id, "loadEnd", event)
        },
    )
    val bridgeListener =
        WebViewCompat.WebMessageListener { view, message, sourceOrigin, isMainFrame, replyProxy ->
            val event = Arguments.createMap().apply {
                putString("data", message.data)
            }
            context.getJSModule(RCTEventEmitter::class.java)
                .receiveEvent(id, "message", event)
        }
    init {
        webViewClient = localWebViewClient
        webChromeClient = LocalContentChrome(context)
        settings.javaScriptEnabled = true
        settings.mediaPlaybackRequiresUserGesture = false
        loadUrl("https://local-content.joplinapp.org/webview/")

        WebViewCompat.addWebMessageListener(
            this,
            "ReactNativeWebView",
            setOf("https://local-content.joplinapp.org"),
            bridgeListener
        )
        setWebContentsDebuggingEnabled(true)

        setBackgroundColor(0xff0000)
    }
    
    fun setInjectedJs(js: String) {
        lastInjectedJs = js
        evaluateJavascript(js, null)
    }

    fun setDefaultResponseHtml(html: String) {
        if (html != localWebViewClient.defaultResponseHtml) {
            Log.i("PluginWebView", "Change default HTML to ${html}")
            localWebViewClient.defaultResponseHtml = html
            reload()
        }
    }

    fun setAllowFileAccessToDirs(dirs: List<String>) {
        localWebViewClient.setAllowFileAccessTo(dirs)
    }
}