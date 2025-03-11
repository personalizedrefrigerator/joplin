package net.cozic.joplin.webview

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

class PluginWebViewManager(callerContext: ReactApplicationContext) : SimpleViewManager<PluginWebView>() {
    override fun getName() = REACT_CLASS

    override fun createViewInstance(context: ThemedReactContext) = PluginWebView(context)

    override fun getCommandsMap() = mapOf("injectJs" to COMMAND_INJECT_JS)

    override fun receiveCommand(root: PluginWebView, commandId: String, args: ReadableArray?) {
        super.receiveCommand(root, commandId, args)

        if (commandId.toInt() == COMMAND_INJECT_JS) {
            val js = requireNotNull(args).getString(0)
            root.evaluateJavascript(js, null)
        }
    }

    @ReactProp(name="allowFileAccessToDirectories")
    fun setAllowFileAccessToDirectories(view: PluginWebView, dirs: ReadableArray?) {
        if (dirs == null) {
            view.setAllowFileAccessToDirs(emptyList())
        } else {
            view.setAllowFileAccessToDirs(dirs.toArrayList() as List<String>)
        }
    }

    @ReactProp(name="html")
    fun setHtml(view: PluginWebView, html: String?) {
        view.setDefaultResponseHtml(html ?: "")
    }

    @ReactProp(name="injectedJavaScript")
    fun setInjectedJavaScript(view: PluginWebView, js: String?) {
        if (js != null) {
            view.setInjectedJs(js)
        }
    }

    @ReactProp(name="debuggingEnabled", defaultBoolean = false)
    fun setDebuggingEnabled(view: PluginWebView, allowDebugging: Boolean) {
        view.setDebuggingEnabled(allowDebugging)
    }

    override fun getExportedCustomDirectEventTypeConstants() =
        mutableMapOf(
            "error" to mapOf("registrationName" to "onError"),
            "loadEnd" to mapOf("registrationName" to "onLoadEnd"),
            "loadStart" to mapOf("registrationName" to "onLoadStart"),
            "message" to mapOf("registrationName" to "onMessage"),
        )

    companion object {
        private const val REACT_CLASS = "RCTPluginWebView"
        private const val COMMAND_INJECT_JS = 1
    }
}