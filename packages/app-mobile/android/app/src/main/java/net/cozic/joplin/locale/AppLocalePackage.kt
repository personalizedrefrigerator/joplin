package net.cozic.joplin.locale

import androidx.appcompat.app.AppCompatDelegate
import androidx.core.os.LocaleListCompat
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.uimanager.ViewManager

class AppLocalePackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf<NativeModule>(AppLocaleModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }

    class AppLocaleModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context), LifecycleEventListener {
        override fun getName() = "AppLocaleModule"

        override fun onHostResume() { }
        override fun onHostPause() { }
        override fun onHostDestroy() { }

        @ReactMethod
        fun setAppLocale(languageCode: String, promise: Promise) {
            // See https://github.com/w3c/matf/issues/14#issuecomment-2536793357
            val locales = LocaleListCompat.forLanguageTags(languageCode)
            AppCompatDelegate.setApplicationLocales(locales)
            promise.resolve(languageCode)
        }
    }
}