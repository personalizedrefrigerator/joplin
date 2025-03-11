package net.cozic.joplin.webview

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext

class CustomWebViewPackage : ReactPackage {
    override fun createNativeModules(
        context: ReactApplicationContext
    ) = emptyList<NativeModule>()

    override fun createViewManagers(
        context: ReactApplicationContext
    ) = listOf(PluginWebViewManager(context))
}